# --- CloudFront distribution for S3 reports with basic auth ---

# Lambda@Edge function for basic authentication
resource "aws_lambda_function" "cloudfront_basic_auth" {
  filename         = "cloudfront_basic_auth.zip"
  function_name    = "deposit-withdraw-monitor-cloudfront-auth"
  role             = aws_iam_role.lambda_basic_auth.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.lambda_basic_auth_zip.output_base64sha256
  runtime          = "nodejs18.x"
  publish          = true
  region           = "us-east-1" # Lambda@Edge is only available in us-east-1

  tags = {
    Name = "deposit-withdraw-monitor-cloudfront-auth"
  }
}

data "archive_file" "lambda_basic_auth_zip" {
  type        = "zip"
  output_path = "cloudfront_basic_auth.zip"

  source {
    content = templatefile("${path.module}/cloudfront-lambda.js.tftpl", {
      AUTH_PASSWORD = var.report_service_password
      BUCKET_NAME   = aws_s3_bucket.reports.bucket
      BUCKET_REGION = data.aws_region.current.id
    })
    filename = "index.js"
  }
}

# IAM role for Lambda@Edge
resource "aws_iam_role" "lambda_basic_auth" {
  name = "deposit-withdraw-monitor-lambda-auth-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com",
            "edgelambda.amazonaws.com"
          ]
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_auth_execution" {
  role       = aws_iam_role.lambda_basic_auth.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Additional permissions for Lambda@Edge CloudWatch logs across regions
resource "aws_iam_role_policy" "lambda_basic_auth_logs" {
  name = "deposit-withdraw-monitor-lambda-auth-logs"
  role = aws_iam_role.lambda_basic_auth.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Add S3 read permissions to Lambda@Edge role for directory listing
resource "aws_iam_role_policy" "lambda_basic_auth_s3_read" {
  name = "deposit-withdraw-monitor-lambda-auth-s3-read"
  role = aws_iam_role.lambda_basic_auth.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:GetObjectAttributes",
          "s3:ListBucket",
          "s3:ListBucketVersions",
          "s3:ListObjectsV2",
          "s3:GetBucketLocation",
          "s3:GetBucketVersioning",
          "s3:HeadObject",
          "s3:HeadBucket"
        ]
        Resource = [
          aws_s3_bucket.reports.arn,
          "${aws_s3_bucket.reports.arn}/*"
        ]
      }
    ]
  })
}

# S3 bucket for CloudFront logs
resource "aws_s3_bucket" "cloudfront_logs" {
  bucket = "dydxopsdao-deposit-withdraw-monitor-cloudfront-logs"
}

resource "aws_s3_bucket_public_access_block" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Origin Access Control for CloudFront to access S3
resource "aws_cloudfront_origin_access_control" "reports" {
  name                              = "deposit-withdraw-monitor-reports-oac"
  description                       = "OAC for deposit-withdraw-monitor reports bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "reports" {
  origin {
    domain_name              = aws_s3_bucket.reports.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.reports.id
    origin_id                = "S3-${aws_s3_bucket.reports.bucket}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.cloudfront_logs.bucket_domain_name
    prefix          = "cloudfront-logs/"
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.reports.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    lambda_function_association {
      event_type   = "viewer-request"
      lambda_arn   = aws_lambda_function.cloudfront_basic_auth.qualified_arn
      include_body = false
    }

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "deposit-withdraw-monitor-reports"
  }
}

# Update S3 bucket policy to allow CloudFront OAC access
resource "aws_s3_bucket_policy" "reports_cloudfront_access" {
  bucket = aws_s3_bucket.reports.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.reports.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.reports.arn
          }
        }
      }
    ]
  })
}

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

# Create the Lambda function code
data "archive_file" "lambda_basic_auth_zip" {
  type        = "zip"
  output_path = "cloudfront_basic_auth.zip"

  source {
    content  = <<-EOT
      const AWS = require('aws-sdk');
      const s3 = new AWS.S3({region: 'ap-northeast-1'});
      
      exports.handler = async (event, context) => {
        const request = event.Records[0].cf.request;
        const headers = request.headers;
        const uri = request.uri;
        
        const authUser = 'viewer';
        const authPass = '${var.report_service_password}';
        
        const authString = 'Basic ' + Buffer.from(authUser + ':' + authPass).toString('base64');
        
        if (typeof headers.authorization == 'undefined' || headers.authorization[0].value != authString) {
          const body = 'Unauthorized';
          const response = {
            status: '401',
            statusDescription: 'Unauthorized',
            body: body,
            headers: {
              'www-authenticate': [{key: 'WWW-Authenticate', value:'Basic'}]
            }
          };
          return response;
        }
        
        // Handle directory listing requests
        if (uri === '/' || uri.endsWith('/')) {
          try {
            const bucketName = '${aws_s3_bucket.reports.bucket}';
            const prefix = uri === '/' ? '' : uri.slice(1); // Remove leading slash
            
            const params = {
              Bucket: bucketName,
              Prefix: prefix,
              Delimiter: '/'
            };
            
            const data = await s3.listObjectsV2(params).promise();
            
            let html = `
              <!DOCTYPE html>
              <html>
              <head>
                <title>Reports Index</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 40px; }
                  h1 { color: #333; }
                  .directory { color: #0066cc; text-decoration: none; display: block; padding: 5px 0; }
                  .directory:hover { text-decoration: underline; }
                  .file { color: #666; }
                  ul { list-style-type: none; padding-left: 0; }
                  li { margin: 5px 0; }
                </style>
              </head>
              <body>
                <h1>Reports Directory</h1>
                <p>Current path: /${prefix}</p>
                <ul>
            `;
            
            // Add parent directory link if not at root
            if (prefix !== '') {
              const parentPath = prefix.split('/').slice(0, -2).join('/');
              const parentUrl = parentPath === '' ? '/' : `/${parentPath}/`;
              html += `<li><a href="${parentUrl}" class="directory">📁 ../</a></li>`;
            }
            
            // Add subdirectories
            if (data.CommonPrefixes) {
              data.CommonPrefixes.forEach(item => {
                const folderName = item.Prefix.replace(prefix, '').replace('/', '');
                html += `<li><a href="/${item.Prefix}" class="directory">📁 ${folderName}/</a></li>`;
              });
            }
            
            // Add files (look for index.html in subdirectories)
            if (data.Contents) {
              data.Contents.forEach(item => {
                if (item.Key.endsWith('index.html')) {
                  const relativePath = item.Key.replace(prefix, '');
                  const fileName = relativePath.split('/').pop();
                  html += `<li><a href="/${item.Key}" class="file">📄 ${fileName}</a></li>`;
                }
              });
            }
            
            html += `
                </ul>
              </body>
              </html>
            `;
            
            const response = {
              status: '200',
              statusDescription: 'OK',
              headers: {
                'content-type': [{key: 'Content-Type', value: 'text/html'}],
                'cache-control': [{key: 'Cache-Control', value: 'max-age=300'}]
              },
              body: html
            };
            
            return response;
            
          } catch (error) {
            console.log('S3 Error:', error);
            const response = {
              status: '500',
              statusDescription: 'Internal Server Error',
              body: `Error listing directory: ${error.message}`
            };
            return response;
          }
        }
        
        // For file requests, pass through to S3
        return request;
      };
    EOT
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
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.reports.arn,
          "${aws_s3_bucket.reports.arn}/*"
        ]
      }
    ]
  })
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

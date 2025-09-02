# --- S3 bucket for storing traces ---

resource "aws_s3_bucket" "traces" {
  bucket = "dydxopsdao-deposit-withdraw-monitor-traces"
}

# Rule to delete traces after 30 days
resource "aws_s3_bucket_lifecycle_configuration" "traces" {
  bucket = aws_s3_bucket.traces.id

  rule {
    id     = "delete_old_traces"
    status = "Enabled"

    # Apply to all objects
    filter {}

    expiration {
      days = 30
    }
  }
}

# Block public access to the bucket
resource "aws_s3_bucket_public_access_block" "traces" {
  bucket = aws_s3_bucket.traces.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Add S3 permissions to task role for writing traces
resource "aws_iam_role_policy" "s3_traces_permissions" {
  name = "deposit-withdraw-monitor-s3-traces-permissions"
  role = aws_iam_role.task_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.traces.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.traces.arn
      }
    ]
  })
}

output "aws_ecr_repository_url" {
  value = aws_ecr_repository.this.repository_url
}

output "aws_github_actions_role_arn" {
  value = aws_iam_role.github_actions.arn
}

output "traces_bucket_name" {
  value       = aws_s3_bucket.traces.bucket
  description = "Name of the S3 bucket for storing traces"
}

output "reports_bucket_name" {
  value       = aws_s3_bucket.reports.bucket
  description = "Name of the S3 bucket for storing reports"
}

output "seed_phrases_secret_arn" {
  value       = aws_secretsmanager_secret.secrets["seed_phrases"].arn
  description = "ARN of the AWS Secrets Manager secret containing wallet seed phrases"
}

output "wallet_password_secret_arn" {
  value       = aws_secretsmanager_secret.secrets["wallet_password"].arn
  description = "ARN of the AWS Secrets Manager secret containing wallet password"
}

output "datadog_api_key_secret_arn" {
  value       = aws_secretsmanager_secret.secrets["datadog_api_key"].arn
  description = "ARN of the AWS Secrets Manager secret containing Datadog API key"
}

output "reports_cloudfront_url" {
  value       = "https://${aws_cloudfront_distribution.reports.domain_name}"
  description = "URL to access the reports via CloudFront (username: viewer, password: see report_service_password variable)"
}

output "tests_egress_ip" {
  value       = aws_eip.routes.public_ip
  description = "Elastic IP address used for outbound route traffic"
}

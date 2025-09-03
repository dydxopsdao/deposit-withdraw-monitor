output "aws_ecr_repository_url" {
  value = aws_ecr_repository.this.repository_url
}

output "aws_github_actions_role_arn" {
  value = aws_iam_role.github_actions.arn
}

output "traces_bucket_name" {
  value = aws_s3_bucket.traces.bucket
  description = "Name of the S3 bucket for storing traces"
}

output "seed_phrases_secret_arn" {
  value = aws_secretsmanager_secret.seed_phrases.arn
  description = "ARN of the AWS Secrets Manager secret containing wallet seed phrases"
}

output "wallet_password_secret_arn" {
  value = aws_secretsmanager_secret.wallet_password.arn
  description = "ARN of the AWS Secrets Manager secret containing wallet password"
}

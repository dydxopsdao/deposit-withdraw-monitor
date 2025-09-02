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

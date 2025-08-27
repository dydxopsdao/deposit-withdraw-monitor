output "aws_ecr_repository_url" {
  value = aws_ecr_repository.this.repository_url
}

output "aws_github_actions_role_arn" {
  value = aws_iam_role.github_actions.arn
}
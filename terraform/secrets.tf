# --- AWS Secrets Manager for storing wallet seed phrases ---
resource "aws_secretsmanager_secret" "seed_phrases" {
  name        = "deposit-withdraw-monitor/seed-phrases"
  description = "Seed phrases for deposit-withdraw-monitor wallets"
}

# --- Secret version containing the actual seed phrase data ---
resource "aws_secretsmanager_secret_version" "seed_phrases" {
  secret_id     = aws_secretsmanager_secret.seed_phrases.id
  secret_string = jsonencode(var.seed_phrases)
}

# --- IAM policy to allow ECS task to read the secret ---
resource "aws_iam_role_policy" "task_secrets_access" {
  name = "deposit-withdraw-monitor-secrets-access"
  role = aws_iam_role.task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.seed_phrases.arn
      }
    ]
  })
}

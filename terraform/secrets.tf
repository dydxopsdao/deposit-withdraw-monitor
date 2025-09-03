locals {
  secrets = {
    seed_phrases = {
      name        = "deposit-withdraw-monitor/seed-phrases"
      description = "Seed phrases for deposit-withdraw-monitor wallets"
      value       = jsonencode(var.seed_phrases)
    }
    wallet_password = {
      name        = "deposit-withdraw-monitor/wallet-password"
      description = "Wallet password for deposit-withdraw-monitor wallets"
      value       = var.wallet_password
    }
  }
}

# --- AWS Secrets Manager secrets ---
resource "aws_secretsmanager_secret" "secrets" {
  for_each = local.secrets

  name        = each.value.name
  description = each.value.description
}

# --- Secret versions containing the actual secret data ---
resource "aws_secretsmanager_secret_version" "secrets" {
  for_each = local.secrets

  secret_id     = aws_secretsmanager_secret.secrets[each.key].id
  secret_string = each.value.value
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
        Resource = values(aws_secretsmanager_secret.secrets)[*].arn
      }
    ]
  })
}

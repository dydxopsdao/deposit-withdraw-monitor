# GitHub Actions OIDC Provider and IAM Role for triggering deposit-withdraw routes

# OIDC Identity Provider for GitHub Actions
# This allows GitHub Actions to authenticate to AWS without storing long-lived credentials
resource "aws_iam_openid_connect_provider" "github_actions" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com",
  ]

  # GitHub's OIDC thumbprints - these are GitHub's official thumbprints
  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd"
  ]
}

# Data source to get the GitHub repository information
data "aws_caller_identity" "current" {}

# IAM Role for GitHub Actions to assume
resource "aws_iam_role" "github_actions_role" {
  name = "deposit-withdraw-monitor-github-actions"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github_actions.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            # Replace with your actual GitHub repository
            # Format: "repo:OWNER/REPOSITORY:*"
            "token.actions.githubusercontent.com:sub" = "repo:dydxopsdao/deposit-withdraw-monitor:*"
          }
        }
      }
    ]
  })
}

# IAM Policy for GitHub Actions - minimal permissions needed
resource "aws_iam_role_policy" "github_actions_policy" {
  name = "deposit-withdraw-monitor-github-actions-policy"
  role = aws_iam_role.github_actions_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # ECS permissions to list task definitions and run tasks
        Effect = "Allow"
        Action = [
          "ecs:ListTaskDefinitions",
          "ecs:RunTask",
          "ecs:DescribeTaskDefinition"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "ecs:cluster" = "arn:aws:ecs:*:${data.aws_caller_identity.current.account_id}:cluster/deposit-withdraw-monitor-scheduled-jobs"
          }
        }
      },
      {
        # ECS permissions for the specific cluster
        Effect = "Allow"
        Action = [
          "ecs:DescribeClusters"
        ]
        Resource = "arn:aws:ecs:*:${data.aws_caller_identity.current.account_id}:cluster/deposit-withdraw-monitor-scheduled-jobs"
      },
      {
        # DynamoDB permissions to read locks table
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = aws_dynamodb_table.task_execution_locks.arn
      },
      {
        # EC2 permissions to describe networking resources (needed by trigger script)
        Effect = "Allow"
        Action = [
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups"
        ]
        Resource = "*"
      },
      {
        # IAM permissions to pass the ECS task role (required for ECS RunTask)
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = [
          aws_iam_role.task_role.arn,
          aws_iam_role.execution_role.arn
        ]
        Condition = {
          StringEquals = {
            "iam:PassedToService" = "ecs-tasks.amazonaws.com"
          }
        }
      }
    ]
  })
}

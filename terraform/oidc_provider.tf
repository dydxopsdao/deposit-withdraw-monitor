# GitHub OIDC Provider
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = ["sts.amazonaws.com"]

  # GitHub OIDC thumbprint
  # See: https://github.blog/changelog/2023-06-27-github-actions-update-on-oidc-integration-with-aws/
  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1", # old
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd"  # newer
  ]
}

# IAM role for GitHub Actions
resource "aws_iam_role" "github_actions" {
  name = "github-actions-oidc-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringLike = {
            "token.actions.githubusercontent.com:sub" : "repo:${var.github_org}/${var.github_repo}:*"
          }
        }
      }
    ]
  })
}

# IAM policy for GitHub Actions
resource "aws_iam_role_policy" "github_actions" {
  name = "github-actions-oidc-policy"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # ECR permissions to pull and push images
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
        ]
        Resource = aws_ecr_repository.this.arn
      },
      # ECS permissions to list task definitions and run tasks
      {
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
        Effect = "Allow"
        Action = [
          "ecs:DescribeClusters"
        ]
        Resource = "arn:aws:ecs:*:${data.aws_caller_identity.current.account_id}:cluster/deposit-withdraw-monitor-scheduled-jobs"
      },
      # DynamoDB permissions to read locks table
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = aws_dynamodb_table.task_execution_locks.arn
      },
      # EC2 permissions to describe networking resources (needed by trigger script)
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups"
        ]
        Resource = "*"
      },
      # IAM permissions to pass the ECS task role (required for ECS RunTask)
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = [
          aws_iam_role.task_role.arn,
          aws_iam_role.task_execution.arn
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

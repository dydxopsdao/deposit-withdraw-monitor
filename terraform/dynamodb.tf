# DynamoDB table for distributed task execution locking
resource "aws_dynamodb_table" "task_execution_locks" {
  name         = "deposit-withdraw-monitor-task-locks"
  billing_mode = "PAY_PER_REQUEST" # On-demand pricing, no capacity planning needed
  hash_key     = "route_id"

  attribute {
    name = "route_id"
    type = "S"
  }

  # Enable TTL for automatic cleanup of stale locks
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Name    = "deposit-withdraw-monitor-task-locks"
    Purpose = "Prevent concurrent ECS task executions"
  }
}

# Add DynamoDB permissions to task role for distributed locking
resource "aws_iam_role_policy" "task_dynamodb_access" {
  name = "deposit-withdraw-monitor-dynamodb-locks-access"
  role = aws_iam_role.task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:DeleteItem",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.task_execution_locks.arn
      }
    ]
  })
}

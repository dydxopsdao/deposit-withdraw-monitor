# --- IAM: Role that EventBridge uses to run the ECS task ---
resource "aws_iam_role" "events_invoke_ecs" {
  name = "deposit-withdraw-monitor-events-run-ecs-task-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "events.amazonaws.com" },
      Action = "sts:AssumeRole"
    }]
  })
}

# Allow EventBridge to run the specific task definition and pass the task/execution roles
resource "aws_iam_role_policy" "events_invoke_ecs" {
  name = "deposit-withdraw-monitor-events-run-ecs-task-policy"
  role = aws_iam_role.events_invoke_ecs.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "RunTask",
        Effect = "Allow",
        Action = ["ecs:RunTask"],
        Resource = "*"
      },
      {
        Sid    = "PassRoles",
        Effect = "Allow",
        Action = ["iam:PassRole"],
        Resource = [
          aws_iam_role.task_execution.arn,
          aws_iam_role.task_role.arn
        ]
      }
    ]
  })
}

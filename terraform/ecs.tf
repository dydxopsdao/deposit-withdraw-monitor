# --- Security group for the task (egress only) ---
resource "aws_security_group" "task" {
  name        = "deposit-withdraw-monitor-scheduled-task-sg"
  description = "Egress-only SG for scheduled ECS task"
  vpc_id      = data.aws_vpc.default.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# --- ECS cluster ---
resource "aws_ecs_cluster" "this" {
  name = "deposit-withdraw-monitor-scheduled-jobs"
}

# --- IAM: Task execution role (pull image, write logs) ---
resource "aws_iam_role" "task_execution" {
  name = "deposit-withdraw-monitor-ecsTaskExecutionRole-scheduled"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Service = "ecs-tasks.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "task_execution_managed" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Add explicit ECR permissions to task execution role
resource "aws_iam_role_policy" "ecr_permissions" {
  name = "deposit-withdraw-monitor-ecr-permissions"
  role = aws_iam_role.task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = aws_ecr_repository.this.arn
      },
      {
        Effect   = "Allow"
        Action   = "ecr:GetAuthorizationToken"
        Resource = "*"
      }
    ]
  })
}

# --- IAM: Task role for the scheduled task ---
resource "aws_iam_role" "task_role" {
  name = "deposit-withdraw-monitor-ecsTaskRole-scheduled"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Service = "ecs-tasks.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
}

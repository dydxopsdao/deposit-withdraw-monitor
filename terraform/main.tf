# --- Use the default VPC & its subnets for simplicity ---
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_region" "current" {}

data "aws_caller_identity" "current" {}

# --- ECR Repository for the Docker image ---
resource "aws_ecr_repository" "this" {
  name                 = "deposit-withdraw-monitor"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# --- ECR Lifecycle Policy ---
resource "aws_ecr_lifecycle_policy" "this" {
  repository = aws_ecr_repository.this.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Delete untagged images older than 1 day"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 1
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

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

# --- CloudWatch Logs for the container ---
resource "aws_cloudwatch_log_group" "this" {
  name              = "/ecs/deposit-withdraw-monitor-scheduled-job"
  retention_in_days = 7
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
      Effect = "Allow",
      Principal = { Service = "ecs-tasks.amazonaws.com" },
      Action = "sts:AssumeRole"
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
        Effect = "Allow"
        Action = "ecr:GetAuthorizationToken"
        Resource = "*"
      }
    ]
  })
}

# --- IAM: (optional) Task role for your app (minimal/no perms here) ---
resource "aws_iam_role" "task_role" {
  name = "deposit-withdraw-monitor-ecsTaskRole-scheduled"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "ecs-tasks.amazonaws.com" },
      Action = "sts:AssumeRole"
    }]
  })
}

# --- ECS Task Definition (Fargate) ---
resource "aws_ecs_task_definition" "this" {
  family                   = "deposit-withdraw-monitor-scheduled-job"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task_role.arn

  container_definitions = jsonencode([
    {
      name      = "job"
      image     = "${aws_ecr_repository.this.repository_url}:latest"
      essential = true
      logConfiguration = {
        logDriver = "awslogs",
        options = {
          awslogs-group         = aws_cloudwatch_log_group.this.name,
          awslogs-region        = data.aws_region.current.id,
          awslogs-stream-prefix = "job"
        }
      }
      environment = [
        {
          name  = "CI"
          value = "true"
        },
        {
          name  = "NODE_ENV"
          value = "production"
        }
      ]
    }
  ])
}

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
        Resource = [aws_ecs_task_definition.this.arn]
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

# --- EventBridge: run every 60 minutes ---
resource "aws_cloudwatch_event_rule" "every_60" {
  name                = "deposit-withdraw-monitor-run-ecs-task-every-60m"
  description         = "Runs the ECS Fargate task every 60 minutes"
  schedule_expression = "rate(60 minutes)"
}

resource "aws_cloudwatch_event_target" "run_task" {
  rule      = aws_cloudwatch_event_rule.every_60.name
  target_id = "deposit-withdraw-monitor-run-fargate-task"
  arn       = aws_ecs_cluster.this.arn
  role_arn  = aws_iam_role.events_invoke_ecs.arn

  ecs_target {
    task_definition_arn = aws_ecs_task_definition.this.arn
    task_count          = 1
    launch_type         = "FARGATE"
    platform_version    = "1.4.0"

    network_configuration {
      subnets         = data.aws_subnets.default.ids
      security_groups = [aws_security_group.task.id]
      assign_public_ip = true
    }
  }
}

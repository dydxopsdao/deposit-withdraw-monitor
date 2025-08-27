# Each test is run in a separate ECS task and by a separate EventBridge rule

locals {
  test_names = [
    "deposit-usdc-regular-metamask-10",
    "deposit-usdc-regular-phantom-10",
    "withdraw-usdc-regular-metamask-10",
    "withdraw-usdc-regular-phantom-10"
  ]
}

resource "aws_cloudwatch_log_group" "this" {
  for_each = toset(local.test_names)

  name              = "/ecs/test-${each.value}"
  retention_in_days = 7
}

resource "aws_ecs_task_definition" "this" {
  for_each = toset(local.test_names)

  family                   = "test-${each.value}"
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
      environment = [
        {
          name  = "ROUTE_ID"
          value = each.value
        },
      ]
      logConfiguration = {
        logDriver = "awslogs",
        options = {
          awslogs-group         = aws_cloudwatch_log_group.this[each.key].name,
          awslogs-region        = data.aws_region.current.id,
          awslogs-stream-prefix = "job"
        }
      }
    }
  ])
}

resource "aws_cloudwatch_event_rule" "test_schedules" {
  for_each = toset(local.test_names)

  name                = "test-${each.value}-every-60m"
  description         = "Runs the ECS Fargate task for ${each.value} every 60 minutes"
  schedule_expression = "rate(60 minutes)"
}

resource "aws_cloudwatch_event_target" "run_tasks" {
  for_each = toset(local.test_names)

  rule      = aws_cloudwatch_event_rule.test_schedules[each.key].name
  target_id = "test-${each.value}-fargate-task"
  arn       = aws_ecs_cluster.this.arn
  role_arn  = aws_iam_role.events_invoke_ecs.arn

  ecs_target {
    task_definition_arn = aws_ecs_task_definition.this[each.key].arn
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

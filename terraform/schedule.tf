# Each test is run in a separate ECS task and by a separate EventBridge rule

locals {
  # Read routes.yaml dynamically
  routes_yaml = yamldecode(file("${path.module}/../routes.yaml"))

  # Transform routes into test definitions
  test_definitions = [
    for route in local.routes_yaml.routes : {
      id          = route.id
      cadence_min = route.cadence_min
      enabled     = route.enabled
    }
  ]
}

resource "aws_cloudwatch_log_group" "this" {
  for_each = { for test in local.test_definitions : test.id => test }

  name              = "/ecs/test-${each.value.id}"
  retention_in_days = 7
}

resource "aws_ecs_task_definition" "this" {
  for_each = { for test in local.test_definitions : test.id => test }

  family                   = each.value.id
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
          value = each.value.id
        },
        {
          name  = "AWS_REGION"
          value = data.aws_region.current.id
        },
        {
          name  = "AWS_TRACES_BUCKET_NAME"
          value = aws_s3_bucket.traces.bucket
        },
        {
          name  = "SEED_PHRASES_SECRET_ARN"
          value = aws_secretsmanager_secret.seed_phrases.arn
        },
        {
          name  = "SEED_PHRASES_SECRET_NAME"
          value = aws_secretsmanager_secret.seed_phrases.name
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
  for_each = { for test in local.test_definitions : test.id => test }

  state               = each.value.enabled ? "ENABLED" : "DISABLED"
  name                = each.value.id
  description         = "Runs the ECS Fargate task for ${each.value.id} every ${each.value.cadence_min} minutes"
  schedule_expression = "rate(${each.value.cadence_min} minutes)"
}

resource "aws_cloudwatch_event_target" "run_tasks" {
  for_each = { for test in local.test_definitions : test.id => test }

  rule      = aws_cloudwatch_event_rule.test_schedules[each.key].name
  target_id = each.value.id
  arn       = aws_ecs_cluster.this.arn
  role_arn  = aws_iam_role.events_invoke_ecs.arn

  ecs_target {
    task_definition_arn = aws_ecs_task_definition.this[each.key].arn
    task_count          = 1
    launch_type         = "FARGATE"
    platform_version    = "1.4.0"

    network_configuration {
      subnets          = data.aws_subnets.default.ids
      security_groups  = [aws_security_group.task.id]
      assign_public_ip = true
    }
  }
}

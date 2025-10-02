# Each test is run in a separate ECS task and by a separate EventBridge rule

locals {
  # Read routes.yaml dynamically
  routes_yaml = yamldecode(file("${path.module}/../routes.yaml"))

  # Create a map of unique routes (one entry per route_id)
  routes = { for route in local.routes_yaml.routes : route.id => route }

  # Flatten routes and schedules into a list for EventBridge rules
  schedule_definitions = flatten([
    for route_id, route in local.routes : [
      for schedule in route.schedules : {
        route_id        = route_id
        schedule_name   = schedule.name
        cron_expression = schedule.cron
        enabled         = schedule.enabled && route.enabled # Both must be true
        # Create unique key for Terraform resource using schedule name
        resource_key = "${route_id}-${schedule.name}"
      }
    ]
  ])
}

resource "aws_cloudwatch_log_group" "this" {
  for_each = local.routes

  name              = "/ecs/test-${each.key}"
  retention_in_days = 7
}

resource "aws_ecs_task_definition" "this" {
  for_each = local.routes

  family                   = each.key
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "2048"
  memory                   = "4096"
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
          value = each.key
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
          name  = "AWS_REPORTS_BUCKET_NAME"
          value = aws_s3_bucket.reports.bucket
        },
        {
          name  = "REPORTS_CLOUDFRONT_URL"
          value = "https://${aws_cloudfront_distribution.reports.domain_name}"
        },
        {
          name  = "DD_SERVICE"
          value = var.datadog_service
        },
        {
          name  = "DD_SITE"
          value = var.datadog_site
        },
        {
          name  = "DD_SOURCE"
          value = var.datadog_source
        },
        {
          name  = "DD_ENV"
          value = var.dd_env
        },
        {
          name  = "SEED_PHRASES_SECRET_ARN"
          value = aws_secretsmanager_secret.secrets["seed_phrases"].arn
        },
        {
          name  = "WALLET_PASSWORD_SECRET_ARN"
          value = aws_secretsmanager_secret.secrets["wallet_password"].arn
        },
        {
          name  = "ALCHEMY_API_KEY_SECRET_ARN"
          value = aws_secretsmanager_secret.secrets["alchemy_api_key"].arn
        },
        {
          name  = "DATADOG_API_KEY_SECRET_ARN"
          value = aws_secretsmanager_secret.secrets["datadog_api_key"].arn
        },
        {
          name  = "DYNAMODB_LOCKS_TABLE_NAME"
          value = aws_dynamodb_table.task_execution_locks.name
        },
        {
          name  = "TASK_TIMEOUT_SECONDS"
          value = tostring(var.task_timeout_seconds)
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
  for_each = { for sched in local.schedule_definitions : sched.resource_key => sched }

  state               = each.value.enabled ? "ENABLED" : "DISABLED"
  name                = each.value.resource_key
  description         = "Schedule ${each.value.schedule_name} for ${each.value.route_id}"
  schedule_expression = "cron(${each.value.cron_expression})"
}

resource "aws_cloudwatch_event_target" "run_tasks" {
  for_each = { for sched in local.schedule_definitions : sched.resource_key => sched }

  rule      = aws_cloudwatch_event_rule.test_schedules[each.key].name
  target_id = each.value.resource_key
  arn       = aws_ecs_cluster.this.arn
  role_arn  = aws_iam_role.events_invoke_ecs.arn

  ecs_target {
    task_definition_arn = aws_ecs_task_definition.this[each.value.route_id].arn
    task_count          = 1
    launch_type         = "FARGATE"
    platform_version    = "1.4.0"

    network_configuration {
      subnets          = [aws_subnet.private.id]
      security_groups  = [aws_security_group.task.id]
      assign_public_ip = false
    }
  }
}

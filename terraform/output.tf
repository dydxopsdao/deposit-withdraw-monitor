output "cluster_name" {
  value = aws_ecs_cluster.this.name
}

output "task_definition" {
  value = aws_ecs_task_definition.this.arn
}

output "event_rule" {
  value = aws_cloudwatch_event_rule.every_60.name
}

output "log_group" {
  value = aws_cloudwatch_log_group.this.name
}
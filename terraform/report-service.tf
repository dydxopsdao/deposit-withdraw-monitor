# --- Security group for Application Load Balancer (ALB) that allows HTTP/HTTPS ingress ---
resource "aws_security_group" "report_service_alb" {
  name        = "deposit-withdraw-monitor-report-service-alb-sg"
  description = "Security group for report service ALB"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "deposit-withdraw-monitor-report-service-alb"
  }
}

# --- Security group for ECS service (allow traffic from ALB) ---
resource "aws_security_group" "report_service_task" {
  name        = "deposit-withdraw-monitor-report-service-task-sg"
  description = "Security group for report service ECS task"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.report_service_alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "deposit-withdraw-monitor-report-service-task"
  }
}

# --- Application Load Balancer ---
resource "aws_lb" "report_service" {
  name               = "deposit-withdraw-monitor-report"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.report_service_alb.id]
  subnets           = data.aws_subnets.default.ids

  enable_deletion_protection = false

  tags = {
    Name = "deposit-withdraw-monitor-report-service"
  }
}

# --- Target Group ---
resource "aws_lb_target_group" "report_service" {
  name        = "deposit-withdraw-monitor-report"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.default.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200,401"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name = "deposit-withdraw-monitor-report-service"
  }
}

# --- ALB Listener ---
resource "aws_lb_listener" "report_service" {
  load_balancer_arn = aws_lb.report_service.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.report_service.arn
  }
}

# --- IAM: Task execution role for report service ---
resource "aws_iam_role" "report_service_task_execution" {
  name = "deposit-withdraw-monitor-report-service-execution-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "ecs-tasks.amazonaws.com" },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "report_service_task_execution_managed" {
  role       = aws_iam_role.report_service_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# --- IAM: Task role for report service (with S3 read access) ---
resource "aws_iam_role" "report_service_task" {
  name = "deposit-withdraw-monitor-report-service-task-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "ecs-tasks.amazonaws.com" },
      Action = "sts:AssumeRole"
    }]
  })
}

# Add S3 read permissions to report service task role
resource "aws_iam_role_policy" "report_service_s3_traces_read" {
  name = "deposit-withdraw-monitor-report-service-s3-read"
  role = aws_iam_role.report_service_task.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.traces.arn,
          "${aws_s3_bucket.traces.arn}/*"
        ]
      }
    ]
  })
}

# --- CloudWatch Log Group ---
resource "aws_cloudwatch_log_group" "report_service" {
  name              = "/ecs/deposit-withdraw-monitor-report-service"
  retention_in_days = 7

  tags = {
    Name = "deposit-withdraw-monitor-report-service"
  }
}

# --- ECS Task Definition ---
resource "aws_ecs_task_definition" "report_service" {
  family                   = "deposit-withdraw-monitor-report-service"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.report_service_task_execution.arn
  task_role_arn           = aws_iam_role.report_service_task.arn

  container_definitions = jsonencode([
    {
      name  = "report-service"
      image = "nginx:alpine"
      
      portMappings = [
        {
          containerPort = 80
          hostPort      = 80
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NGINX_ENTRYPOINT_QUIET_LOGS"
          value = "1"
        },
        {
          name  = "REPORT_PASSWORD"
          value = var.report_service_password
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.report_service.name
          "awslogs-region"        = data.aws_region.current.id
          "awslogs-stream-prefix" = "ecs"
        }
      }

      # Custom nginx configuration with basic auth and custom content
      mountPoints = []
      volumesFrom = []
      
      # Override default nginx config via command
      command = [
        "/bin/sh",
        "-c",
        <<-EOT
          # Install apache2-utils for htpasswd command
          apk add --no-cache apache2-utils

          # Create htpasswd file with user 'viewer' and password from environment variable
          htpasswd -cb /etc/nginx/.htpasswd viewer "$REPORT_PASSWORD"

          # Create custom index.html
          echo '<html><head><title>Report Service</title></head><body><h1>Report, World!</h1></body></html>' > /usr/share/nginx/html/index.html

          # Create nginx config with basic auth
          cat > /etc/nginx/nginx.conf << 'EOF'
          events {
              worker_connections 1024;
          }
          
          http {
              include       /etc/nginx/mime.types;
              default_type  application/octet-stream;
              
              sendfile        on;
              keepalive_timeout  65;
              
              server {
                  listen       80;
                  server_name  localhost;
                  
                  location / {
                      auth_basic "Report Service";
                      auth_basic_user_file /etc/nginx/.htpasswd;
                      root   /usr/share/nginx/html;
                      index  index.html index.htm;
                  }
                  
                  error_page   500 502 503 504  /50x.html;
                  location = /50x.html {
                      root   /usr/share/nginx/html;
                  }
              }
          }
          EOF

          # Start nginx
          nginx -g 'daemon off;'
        EOT
      ]

      essential = true
    }
  ])

  tags = {
    Name = "deposit-withdraw-monitor-report-service"
  }
}

# --- ECS Service ---
resource "aws_ecs_service" "report_service" {
  name            = "deposit-withdraw-monitor-report-service"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.report_service.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.report_service_task.id]
    subnets         = data.aws_subnets.default.ids
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.report_service.arn
    container_name   = "report-service"
    container_port   = 80
  }

  depends_on = [aws_lb_listener.report_service]

  tags = {
    Name = "deposit-withdraw-monitor-report-service"
  }
}

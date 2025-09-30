# --- Networking primitives to route ECS tasks through a static Elastic IP ---

locals {
  vpc_cidr          = "10.90.0.0/16"
  availability_zone = data.aws_availability_zones.available.names[0]
}

resource "aws_vpc" "routes" {
  cidr_block           = local.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "deposit-withdraw-monitor-routes"
  }
}

resource "aws_internet_gateway" "routes" {
  vpc_id = aws_vpc.routes.id

  tags = {
    Name = "deposit-withdraw-monitor-routes"
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.routes.id
  availability_zone       = local.availability_zone
  cidr_block              = "10.90.0.0/20"
  map_public_ip_on_launch = true

  tags = {
    Name = "deposit-withdraw-monitor-routes-public"
  }
}

resource "aws_subnet" "private" {
  vpc_id                  = aws_vpc.routes.id
  availability_zone       = local.availability_zone
  cidr_block              = "10.90.16.0/20"
  map_public_ip_on_launch = false

  tags = {
    Name = "deposit-withdraw-monitor-routes-private"
  }
}

resource "aws_eip" "routes" {
  domain = "vpc"

  tags = {
    Name = "deposit-withdraw-monitor-routes"
  }
}

resource "aws_nat_gateway" "routes" {
  allocation_id = aws_eip.routes.id
  subnet_id     = aws_subnet.public.id

  tags = {
    Name = "deposit-withdraw-monitor-routes"
  }

  depends_on = [aws_internet_gateway.routes]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.routes.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.routes.id
  }

  tags = {
    Name = "deposit-withdraw-monitor-routes-public"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.routes.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.routes.id
  }

  tags = {
    Name = "deposit-withdraw-monitor-routes-private"
  }
}

resource "aws_route_table_association" "private" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}

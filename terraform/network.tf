# --- Networking primitives to route ECS tasks through a static Elastic IP ---

locals {
  vpc_cidr                = "10.90.0.0/16"
  availability_zone_limit = min(2, length(data.aws_availability_zones.available.names))
  availability_zones      = slice(data.aws_availability_zones.available.names, 0, local.availability_zone_limit)
  nat_gateway_az          = local.availability_zones[0]

  public_subnet_config = {
    for idx, az in local.availability_zones : az => {
      az         = az
      cidr_block = cidrsubnet(local.vpc_cidr, 4, idx)
    }
  }

  private_subnet_config = {
    for idx, az in local.availability_zones : az => {
      az         = az
      cidr_block = cidrsubnet(local.vpc_cidr, 4, idx + local.availability_zone_limit)
    }
  }
}

resource "aws_vpc" "tests" {
  cidr_block           = local.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "deposit-withdraw-monitor-tests"
  }
}

resource "aws_internet_gateway" "tests" {
  vpc_id = aws_vpc.tests.id

  tags = {
    Name = "deposit-withdraw-monitor-tests"
  }
}

resource "aws_subnet" "public" {
  for_each = local.public_subnet_config

  vpc_id                  = aws_vpc.tests.id
  availability_zone       = each.value.az
  cidr_block              = each.value.cidr_block
  map_public_ip_on_launch = true

  tags = {
    Name = "deposit-withdraw-monitor-tests-public-${each.key}"
  }
}

resource "aws_subnet" "private" {
  for_each = local.private_subnet_config

  vpc_id                  = aws_vpc.tests.id
  availability_zone       = each.value.az
  cidr_block              = each.value.cidr_block
  map_public_ip_on_launch = false

  tags = {
    Name = "deposit-withdraw-monitor-tests-private-${each.key}"
  }
}

resource "aws_eip" "tests" {
  domain = "vpc"

  tags = {
    Name = "deposit-withdraw-monitor-tests"
  }
}

resource "aws_nat_gateway" "tests" {
  allocation_id = aws_eip.tests.id
  subnet_id     = aws_subnet.public[local.nat_gateway_az].id

  tags = {
    Name = "deposit-withdraw-monitor-tests"
  }

  depends_on = [aws_internet_gateway.tests]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.tests.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.tests.id
  }

  tags = {
    Name = "deposit-withdraw-monitor-tests-public"
  }
}

resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.tests.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.tests.id
  }

  tags = {
    Name = "deposit-withdraw-monitor-tests-private"
  }
}

resource "aws_route_table_association" "private" {
  for_each = aws_subnet.private

  subnet_id      = each.value.id
  route_table_id = aws_route_table.private.id
}

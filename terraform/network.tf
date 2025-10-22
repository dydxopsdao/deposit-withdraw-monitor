# --- Networking primitives to route ECS tasks through a static Elastic IP ---
#
# Network topology:
#
# ┌─────────────────────────────────────────────────────────────┐
# │                    VPC (10.90.0.0/16)                       │
# │                                                             │
# │  ┌─────────────────────┐    ┌─────────────────────────────┐ │
# │  │   Public Subnet     │    │     Private Subnet          │ │
# │  │   10.90.0.0/20      │    │     10.90.16.0/20           │ │
# │  │                     │    │                             │ │
# │  │  ┌───────────────┐  │    │  ┌─────────────────────────┐│ │
# │  │  │ NAT Gateway   │  │    │  │    ECS Tasks            ││ │
# │  │  │ EIP (static)  │◄─┼────┼──│    (private IPs)        ││ │
# │  │  └───────┬───────┘  │    │  └─────────────────────────┘│ │
# │  └──────────┼──────────┘    └─────────────────────────────┘ │
# │             │                                               │
# │     ┌───────▼────────┐                                      │
# │     │ Internet GW    │                                      │
# │     └────────────────┘                                      │
# └─────────────────────────────────────────────────────────────┘
#              │
#          Internet
#
# Flow: ECS tasks (private IPs) → NAT Gateway → Internet (with static EIP)
# All outbound traffic appears to come from the same static IP address.

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  vpc_cidr          = "10.90.0.0/16" # arbitrary CIDR block for the VPC
  public_subnet_cidr = "10.90.0.0/20"
  private_subnet_cidr = "10.90.16.0/20"
  availability_zone = data.aws_availability_zones.available.names[0]
  tag               = "deposit-withdraw-monitor-routes"
}

# Virtual Private Cloud - isolated network for all resources
resource "aws_vpc" "routes" {
  cidr_block           = local.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = local.tag
  }
}

# Internet Gateway - allows VPC to communicate with the internet
resource "aws_internet_gateway" "routes" {
  vpc_id = aws_vpc.routes.id

  tags = {
    Name = local.tag
  }
}

# Public subnet - hosts NAT Gateway, has direct internet access
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.routes.id
  availability_zone       = local.availability_zone
  cidr_block              = local.public_subnet_cidr
  map_public_ip_on_launch = true

  tags = {
    Name = local.tag
  }
}

# Private subnet - hosts ECS tasks, internet access only through NAT Gateway
resource "aws_subnet" "private" {
  vpc_id                  = aws_vpc.routes.id
  availability_zone       = local.availability_zone
  cidr_block              = local.private_subnet_cidr
  map_public_ip_on_launch = false

  tags = {
    Name = local.tag
  }
}

# Elastic IP - the static public IP address that all ECS traffic will use
resource "aws_eip" "routes" {
  domain = "vpc"

  tags = {
    Name = local.tag
  }
}

# NAT Gateway - translates private IPs to the static EIP for outbound traffic
resource "aws_nat_gateway" "routes" {
  allocation_id = aws_eip.routes.id
  subnet_id     = aws_subnet.public.id

  tags = {
    Name = local.tag
  }

  depends_on = [aws_internet_gateway.routes]
}

# Route table for public subnet - directs all traffic to Internet Gateway
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.routes.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.routes.id
  }

  tags = {
    Name = local.tag
  }
}

# Associates public route table with public subnet
resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Route table for private subnet - directs all traffic through NAT Gateway
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.routes.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.routes.id
  }

  tags = {
    Name = local.tag
  }
}

# Associates private route table with private subnet
resource "aws_route_table_association" "private" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}

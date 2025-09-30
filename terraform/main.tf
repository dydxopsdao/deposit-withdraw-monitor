# --- Shared data sources used across multiple resources ---
data "aws_region" "current" {}

data "aws_caller_identity" "current" {}

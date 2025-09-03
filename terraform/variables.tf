variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "github_org" {
  description = "GitHub organization name"
  type        = string
  default     = "dydxopsdao"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "deposit-withdraw-monitor"
}

variable "seed_phrases" {
  description = "Map of wallet names to their seed phrases"
  type        = map(string)
  sensitive   = true
}

variable "wallet_password" {
  description = "Password for wallet setup and operations"
  type        = string
  sensitive   = true
}

variable "datadog_api_key" {
  description = "Datadog API key for data collection"
  type        = string
  sensitive   = true
}
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
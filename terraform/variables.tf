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

variable "datadog_service" {
  description = "Datadog service name for tagging"
  type        = string
  default     = "dos-synth"
}

variable "datadog_site" {
  description = "Datadog site (e.g., datadoghq.com, datadoghq.eu)"
  type        = string
  default     = "ap1.datadoghq.com"
}

variable "datadog_source" {
  description = "Datadog source name for logs"
  type        = string
  default     = "playwright"
}

variable "dd_env" {
  description = "Datadog environment tag (dev, prod)"
  type        = string
  default     = "dev"
}

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

variable "report_service_password" {
  description = "Password for basic authentication on the report service"
  type        = string
  sensitive   = true
}

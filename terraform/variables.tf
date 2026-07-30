variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "django-nextjs-app"
}

variable "environment" {
  description = "Deployment environment (e.g., prod, dev)"
  type        = string
  default     = "prod"
}

variable "domain_name" {
  description = "External domain name (e.g., example.com)"
  type        = string
  default     = ""
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "backend_env_ssm_param" {
  description = "SSM Parameter Store name for backend environment variables"
  type        = string
  default     = "/django-nextjs/production/env"
}

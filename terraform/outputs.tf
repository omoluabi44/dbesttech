output "alb_dns_name" {
  description = "The DNS name of the ALB"
  value       = aws_alb.main.dns_name
}

output "rds_endpoint" {
  description = "The connection endpoint for the RDS instance"
  value       = aws_db_instance.main.endpoint
}

output "ecr_backend_url" {
  description = "The URL of the backend ECR repository"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_url" {
  description = "The URL of the frontend ECR repository"
  value       = aws_ecr_repository.frontend.repository_url
}

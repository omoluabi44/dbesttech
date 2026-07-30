output "alb_dns_name" {
  description = "The DNS name of the ALB — use this URL to access the app"
  value       = aws_alb.main.dns_name
}

output "backend_instance_id" {
  description = "The instance ID of the backend EC2"
  value       = aws_instance.backend.id
}

output "frontend_instance_id" {
  description = "The instance ID of the frontend EC2"
  value       = aws_instance.frontend.id
}

output "backend_public_ip" {
  description = "The public IP of the backend EC2"
  value       = aws_instance.backend.public_ip
}

output "frontend_public_ip" {
  description = "The public IP of the frontend EC2"
  value       = aws_instance.frontend.public_ip
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

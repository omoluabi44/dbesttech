output "backend_instance_id" {
  description = "The instance ID of the backend EC2"
  value       = aws_instance.backend.id
}

output "frontend_instance_id" {
  description = "The instance ID of the frontend EC2"
  value       = aws_instance.frontend.id
}

output "backend_public_ip" {
  description = "The public IP of the backend EC2 (Elastic IP)"
  value       = aws_eip.backend_eip.public_ip
}

output "frontend_public_ip" {
  description = "The public IP of the frontend EC2 (Elastic IP)"
  value       = aws_eip.frontend_eip.public_ip
}

output "rds_endpoint" {
  description = "The connection endpoint for the RDS instance"
  value       = aws_db_instance.main.endpoint
}

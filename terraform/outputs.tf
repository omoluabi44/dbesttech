output "server_instance_id" {
  description = "The instance ID of the EC2 server"
  value       = aws_instance.backend.id
}

output "server_public_ip" {
  description = "The public IP of the EC2 server (Elastic IP)"
  value       = aws_eip.backend_eip.public_ip
}

output "rds_endpoint" {
  description = "The connection endpoint for the RDS instance"
  value       = aws_db_instance.main.endpoint
}

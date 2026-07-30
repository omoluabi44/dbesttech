$region = "us-east-1"

Write-Host "Fetching backend logs..."
$backendCmd = aws ssm send-command `
  --document-name "AWS-RunShellScript" `
  --targets "Key=tag:Name,Values=django-nextjs-app-backend" `
  --parameters '{"commands":["cd /app", "docker ps -a", "docker compose -f docker-compose.backend.yml logs --tail=50"]}' `
  --region $region | ConvertFrom-Json

$backendCmdId = $backendCmd.Command.CommandId

Write-Host "Fetching frontend logs..."
$frontendCmd = aws ssm send-command `
  --document-name "AWS-RunShellScript" `
  --targets "Key=tag:Name,Values=django-nextjs-app-frontend" `
  --parameters '{"commands":["cd /app", "docker ps -a", "docker compose -f docker-compose.frontend.yml logs --tail=50"]}' `
  --region $region | ConvertFrom-Json

$frontendCmdId = $frontendCmd.Command.CommandId

Write-Host "Waiting for commands to finish..."
Start-Sleep -Seconds 10

$backendInstance = aws ec2 describe-instances --filters "Name=tag:Name,Values=django-nextjs-app-backend" "Name=instance-state-name,Values=running" --query "Reservations[0].Instances[0].InstanceId" --output text --region $region
$frontendInstance = aws ec2 describe-instances --filters "Name=tag:Name,Values=django-nextjs-app-frontend" "Name=instance-state-name,Values=running" --query "Reservations[0].Instances[0].InstanceId" --output text --region $region

Write-Host "Backend Output:"
aws ssm get-command-invocation --command-id $backendCmdId --instance-id $backendInstance --region $region --query "StandardOutputContent" --output text

Write-Host "Backend Error:"
aws ssm get-command-invocation --command-id $backendCmdId --instance-id $backendInstance --region $region --query "StandardErrorContent" --output text

Write-Host "----------------------------------"

Write-Host "Frontend Output:"
aws ssm get-command-invocation --command-id $frontendCmdId --instance-id $frontendInstance --region $region --query "StandardOutputContent" --output text

Write-Host "Frontend Error:"
aws ssm get-command-invocation --command-id $frontendCmdId --instance-id $frontendInstance --region $region --query "StandardErrorContent" --output text

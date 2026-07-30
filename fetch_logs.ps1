$params = '{"commands":["docker logs --tail 20 django_backend"]}'
$cmd = aws ssm send-command --document-name "AWS-RunShellScript" --targets "Key=tag:Name,Values=django-nextjs-app-asg-instance" --parameters $params --query "Command.CommandId" --output text
Start-Sleep -Seconds 10
aws ssm list-command-invocations --command-id $cmd --details --query "CommandInvocations[0].CommandPlugins[0].Output" --output text > django_logs.txt

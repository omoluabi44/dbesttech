$cmd = aws ssm send-command --document-name "AWS-RunShellScript" --targets "Key=tag:Name,Values=django-nextjs-app-asg-instance" --parameters file://migrate_params.json --query "Command.CommandId" --output text
Start-Sleep -Seconds 15
aws ssm list-command-invocations --command-id $cmd --details --query "CommandInvocations[0].CommandPlugins[0].Output" --output text > migrate_logs.txt

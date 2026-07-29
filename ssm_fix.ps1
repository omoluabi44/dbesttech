$envB64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes("c:\Users\adeta\OneDrive\Desktop\primary_secondary\.env"))
$params = '{"commands":["echo \"' + $envB64 + '\" | base64 -d > /app/.env", "sed -i \"s/DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1/DJANGO_ALLOWED_HOSTS=*/\" /app/.env", "cd /app", "docker-compose up -d --remove-orphans"]}'
aws ssm send-command --document-name "AWS-RunShellScript" --targets "Key=tag:Name,Values=django-nextjs-app-asg-instance" --parameters $params --timeout-seconds 600 --region us-east-1

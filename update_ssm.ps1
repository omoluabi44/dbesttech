$val = aws ssm get-parameter --name "/django-nextjs/production/env" --with-decryption --region us-east-1 --query "Parameter.Value" --output text
$val = $val + "`nSECURE_SSL_REDIRECT=False"
$val | Out-File -FilePath temp_env.txt -Encoding UTF8
aws ssm put-parameter --name "/django-nextjs/production/env" --value "file://temp_env.txt" --type "SecureString" --overwrite --region us-east-1

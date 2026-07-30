import subprocess
import json
import time

def run_cmd(cmd_str):
    print(f"Running: {cmd_str}")
    result = subprocess.run(cmd_str, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return None
    return json.loads(result.stdout)

def get_instance_id(name):
    cmd = f'aws ec2 describe-instances --filters "Name=tag:Name,Values={name}" "Name=instance-state-name,Values=running" --query "Reservations[0].Instances[0].InstanceId" --output text --region us-east-1'
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout.strip()

print("Fetching backend logs...")
b_cmd = """aws ssm send-command --document-name "AWS-RunShellScript" --targets "Key=tag:Name,Values=django-nextjs-app-backend" --parameters '{"commands":["cd /app", "docker ps -a", "docker compose -f docker-compose.backend.yml logs --tail=50"]}' --region us-east-1 --output json"""
b_res = run_cmd(b_cmd)
b_id = b_res['Command']['CommandId'] if b_res else None

print("Fetching frontend logs...")
f_cmd = """aws ssm send-command --document-name "AWS-RunShellScript" --targets "Key=tag:Name,Values=django-nextjs-app-frontend" --parameters '{"commands":["cd /app", "docker ps -a", "docker compose -f docker-compose.frontend.yml logs --tail=50"]}' --region us-east-1 --output json"""
f_res = run_cmd(f_cmd)
f_id = f_res['Command']['CommandId'] if f_res else None

print("Waiting 10 seconds...")
time.sleep(10)

b_inst = get_instance_id("django-nextjs-app-backend")
f_inst = get_instance_id("django-nextjs-app-frontend")

if b_id and b_inst:
    print("\n--- Backend Logs ---")
    out = subprocess.run(f'aws ssm get-command-invocation --command-id {b_id} --instance-id {b_inst} --region us-east-1 --query "StandardOutputContent" --output text', shell=True, capture_output=True, text=True)
    err = subprocess.run(f'aws ssm get-command-invocation --command-id {b_id} --instance-id {b_inst} --region us-east-1 --query "StandardErrorContent" --output text', shell=True, capture_output=True, text=True)
    print("STDOUT:\n", out.stdout)
    print("STDERR:\n", err.stdout)

if f_id and f_inst:
    print("\n--- Frontend Logs ---")
    out = subprocess.run(f'aws ssm get-command-invocation --command-id {f_id} --instance-id {f_inst} --region us-east-1 --query "StandardOutputContent" --output text', shell=True, capture_output=True, text=True)
    err = subprocess.run(f'aws ssm get-command-invocation --command-id {f_id} --instance-id {f_inst} --region us-east-1 --query "StandardErrorContent" --output text', shell=True, capture_output=True, text=True)
    print("STDOUT:\n", out.stdout)
    print("STDERR:\n", err.stdout)

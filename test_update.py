import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
django.setup()

from rest_framework.test import APIClient
from apps.accounts.models import User

user = User.objects.filter(role='student').first()
if not user:
    print("No student user found. Creating one...")
    user = User.objects.create(username="test_student", email="test@test.com", role="student")
    user.set_password("password123")
    user.save()

client = APIClient()
client.force_authenticate(user=user)

print("Before:", user.student_profile.level)
response = client.patch('/api/auth/student-profile/', {'level': 'ss_3'}, format='json')
print("Status Code:", response.status_code)
print("Response:", response.data)

user.student_profile.refresh_from_db()
print("After DB check:", user.student_profile.level)

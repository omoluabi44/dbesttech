import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from dj_rest_auth.serializers import PasswordResetConfirmSerializer

# Simulate exactly what the frontend is sending
payload = {
    'uid': '1',
    'token': 'mock-token-123',
    'new_password1': 'StrongPass123!',
    'new_password2': 'StrongPass123!'
}

serializer = PasswordResetConfirmSerializer(data=payload)
is_valid = serializer.is_valid()
print(f"Is valid? {is_valid}")
if not is_valid:
    print(f"Errors: {serializer.errors}")

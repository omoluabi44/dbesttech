import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
email = 'dbesttech44@gmail.com'

try:
    user = User.objects.get(email=email)
    user.role = 'root_admin'
    user.is_superuser = True
    user.is_staff = True
    user.save()
    print(f"Successfully made {email} a root_admin and superuser.")
except User.DoesNotExist:
    # If the user doesn't exist, create it
    print(f"User {email} does not exist. Creating...")
    user = User.objects.create_user(
        username='emmanuel_admin',
        email=email,
        password='Password123!',
        role='root_admin',
        is_superuser=True,
        is_staff=True
    )
    print(f"Created {email} as a root_admin with password 'Password123!'.")

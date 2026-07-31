import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

if not User.objects.filter(email='admin@dbestquiz.com').exists():
    try:
        user = User.objects.create_superuser(
            email='admin@dbestquiz.com',
            password='admin123',
            role='root_admin'
        )
        print("Superuser created.")
    except Exception as e:
        print(f"Error creating superuser: {e}")
else:
    print("Superuser already exists.")

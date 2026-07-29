import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

if not User.objects.filter(email='admin@quizmaster.com').exists():
    user = User.objects.create_superuser(
        username='admin',
        email='admin@quizmaster.com',
        password='admin123',
        role='root_admin'
    )
    print("Superuser created.")
else:
    print("Superuser already exists.")

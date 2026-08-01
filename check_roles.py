import os, django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

for u in User.objects.all():
    has_profile = hasattr(u, 'school_admin_profile')
    print(f"{u.email}: role={u.role}, is_superuser={u.is_superuser}, has_school_profile={has_profile}")

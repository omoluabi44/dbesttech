"""
Test-specific settings — uses SQLite so tests can run without MySQL/PostgreSQL.
"""
from .base import *  # noqa: F401, F403

DEBUG = True
ALLOWED_HOSTS = ['*']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'test_db.sqlite3',
    }
}

CORS_ALLOW_ALL_ORIGINS = True
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Flutterwave test keys
FLUTTERWAVE_PUBLIC_KEY = 'test-pub-key'
FLUTTERWAVE_SECRET_KEY = 'test-secret-key'
FLUTTERWAVE_WEBHOOK_SECRET = 'test-webhook-hash'

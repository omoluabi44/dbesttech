import os
import django

# We can run this script with `python manage.py shell < seed_plans.py`
from apps.accounts.models import SubscriptionPlan

PAID_FEATURES = [
    'Unlimited access to all questions',
    'Detailed step-by-step explanations',
    'Full performance analytics',
    'AI-powered study suggestions',
    'Priority support'
]

plans = [
    {
        'name': 'free',
        'display_name': 'Free',
        'price': 0,
        'order': 0,
        'features': [
            'Access to the first 10 questions of Easy level only'
        ]
    },
    {
        'name': 'monthly',
        'display_name': 'Monthly',
        'price': 1000,
        'order': 1,
        'features': PAID_FEATURES
    },
    {
        'name': 'quarterly',
        'display_name': 'Quarterly',
        'price': 3500,
        'order': 2,
        'features': PAID_FEATURES
    },
    {
        'name': 'half-year',
        'display_name': 'Half-Year',
        'price': 6000,
        'order': 3,
        'features': PAID_FEATURES
    },
    {
        'name': 'yearly',
        'display_name': 'Yearly',
        'price': 12000,
        'order': 4,
        'features': PAID_FEATURES
    },
    {
        'name': 'holiday-package',
        'display_name': 'Holiday Package',
        'price': 2000,
        'is_featured': True,
        'is_active': False,
        'order': 5,
        'features': PAID_FEATURES
    }
]

for p in plans:
    plan, created = SubscriptionPlan.objects.update_or_create(
        name=p['name'],
        defaults=p
    )
    print(f"{'Created' if created else 'Updated'} plan: {plan.name}")

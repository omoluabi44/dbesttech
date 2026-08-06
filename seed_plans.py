import os
import django

# We can run this script with `python manage.py shell < seed_plans.py`
from apps.accounts.models import SubscriptionPlan

plans = [
    {
        'name': 'free',
        'display_name': 'Free',
        'price': 0,
        'duration_days': None,
        'order': 0,
        'features': [
            'Access to all subjects',
            'Basic quiz explanations',
            'Progress tracking',
        ]
    },
    {
        'name': 'monthly',
        'display_name': 'Monthly',
        'price': 1000,
        'duration_days': 30,
        'order': 1,
        'features': [
            'Access to all subjects',
            'Detailed quiz explanations',
            'Advanced progress tracking',
            'Performance analytics',
            'Priority support',
        ]
    },
    {
        'name': 'quarterly',
        'display_name': 'Quarterly',
        'price': 3500,
        'duration_days': 90,
        'order': 2,
        'features': [
            'Access to all subjects',
            'Detailed quiz explanations',
            'Advanced progress tracking',
            'Full performance analytics',
            'AI-powered study suggestions',
            'Priority support',
        ]
    },
    {
        'name': 'half-year',
        'display_name': 'Half-Year',
        'price': 6000,
        'duration_days': 180,
        'order': 3,
        'features': [
            'Access to all subjects',
            'Detailed quiz explanations',
            'Advanced progress tracking',
            'Full performance analytics',
            'AI-powered study suggestions',
            'Priority support',
            'Exclusive content',
        ]
    },
    {
        'name': 'yearly',
        'display_name': 'Yearly',
        'price': 12000,
        'duration_days': 365,
        'order': 4,
        'features': [
            'Access to all subjects',
            'Detailed quiz explanations',
            'Advanced progress tracking',
            'Full performance analytics',
            'AI-powered study suggestions',
            'Priority support',
            'Exclusive content',
        ]
    },
    {
        'name': 'holiday-package',
        'display_name': 'Holiday Package',
        'price': 2000,
        'is_featured': True,
        'order': 5,
        'features': [
            'Access to all subjects',
            'Detailed quiz explanations',
            'Advanced progress tracking',
            'Full performance analytics',
            'Holiday specific content',
        ]
    }
]

for p in plans:
    expiration_date = p.pop('expiration_date', None)
    plan, created = SubscriptionPlan.objects.update_or_create(
        name=p['name'],
        defaults=p
    )
    if plan.name == 'holiday-package':
        plan.expiration_date = '2026-10-31T23:59:59Z'
        plan.save()
    print(f"{'Created' if created else 'Updated'} plan: {plan.name}")

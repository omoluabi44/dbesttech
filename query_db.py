import dotenv
dotenv.load_dotenv()
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import PaymentTransaction, User
print('--- TRANSACTIONS ---')
for t in PaymentTransaction.objects.all().order_by('-created_at')[:5]:
    print(f'ID: {t.id} | TX_REF: {t.tx_ref} | PLAN: {t.plan} | STATUS: {t.status} | FLW_RES: {getattr(t, "flw_response", None) or "NONE"}')

u = User.objects.last()
print(f'\n--- LAST USER ---')
print(f'PLAN: {u.subscription_plan} | END: {u.subscription_end_date} | EMAIL: {u.email}')

from django.core.management.base import BaseCommand
from apps.accounts.models import PaymentTransaction, User

class Command(BaseCommand):
    help = 'Check payment transactions'

    def handle(self, *args, **kwargs):
        print('--- RECENT TRANSACTIONS ---')
        for t in PaymentTransaction.objects.all().order_by('-created_at')[:10]:
            print(f'ID: {t.id} | TX_REF: {t.tx_ref} | PLAN: {t.plan} | STATUS: {t.status} | AMT: {t.amount} | FLW: {bool(t.flw_response)}')

        print('\n--- ALL USERS ---')
        for u in User.objects.all():
            print(f'EMAIL: {u.email} | PLAN: {u.subscription_plan} | END: {u.subscription_end_date} | STATUS: {u.subscription_status}')

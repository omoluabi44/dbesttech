from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from unittest.mock import patch, MagicMock
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta

from .models import User, PaymentTransaction, StudentProfile

class PaymentTransactionModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='password123'
        )

    def test_payment_transaction_creation(self):
        tx = PaymentTransaction.objects.create(
            user=self.user,
            tx_ref='tx-ref-123',
            amount=Decimal('1500.00'),
            plan='basic'
        )
        self.assertEqual(tx.user, self.user)
        self.assertEqual(tx.amount, Decimal('1500.00'))
        self.assertEqual(tx.plan, 'basic')
        self.assertEqual(tx.status, 'pending')

    def test_payment_transaction_str(self):
        tx = PaymentTransaction.objects.create(
            user=self.user,
            tx_ref='tx-ref-123',
            amount=Decimal('1500.00'),
            plan='basic'
        )
        self.assertEqual(str(tx), 'tx-ref-123 - pending - ₦1500.00')


class UserSubscriptionFieldsTest(TestCase):
    def test_default_values(self):
        user = User.objects.create_user(
            email='test2@example.com',
            username='testuser2',
            password='password123'
        )
        self.assertEqual(user.subscription_plan, 'free')
        self.assertEqual(user.subscription_status, 'active')
        self.assertEqual(user.quizzes_taken_today, 0)
        
    def test_daily_quiz_limit(self):
        user = User.objects.create_user(
            email='test3@example.com',
            username='testuser3',
            password='password123'
        )
        # Default is free
        self.assertEqual(user.daily_quiz_limit, 5)
        
        user.subscription_plan = 'basic'
        self.assertEqual(user.daily_quiz_limit, 20)
        
        user.subscription_plan = 'premium'
        self.assertEqual(user.daily_quiz_limit, 999)


class SubscriptionPlansAPITest(APITestCase):
    def test_get_subscription_plans(self):
        url = reverse('accounts:subscription-plans')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
        plans = [p['id'] for p in response.data]
        self.assertIn('free', plans)
        self.assertIn('basic', plans)
        self.assertIn('premium', plans)


class CurrentSubscriptionAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='password123'
        )
        self.client.force_authenticate(user=self.user)

    def test_current_subscription(self):
        url = reverse('accounts:current-subscription')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['subscription_plan'], 'free')
        
    def test_auto_downgrade_expired_subscription(self):
        self.user.subscription_plan = 'basic'
        self.user.subscription_end_date = timezone.now() - timedelta(days=1)
        self.user.save()
        
        url = reverse('accounts:current-subscription')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['subscription_plan'], 'free')
        self.assertEqual(response.data['subscription_status'], 'expired')
        
        self.user.refresh_from_db()
        self.assertEqual(self.user.subscription_plan, 'free')


@override_settings(FLUTTERWAVE_PUBLIC_KEY='test-pub-key')
class InitializePaymentAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='password123'
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse('accounts:initialize-payment')

    def test_initialize_payment_valid(self):
        data = {'plan': 'basic'}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tx_ref', response.data)
        self.assertEqual(response.data['amount'], 1500)
        self.assertEqual(response.data['public_key'], 'test-pub-key')
        
        tx = PaymentTransaction.objects.get(tx_ref=response.data['tx_ref'])
        self.assertEqual(tx.user, self.user)
        self.assertEqual(tx.amount, 1500)

    def test_invalid_plan(self):
        data = {'plan': 'invalid'}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_free_plan_rejected(self):
        data = {'plan': 'free'}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated(self):
        self.client.logout()
        # Ensure we are fully logged out and unauthorized
        self.client.force_authenticate(user=None)
        data = {'plan': 'basic'}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


@override_settings(FLUTTERWAVE_SECRET_KEY='test-secret')
class VerifyPaymentAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='password123'
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse('accounts:verify-payment')
        self.tx_ref = 'tx-ref-123'
        self.transaction = PaymentTransaction.objects.create(
            user=self.user,
            tx_ref=self.tx_ref,
            amount=Decimal('1500.00'),
            plan='basic',
            currency='NGN'
        )

    @patch('apps.accounts.payment_views.requests.get')
    def test_successful_verification(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'status': 'success',
            'data': {
                'id': 123456,
                'tx_ref': self.tx_ref,
                'amount': 1500,
                'currency': 'NGN',
                'status': 'successful',
                'payment_type': 'card',
            }
        }
        mock_get.return_value = mock_response

        data = {'transaction_id': '123456', 'tx_ref': self.tx_ref}
        response = self.client.post(self.url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.transaction.refresh_from_db()
        self.assertEqual(self.transaction.status, 'successful')
        self.assertEqual(self.transaction.flw_transaction_id, '123456')
        
        self.user.refresh_from_db()
        self.assertEqual(self.user.subscription_plan, 'basic')
        self.assertEqual(self.user.subscription_status, 'active')

    @patch('apps.accounts.payment_views.requests.get')
    def test_failed_verification(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'status': 'success',
            'data': {
                'id': 123456,
                'tx_ref': self.tx_ref,
                'amount': 1500,
                'currency': 'NGN',
                'status': 'failed', # payment failed in flutterwave
            }
        }
        mock_get.return_value = mock_response

        data = {'transaction_id': '123456', 'tx_ref': self.tx_ref}
        response = self.client.post(self.url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.transaction.refresh_from_db()
        self.assertEqual(self.transaction.status, 'failed')
        
    def test_idempotency(self):
        self.transaction.status = 'successful'
        self.transaction.save()
        
        data = {'transaction_id': '123456', 'tx_ref': self.tx_ref}
        response = self.client.post(self.url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Payment already verified successfully')

    @patch('apps.accounts.payment_views.requests.get')
    def test_mismatched_amount(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'status': 'success',
            'data': {
                'id': 123456,
                'tx_ref': self.tx_ref,
                'amount': 100, # different amount
                'currency': 'NGN',
                'status': 'successful',
            }
        }
        mock_get.return_value = mock_response

        data = {'transaction_id': '123456', 'tx_ref': self.tx_ref}
        response = self.client.post(self.url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.transaction.refresh_from_db()
        self.assertEqual(self.transaction.status, 'failed')

    def test_tx_ref_not_found(self):
        data = {'transaction_id': '123456', 'tx_ref': 'non-existent'}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


@override_settings(FLUTTERWAVE_WEBHOOK_SECRET='test-webhook-hash')
class WebhookAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='password123'
        )
        self.url = reverse('accounts:payment-webhook')
        self.tx_ref = 'tx-ref-123'
        self.transaction = PaymentTransaction.objects.create(
            user=self.user,
            tx_ref=self.tx_ref,
            amount=Decimal('1500.00'),
            plan='basic',
            currency='NGN'
        )

    def test_valid_webhook_hash(self):
        data = {
            'event': 'charge.completed',
            'data': {
                'tx_ref': self.tx_ref,
                'id': 123456,
                'amount': 1500,
                'currency': 'NGN',
                'status': 'successful'
            }
        }
        # Webhook hash in header verif-hash
        response = self.client.post(self.url, data, format='json', HTTP_VERIF_HASH='test-webhook-hash')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.transaction.refresh_from_db()
        self.assertEqual(self.transaction.status, 'successful')
        self.user.refresh_from_db()
        self.assertEqual(self.user.subscription_plan, 'basic')

    def test_invalid_hash(self):
        data = {'event': 'charge.completed'}
        response = self.client.post(self.url, data, format='json', HTTP_VERIF_HASH='invalid-hash')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_missing_hash(self):
        data = {'event': 'charge.completed'}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

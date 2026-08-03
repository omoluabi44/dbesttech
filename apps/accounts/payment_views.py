import os
import hmac
import hashlib
import requests
from datetime import timedelta
from uuid import uuid4
from django.utils import timezone
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status

from .models import PaymentTransaction


SUBSCRIPTION_PLANS = [
    {
        'id': 'free',
        'name': 'free',
        'display_name': 'Free',
        'price': 0,
        'currency': 'NGN',
        'daily_quiz_limit': 5,
        'quiz_limit': 5,
        'features': [
            'Access to all subjects',
            'Basic quiz explanations',
            'Progress tracking',
        ]
    },
    {
        'id': 'basic',
        'name': 'basic',
        'display_name': 'Basic',
        'price': 1500,
        'currency': 'NGN',
        'daily_quiz_limit': 20,
        'quiz_limit': 20,
        'features': [
            'Access to all subjects',
            'Detailed quiz explanations',
            'Advanced progress tracking',
            'Performance analytics',
            'Priority support',
        ]
    },
    {
        'id': 'premium',
        'name': 'premium',
        'display_name': 'Premium',
        'price': 3500,
        'currency': 'NGN',
        'daily_quiz_limit': 999,
        'quiz_limit': 99999,
        'features': [
            'Access to all subjects',
            'Detailed quiz explanations',
            'Advanced progress tracking',
            'Full performance analytics',
            'AI-powered study suggestions',
            'Priority support',
            'Exclusive content',
        ]
    }
]

class SubscriptionPlansView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response(SUBSCRIPTION_PLANS, status=status.HTTP_200_OK)


class CurrentSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Auto-downgrade if expired
        if user.subscription_plan != 'free' and user.subscription_end_date and user.subscription_end_date < timezone.now():
            user.subscription_plan = 'free'
            user.subscription_status = 'expired'
            user.save()
            
        return Response({
            'subscription_plan': user.subscription_plan,
            'subscription_status': user.subscription_status,
            'subscription_start_date': user.subscription_start_date,
            'subscription_end_date': user.subscription_end_date,
            'quizzes_taken_today': user.quizzes_taken_today,
            'daily_quiz_limit': user.daily_quiz_limit,
            'last_quiz_date': user.last_quiz_date
        }, status=status.HTTP_200_OK)


class InitializePaymentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        plan = request.data.get('plan')
        
        if not plan:
            return Response({'error': 'Plan is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        if plan == 'free':
            return Response({'error': 'Cannot initialize payment for free plan'}, status=status.HTTP_400_BAD_REQUEST)
            
        plan_details = next((p for p in SUBSCRIPTION_PLANS if p['id'] == plan), None)
        
        if not plan_details:
            return Response({'error': 'Invalid plan'}, status=status.HTTP_400_BAD_REQUEST)
            
        tx_ref = f"dbestquiz_{request.user.id}_{plan}_{uuid4().hex[:8]}"
        
        # Get client IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
            
        PaymentTransaction.objects.create(
            user=request.user,
            tx_ref=tx_ref,
            amount=plan_details['price'],
            currency='NGN',
            plan=plan,
            status='pending',
            ip_address=ip
        )
        
        return Response({
            'tx_ref': tx_ref,
            'amount': plan_details['price'],
            'currency': 'NGN',
            'public_key': getattr(settings, 'FLUTTERWAVE_PUBLIC_KEY', '')
        }, status=status.HTTP_200_OK)


class VerifyPaymentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        transaction_id = request.data.get('transaction_id')
        tx_ref = request.data.get('tx_ref')
        
        if not transaction_id or not tx_ref:
            return Response({'error': 'transaction_id and tx_ref are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            transaction = PaymentTransaction.objects.get(tx_ref=tx_ref)
        except PaymentTransaction.DoesNotExist:
            return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if transaction.user != request.user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
            
        if transaction.status == 'successful':
            return Response({'message': 'Payment already verified successfully'}, status=status.HTTP_200_OK)
            
        secret_key = getattr(settings, 'FLUTTERWAVE_SECRET_KEY', '')
        headers = {
            'Authorization': f'Bearer {secret_key}',
            'Content-Type': 'application/json'
        }
        
        verify_url = f"https://api.flutterwave.com/v3/transactions/{transaction_id}/verify"
        
        try:
            response = requests.get(verify_url, headers=headers)
            response_data = response.json()
            
            if response.status_code == 200 and response_data.get('status') == 'success':
                flw_data = response_data.get('data', {})
                
                # Cross-validate
                if (
                    float(flw_data.get('amount', 0)) == float(transaction.amount) and
                    flw_data.get('currency') == transaction.currency and
                    flw_data.get('status') == 'successful'
                ):
                    transaction.status = 'successful'
                    transaction.flw_transaction_id = str(transaction_id)
                    transaction.payment_type = flw_data.get('payment_type', '')
                    transaction.verified_at = timezone.now()
                    transaction.flw_response = response_data
                    transaction.save()
                    
                    # Update User Subscription
                    user = request.user
                    user.subscription_plan = transaction.plan
                    user.subscription_status = 'active'
                    user.subscription_start_date = timezone.now()
                    user.subscription_end_date = timezone.now() + timedelta(days=30)
                    user.save()
                    
                    return Response({'message': 'Payment verified successfully'}, status=status.HTTP_200_OK)
                else:
                    transaction.status = 'failed'
                    transaction.save()
                    return Response({'error': 'Payment validation failed'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                transaction.status = 'failed'
                transaction.save()
                return Response({'error': 'Payment verification failed'}, status=status.HTTP_400_BAD_REQUEST)
                
        except requests.RequestException:
            return Response({'error': 'Error connecting to payment provider'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@method_decorator(csrf_exempt, name='dispatch')
class FlutterwaveWebhookView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        secret_hash = getattr(settings, 'FLUTTERWAVE_WEBHOOK_SECRET', '')
        signature = request.headers.get('verif-hash')
        
        if not signature or signature != secret_hash:
            return Response({'error': 'Invalid signature'}, status=status.HTTP_401_UNAUTHORIZED)
            
        event_data = request.data
        event_type = event_data.get('event')
        
        if event_type == 'charge.completed':
            data = event_data.get('data', {})
            tx_ref = data.get('tx_ref')
            flw_ref = data.get('flw_ref')
            
            try:
                transaction = PaymentTransaction.objects.get(tx_ref=tx_ref)
                
                if transaction.status != 'successful' and data.get('status') == 'successful':
                    if (
                        float(data.get('amount', 0)) >= float(transaction.amount) and
                        data.get('currency') == transaction.currency
                    ):
                        transaction.status = 'successful'
                        transaction.flw_transaction_id = str(data.get('id', ''))
                        transaction.payment_type = data.get('payment_type', '')
                        transaction.verified_at = timezone.now()
                        transaction.flw_response = event_data
                        transaction.save()
                        
                        user = transaction.user
                        user.subscription_plan = transaction.plan
                        user.subscription_status = 'active'
                        user.subscription_start_date = timezone.now()
                        user.subscription_end_date = timezone.now() + timedelta(days=30)
                        user.save()
            except PaymentTransaction.DoesNotExist:
                pass
                
        return Response(status=status.HTTP_200_OK)

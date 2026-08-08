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


def get_end_date_for_plan(plan_name):
    """Calculate the expiration date based on the plan's name."""
    from .models import SubscriptionPlan
    try:
        plan = SubscriptionPlan.objects.get(name=plan_name)
        if plan.end_date:
            from django.utils import timezone
            import datetime
            # Convert date to datetime at midnight of that date
            return timezone.make_aware(datetime.datetime.combine(plan.end_date, datetime.time.max))
    except SubscriptionPlan.DoesNotExist:
        pass
        
    if plan_name == 'monthly':
        return timezone.now() + timedelta(days=30)
    elif plan_name == 'quarterly':
        return timezone.now() + timedelta(days=90)
    elif plan_name == 'half-year':
        return timezone.now() + timedelta(days=180)
    elif plan_name == 'yearly':
        return timezone.now() + timedelta(days=365)
    # Default to 30 days
    return timezone.now() + timedelta(days=30)

class SubscriptionPlansView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        from .models import SubscriptionPlan
        plans = SubscriptionPlan.objects.filter(is_active=True).order_by('order')
        data = []
        for p in plans:
            data.append({
                'id': p.name,
                'name': p.name,
                'display_name': p.display_name,
                'price': p.price,
                'currency': p.currency,
                'features': p.features,
                'is_featured': p.is_featured,
                'start_date': p.start_date.isoformat() if p.start_date else None,
                'end_date': p.end_date.isoformat() if p.end_date else None,
            })
        return Response(data, status=status.HTTP_200_OK)


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
            'subscription_end_date': user.subscription_end_date
        }, status=status.HTTP_200_OK)


class InitializePaymentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        plan = request.data.get('plan')
        
        if not plan:
            return Response({'error': 'Plan is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        if plan == 'free':
            return Response({'error': 'Cannot initialize payment for free plan'}, status=status.HTTP_400_BAD_REQUEST)
            
        from .models import SubscriptionPlan
        try:
            plan_details = SubscriptionPlan.objects.get(name=plan)
        except SubscriptionPlan.DoesNotExist:
            return Response({'error': 'Invalid plan'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Prevent purchasing an expired plan
        if plan_details.end_date:
            import datetime
            from django.utils import timezone
            plan_expiration = timezone.make_aware(datetime.datetime.combine(plan_details.end_date, datetime.time.max))
            if plan_expiration < timezone.now():
                return Response({'error': 'This plan has already expired and cannot be purchased'}, status=status.HTTP_400_BAD_REQUEST)
            
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
            amount=plan_details.price,
            currency='NGN',
            plan=plan,
            status='pending',
            ip_address=ip
        )
        
        return Response({
            'tx_ref': tx_ref,
            'amount': plan_details.price,
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
                    float(flw_data.get('amount', 0)) >= float(transaction.amount) and
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
                    from .models import SubscriptionPlan
                    user = request.user
                    user.subscription_plan = transaction.plan
                    user.subscription_status = 'active'
                    user.subscription_start_date = timezone.now()
                    user.subscription_end_date = get_end_date_for_plan(transaction.plan)
                    user.save()
                    
                    return Response({
                        'message': 'Payment verified successfully',
                        'plan': transaction.plan,
                        'status': 'active',
                        'end_date': user.subscription_end_date.isoformat() if user.subscription_end_date else None,
                    }, status=status.HTTP_200_OK)
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
                        
                        from .models import SubscriptionPlan
                        user = transaction.user
                        user.subscription_plan = transaction.plan
                        user.subscription_status = 'active'
                        user.subscription_start_date = timezone.now()
                        user.subscription_end_date = get_end_date_for_plan(transaction.plan)
                        user.save()
            except PaymentTransaction.DoesNotExist:
                pass
                
        return Response(status=status.HTTP_200_OK)

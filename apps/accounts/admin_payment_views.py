import requests
from django.utils import timezone
from django.db.models import Sum, Count, Q
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from datetime import timedelta

from .models import PaymentTransaction, WebhookLog
from utils.permissions import IsAdminUser


class TransactionPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class PaymentMetricsView(APIView):
    """GET /auth/admin-payments/metrics/?range=today|week|month"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        date_range = request.query_params.get('range', 'today')
        now = timezone.now()
        
        if date_range == 'week':
            start = now - timedelta(days=7)
        elif date_range == 'month':
            start = now - timedelta(days=30)
        else:  # today
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        txns = PaymentTransaction.objects.filter(created_at__gte=start)
        total_volume = txns.count()
        successful = txns.filter(status='successful').count()
        failed = txns.filter(status='failed').count()
        pending = txns.filter(status='pending').count()
        
        total_revenue = txns.filter(status='successful').aggregate(total=Sum('amount'))['total'] or 0
        success_rate = round((successful / total_volume * 100), 1) if total_volume > 0 else 0
        
        # Settlement approximation: successful transactions
        settlement = float(total_revenue)
        
        return Response({
            'revenue': float(total_revenue),
            'volume': total_volume,
            'success_rate': success_rate,
            'settlement': settlement,
            'successful_count': successful,
            'failed_count': failed,
            'pending_count': pending,
        })


class PaymentTransactionListView(APIView):
    """GET /auth/admin-payments/transactions/?search=&status=&channel=&page=&page_size="""
    permission_classes = [IsAuthenticated, IsAdminUser]
    pagination_class = TransactionPagination
    
    def get(self, request):
        qs = PaymentTransaction.objects.select_related('user').all()
        
        # Filters
        search = request.query_params.get('search', '')
        if search:
            qs = qs.filter(
                Q(tx_ref__icontains=search) |
                Q(flw_transaction_id__icontains=search) |
                Q(user__email__icontains=search)
            )
        
        status_filter = request.query_params.get('status', '')
        if status_filter:
            qs = qs.filter(status=status_filter)
        
        channel_filter = request.query_params.get('channel', '')
        if channel_filter:
            qs = qs.filter(payment_type__icontains=channel_filter)
        
        # Paginate
        paginator = TransactionPagination()
        page = paginator.paginate_queryset(qs, request)
        
        results = []
        for tx in page:
            results.append({
                'id': tx.id,
                'tx_ref': tx.tx_ref,
                'flw_transaction_id': tx.flw_transaction_id,
                'customer_email': tx.user.email,
                'customer_name': tx.user.get_full_name() or tx.user.username,
                'amount': str(tx.amount),
                'currency': tx.currency,
                'plan': tx.plan,
                'payment_type': tx.payment_type,
                'status': tx.status,
                'created_at': tx.created_at.isoformat(),
                'verified_at': tx.verified_at.isoformat() if tx.verified_at else None,
            })
        
        return paginator.get_paginated_response(results)


class PaymentRequeryView(APIView):
    """POST /auth/admin-payments/transactions/<tx_ref>/requery/
    Manually re-verifies a transaction against the Flutterwave API."""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request, tx_ref):
        try:
            transaction = PaymentTransaction.objects.get(tx_ref=tx_ref)
        except PaymentTransaction.DoesNotExist:
            return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # If no flw_transaction_id, we can't re-query
        if not transaction.flw_transaction_id:
            return Response({'error': 'No gateway transaction ID available for re-query'}, status=status.HTTP_400_BAD_REQUEST)
        
        secret_key = getattr(settings, 'FLUTTERWAVE_SECRET_KEY', '')
        headers = {
            'Authorization': f'Bearer {secret_key}',
            'Content-Type': 'application/json'
        }
        
        verify_url = f'https://api.flutterwave.com/v3/transactions/{transaction.flw_transaction_id}/verify'
        
        try:
            response = requests.get(verify_url, headers=headers, timeout=15)
            response_data = response.json()
            
            if response.status_code == 200 and response_data.get('status') == 'success':
                flw_data = response_data.get('data') or {}
                gateway_status = flw_data.get('status', 'unknown')
                
                # Update transaction with latest gateway data
                old_status = transaction.status
                if gateway_status == 'successful' and transaction.status != 'successful':
                    transaction.status = 'successful'
                    transaction.verified_at = timezone.now()
                    transaction.flw_response = response_data
                    transaction.save()
                    
                    # Also activate subscription
                    from .payment_views import get_end_date_for_plan
                    user = transaction.user
                    user.subscription_plan = transaction.plan
                    user.subscription_status = 'active'
                    user.subscription_start_date = timezone.now()
                    user.subscription_end_date = get_end_date_for_plan(transaction.plan)
                    user.save()
                elif gateway_status == 'failed' and transaction.status == 'pending':
                    transaction.status = 'failed'
                    transaction.flw_response = response_data
                    transaction.save()
                
                return Response({
                    'message': 'Re-query successful',
                    'old_status': old_status,
                    'new_status': transaction.status,
                    'gateway_status': gateway_status,
                    'gateway_amount': flw_data.get('amount'),
                    'gateway_currency': flw_data.get('currency'),
                })
            else:
                return Response({
                    'error': 'Gateway verification failed',
                    'gateway_response': response_data,
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except requests.RequestException as e:
            return Response({'error': f'Connection error: {str(e)}'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class PaymentRefundView(APIView):
    """POST /auth/admin-payments/transactions/<tx_ref>/refund/
    Initiates a full or partial refund via the Flutterwave API.
    Body: {"amount": 1000}  (optional, omit for full refund)"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request, tx_ref):
        try:
            transaction = PaymentTransaction.objects.get(tx_ref=tx_ref)
        except PaymentTransaction.DoesNotExist:
            return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if transaction.status != 'successful':
            return Response({'error': 'Only successful transactions can be refunded'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not transaction.flw_transaction_id:
            return Response({'error': 'No gateway transaction ID available'}, status=status.HTTP_400_BAD_REQUEST)
        
        refund_amount = request.data.get('amount')
        
        secret_key = getattr(settings, 'FLUTTERWAVE_SECRET_KEY', '')
        headers = {
            'Authorization': f'Bearer {secret_key}',
            'Content-Type': 'application/json'
        }
        
        refund_url = f'https://api.flutterwave.com/v3/transactions/{transaction.flw_transaction_id}/refund'
        body = {}
        if refund_amount:
            body['amount'] = float(refund_amount)
        
        try:
            response = requests.post(refund_url, json=body, headers=headers, timeout=15)
            response_data = response.json()
            
            if response.status_code == 200 and response_data.get('status') == 'success':
                transaction.status = 'refunded'
                transaction.save()
                
                return Response({
                    'message': 'Refund initiated successfully',
                    'status': 'refunded',
                    'refund_data': response_data.get('data'),
                })
            else:
                return Response({
                    'error': 'Refund failed at gateway',
                    'gateway_response': response_data,
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except requests.RequestException as e:
            return Response({'error': f'Connection error: {str(e)}'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class WebhookLogListView(APIView):
    """GET /auth/admin-payments/webhooks/?page=&page_size="""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        qs = WebhookLog.objects.all()
        
        # Optional: filter discrepancies only
        discrepancy_only = request.query_params.get('discrepancy_only', '')
        if discrepancy_only == 'true':
            qs = qs.filter(discrepancy=True)
        
        paginator = TransactionPagination()
        page = paginator.paginate_queryset(qs, request)
        
        results = []
        for log in page:
            results.append({
                'id': log.id,
                'event': log.event,
                'payload': log.payload,
                'tx_ref': log.tx_ref,
                'flw_transaction_id': log.flw_transaction_id,
                'status': log.status,
                'discrepancy': log.discrepancy,
                'discrepancy_detail': log.discrepancy_detail,
                'created_at': log.created_at.isoformat(),
            })
        
        return paginator.get_paginated_response(results)

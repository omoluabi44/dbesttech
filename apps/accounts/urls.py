from django.urls import path, include
from rest_framework.routers import DefaultRouter
from dj_rest_auth.registration.views import VerifyEmailView
from dj_rest_auth.views import PasswordResetView, PasswordResetConfirmView
from . import views
from . import admin_views
from . import payment_views
from . import admin_payment_views

router = DefaultRouter()
router.register(r'schools', admin_views.SchoolViewSet, basename='school')
router.register(r'admin-dashboard', admin_views.SchoolAdminDashboardViewSet, basename='admin-dashboard')
router.register(r'admin-students', admin_views.SchoolAdminStudentViewSet, basename='admin-students')
router.register(r'admin-subscriptions', admin_views.SubscriptionPlanAdminViewSet, basename='admin-subscriptions')

app_name = 'accounts'

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('student-profile/', views.StudentProfileView.as_view(), name='student-profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('password/reset/', PasswordResetView.as_view(), name='rest_password_reset'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='rest_password_reset_confirm'),
    path('resend-verification/', views.ResendVerificationView.as_view(), name='resend-verification'),
    path('registration/verify-email/', VerifyEmailView.as_view(), name='rest_verify_email'),
    
    # Subscription & Payment
    path('subscription/plans/', payment_views.SubscriptionPlansView.as_view(), name='subscription-plans'),
    path('subscription/current/', payment_views.CurrentSubscriptionView.as_view(), name='current-subscription'),
    path('subscription/initialize/', payment_views.InitializePaymentView.as_view(), name='initialize-payment'),
    path('subscription/verify/', payment_views.VerifyPaymentView.as_view(), name='verify-payment'),
    path('subscription/webhook/', payment_views.FlutterwaveWebhookView.as_view(), name='payment-webhook'),
    
    # Admin Payment Dashboard
    path('admin-payments/metrics/', admin_payment_views.PaymentMetricsView.as_view(), name='admin-payment-metrics'),
    path('admin-payments/transactions/', admin_payment_views.PaymentTransactionListView.as_view(), name='admin-payment-transactions'),
    path('admin-payments/transactions/<str:tx_ref>/requery/', admin_payment_views.PaymentRequeryView.as_view(), name='admin-payment-requery'),
    path('admin-payments/transactions/<str:tx_ref>/refund/', admin_payment_views.PaymentRefundView.as_view(), name='admin-payment-refund'),
    path('admin-payments/webhooks/', admin_payment_views.WebhookLogListView.as_view(), name='admin-webhook-logs'),
    
    path('', include(router.urls)),
]

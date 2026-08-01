from django.urls import path, include
from rest_framework.routers import DefaultRouter
from dj_rest_auth.registration.views import VerifyEmailView
from . import views
from . import admin_views

router = DefaultRouter()
router.register(r'schools', admin_views.SchoolViewSet, basename='school')
router.register(r'admin-dashboard', admin_views.SchoolAdminDashboardViewSet, basename='admin-dashboard')
router.register(r'admin-students', admin_views.SchoolAdminStudentViewSet, basename='admin-students')

app_name = 'accounts'

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('student-profile/', views.StudentProfileView.as_view(), name='student-profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('resend-verification/', views.ResendVerificationView.as_view(), name='resend-verification'),
    path('registration/verify-email/', VerifyEmailView.as_view(), name='rest_verify_email'),
    path('', include(router.urls)),
]

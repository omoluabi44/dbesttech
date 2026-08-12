from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from dj_rest_auth.registration.serializers import RegisterSerializer
from dj_rest_auth.serializers import PasswordResetSerializer
from allauth.account.forms import ResetPasswordForm
from django.contrib.sites.models import Site
from .models import User, StudentProfile, School, PaymentTransaction, SubscriptionPlan
from utils.constants import SCHOOL_LEVELS, SCHOOL_CATEGORIES

class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ['id', 'name', 'address', 'contact_email']


class StudentProfileSerializer(serializers.ModelSerializer):
    """Serializer for student profile."""
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    category_display = serializers.CharField(source='get_school_category_display', read_only=True)

    class Meta:
        model = StudentProfile
        fields = [
            'id', 'school_category', 'category_display',
            'level', 'level_display', 'is_graduating', 'date_of_birth',
            'avatar', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_graduating', 'school_category', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    """Read-only user serializer."""
    student_profile = StudentProfileSerializer(read_only=True)
    email_verified = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'role', 'student_profile', 'email_verified', 'subscription_plan', 'subscription_status']
        read_only_fields = ['id', 'email', 'role']

    def get_email_verified(self, obj):
        from allauth.account.models import EmailAddress
        email = EmailAddress.objects.filter(user=obj, primary=True).first()
        return email.verified if email else False


class UserRegistrationSerializer(RegisterSerializer):
    """Serializer for user registration."""
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    level = serializers.ChoiceField(choices=SCHOOL_LEVELS, write_only=True)
    
    def __init__(self, *args, **kwargs):
        # Map frontend's password & password_confirm to dj_rest_auth's expected password1 & password2
        if 'data' in kwargs and hasattr(kwargs['data'], 'copy'):
            data = kwargs['data'].copy()
            if 'password' in data:
                data['password1'] = data['password']
            if 'password_confirm' in data:
                data['password2'] = data['password_confirm']
            kwargs['data'] = data
        super().__init__(*args, **kwargs)

    def get_cleaned_data(self):
        cleaned_data = super().get_cleaned_data()
        cleaned_data['first_name'] = self.validated_data.get('first_name', '')
        cleaned_data['last_name'] = self.validated_data.get('last_name', '')
        cleaned_data['level'] = self.validated_data.get('level', '')
        return cleaned_data

    def custom_signup(self, request, user):
        user.first_name = self.validated_data.get('first_name', '')
        user.last_name = self.validated_data.get('last_name', '')
        user.role = 'student'
        # DO NOT save the user here, dj_rest_auth will call user.save() right after this method

    def save(self, request):
        try:
            user = super().save(request)
            
            # Use get() explicitly instead of reverse relation just in case it's not cached properly
            from .models import StudentProfile
            profile, created = StudentProfile.objects.get_or_create(user=user)
            profile.level = self.validated_data.get('level', '')
            profile.save()

            # Fix for dj-rest-auth and allauth >= 0.55+ where setup_user_email no longer sends the confirmation email
            from django.conf import settings
            if getattr(settings, 'ACCOUNT_EMAIL_VERIFICATION', 'optional') == 'mandatory':
                from allauth.account.models import EmailAddress
                email_obj = EmailAddress.objects.filter(user=user, primary=True).first()
                if email_obj and not email_obj.verified:
                    email_obj.send_confirmation(request, signup=True)
            
            return user
        except Exception as e:
            import traceback
            traceback.print_exc()
            raise serializers.ValidationError({"detail": f"Server Error during signup: {str(e)}"})


class AdminUserCreationSerializer(RegisterSerializer):
    """Serializer for admins creating users (students or other admins)."""
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    level = serializers.ChoiceField(choices=SCHOOL_LEVELS, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=[('student', 'Student'), ('admin', 'Admin'), ('school_admin', 'School Admin'), ('root_admin', 'Root Admin')], required=False, default='student')
    
    def __init__(self, *args, **kwargs):
        if 'data' in kwargs and hasattr(kwargs['data'], 'copy'):
            data = kwargs['data'].copy()
            if 'password' in data:
                data['password1'] = data['password']
            if 'password_confirm' in data:
                data['password2'] = data['password_confirm']
            kwargs['data'] = data
        super().__init__(*args, **kwargs)

    def get_cleaned_data(self):
        cleaned_data = super().get_cleaned_data()
        cleaned_data['first_name'] = self.validated_data.get('first_name', '')
        cleaned_data['last_name'] = self.validated_data.get('last_name', '')
        cleaned_data['level'] = self.validated_data.get('level', '')
        cleaned_data['role'] = self.validated_data.get('role', 'student')
        return cleaned_data

    def custom_signup(self, request, user):
        user.first_name = self.validated_data.get('first_name', '')
        user.last_name = self.validated_data.get('last_name', '')
        requested_role = self.validated_data.get('role', 'student')
        
        # Only allow setting non-student roles if the requesting user is a root admin
        if request.user.is_authenticated and request.user.role in ['admin', 'root_admin']:
            user.role = requested_role
        else:
            user.role = 'student'

    def save(self, request):
        try:
            user = super().save(request)
            
            if user.role == 'student':
                from .models import StudentProfile
                profile, created = StudentProfile.objects.get_or_create(user=user)
                profile.level = self.validated_data.get('level', '')
                profile.save()

            from django.conf import settings
            if getattr(settings, 'ACCOUNT_EMAIL_VERIFICATION', 'optional') == 'mandatory':
                from allauth.account.models import EmailAddress
                email_obj = EmailAddress.objects.filter(user=user, primary=True).first()
                if email_obj and not email_obj.verified:
                    email_obj.send_confirmation(request, signup=True)
            
            return user
        except Exception as e:
            import traceback
            traceback.print_exc()
            raise serializers.ValidationError({"detail": f"Server Error during user creation: {str(e)}"})


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('User account is disabled.')

        # Block login for unverified students
        if user.role == 'student':
            from allauth.account.models import EmailAddress
            email_obj = EmailAddress.objects.filter(user=user, primary=True).first()
            if not email_obj or not email_obj.verified:
                raise serializers.ValidationError(
                    'Please verify your email address before logging in. Check your inbox for the verification link.'
                )

        attrs['user'] = user
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change."""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Passwords do not match.'})
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value


class CustomResetPasswordForm(ResetPasswordForm):
    def save(self, request, **kwargs):
        email = self.cleaned_data["email"]
        token_generator = kwargs.get("token_generator")
        
        frontend_url = "https://dbestquiz.com/reset-password"
        
        for user in self.users:
            from allauth.account.utils import user_pk_to_url_str
            temp_key = token_generator.make_token(user)
            uid = user_pk_to_url_str(user)
            
            url = f"{frontend_url}?uid={uid}&token={temp_key}"
            
            try:
                site = Site.objects.get_current(request)
            except Site.DoesNotExist:
                site = None
                
            context = {
                "site": site,
                "user": user,
                "password_reset_url": url,
                "request": request,
            }
            
            from allauth.account.adapter import get_adapter
            get_adapter(request).send_mail(
                "account/email/password_reset_key", email, context
            )


class CustomPasswordResetSerializer(PasswordResetSerializer):
    @property
    def password_reset_form_class(self):
        return CustomResetPasswordForm


class PaymentTransactionSerializer(serializers.ModelSerializer):
    """Serializer for payment transaction history."""
    class Meta:
        model = PaymentTransaction
        fields = ['id', 'tx_ref', 'amount', 'currency', 'plan', 'status', 'payment_type', 'created_at', 'verified_at']
        read_only_fields = fields

class SubscriptionPlanAdminSerializer(serializers.ModelSerializer):
    """Serializer for managing subscription plans from the frontend admin dashboard."""
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'

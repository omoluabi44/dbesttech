from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from dj_rest_auth.registration.serializers import RegisterSerializer
from .models import User, StudentProfile, School
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
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'role', 'student_profile', 'email_verified']
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
        user.save(update_fields=['first_name', 'last_name', 'role'])

        profile = user.student_profile
        profile.level = self.validated_data.get('level', '')
        profile.save()


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

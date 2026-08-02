from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout
from allauth.account.models import EmailAddress

from .models import User, StudentProfile
from .serializers import (
    UserRegistrationSerializer,
    LoginSerializer,
    UserSerializer,
    StudentProfileSerializer,
    ChangePasswordSerializer,
)


class RegisterView(generics.CreateAPIView):
    """Register a new student account."""
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        email = request.data.get('email')
        
        # Intercept registration if the email exists but is unverified
        if email:
            try:
                existing_user = User.objects.get(email=email)
                email_obj = EmailAddress.objects.filter(user=existing_user, email=email).first()
                
                # If user exists but email is NOT verified, overwrite them!
                if not email_obj or not email_obj.verified:
                    new_username = request.data.get('username')
                    
                    # Ensure new username isn't taken by someone else
                    if new_username and new_username != existing_user.username:
                        if User.objects.filter(username=new_username).exists():
                            return Response({'username': ['A user with that username already exists.']}, status=status.HTTP_400_BAD_REQUEST)
                        existing_user.username = new_username
                    
                    # Overwrite details
                    existing_user.first_name = request.data.get('first_name', existing_user.first_name)
                    existing_user.last_name = request.data.get('last_name', existing_user.last_name)
                    
                    password = request.data.get('password') or request.data.get('password1')
                    if password:
                        existing_user.set_password(password)
                        
                    existing_user.save()
                    
                    # Update profile level
                    level = request.data.get('level')
                    if level:
                        profile, _ = StudentProfile.objects.get_or_create(user=existing_user)
                        profile.level = level
                        profile.save()
                        
                    # Resend verification
                    if not email_obj:
                        email_obj = EmailAddress.objects.create(
                            user=existing_user, email=existing_user.email, primary=True, verified=False
                        )
                    elif not email_obj.primary:
                        email_obj.primary = True
                        email_obj.save()
                    email_obj.send_confirmation(request, signup=True)
                    
                    return Response({
                        'detail': 'Verification e-mail sent.'
                    }, status=status.HTTP_201_CREATED)
                    
                else:
                    # User exists AND is verified. Let normal serializer raise duplicate error.
                    pass
            except User.DoesNotExist:
                pass

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # dj-rest-auth's RegisterSerializer requires the request object to be passed to save()
        user = serializer.save(request)
        
        from django.conf import settings
        email_verification = getattr(settings, 'ACCOUNT_EMAIL_VERIFICATION', 'optional')
        
        if email_verification == 'mandatory':
            return Response({
                'detail': 'Verification e-mail sent.'
            }, status=status.HTTP_201_CREATED)
            
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'message': 'Registration successful.',
            'user': UserSerializer(user).data,
            'token': token.key,
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """Login with email and password."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        login(request, user)
        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            'message': 'Login successful.',
            'user': UserSerializer(user).data,
            'token': token.key,
        })


class LogoutView(APIView):
    """Logout the current user."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Delete the auth token
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
        logout(request)
        return Response({'message': 'Logout successful.'}, status=status.HTTP_200_OK)


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get or update the current user's profile."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class StudentProfileView(generics.RetrieveUpdateAPIView):
    """Get or update student profile details."""
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        profile, _ = StudentProfile.objects.get_or_create(
            user=self.request.user,
            defaults={'level': 'primary_1'}
        )
        return profile


class ChangePasswordView(APIView):
    """Change the current user's password."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()

        # Update token
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
        token = Token.objects.create(user=request.user)

        return Response({
            'message': 'Password changed successfully.',
            'token': token.key,
        })


class ResendVerificationView(APIView):
    """Resend verification email to an unverified user."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal that the email doesn't exist
            return Response({'detail': 'If an account with that email exists, a verification email has been sent.'})

        email_obj = EmailAddress.objects.filter(user=user, email=email).first()
        if email_obj and email_obj.verified:
            return Response({'detail': 'This email is already verified. You can log in.'})

        try:
            # If no EmailAddress record exists yet, create one
            if not email_obj:
                email_obj = EmailAddress.objects.create(
                    user=user, email=user.email, primary=True, verified=False
                )
            elif not email_obj.primary:
                email_obj.primary = True
                email_obj.save()
            email_obj.send_confirmation(request, signup=False)
            return Response({'detail': 'Verification email sent. Please check your inbox.'})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'detail': 'Failed to send verification email. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout

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
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # dj-rest-auth's RegisterSerializer requires the request object to be passed to save()
        user = serializer.save(request)
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

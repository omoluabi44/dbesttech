from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from django.db.models import Count

from .models import School, SchoolAdminProfile, StudentProfile
from .serializers import SchoolSerializer, UserSerializer, StudentProfileSerializer, UserRegistrationSerializer
from utils.permissions import IsRootAdmin, IsSchoolAdmin

User = get_user_model()

class SchoolViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Schools.
    Public can list schools (for registration).
    Root Admin has full CRUD.
    """
    queryset = School.objects.all().order_by('name')
    serializer_class = SchoolSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated, IsRootAdmin]
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsRootAdmin])
    def stats(self, request):
        """Root Admin stats: total schools, total students"""
        total_schools = School.objects.count()
        total_students = StudentProfile.objects.count()
        return Response({
            'total_schools': total_schools,
            'total_students': total_students
        })

class SchoolAdminDashboardViewSet(viewsets.ViewSet):
    """
    Dashboard for School Admins.
    """
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    @action(detail=False, methods=['get'])
    def students(self, request):
        """List all students for the admin's school."""
        try:
            admin_profile = request.user.school_admin_profile
            students = StudentProfile.objects.filter(school=admin_profile.school)
            serializer = StudentProfileSerializer(students, many=True)
            return Response(serializer.data)
        except SchoolAdminProfile.DoesNotExist:
            return Response({'error': 'Not assigned to any school.'}, status=403)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """School Admin stats: total students in their school."""
        try:
            admin_profile = request.user.school_admin_profile
            total_students = StudentProfile.objects.filter(school=admin_profile.school).count()
            return Response({
                'school_name': admin_profile.school.name,
                'total_students': total_students
            })
        except SchoolAdminProfile.DoesNotExist:
            return Response({'error': 'Not assigned to any school.'}, status=403)

class SchoolAdminStudentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for School Admins to manage students in their school.
    """
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        if self.request.user.role == 'root_admin' or self.request.user.is_superuser:
            return User.objects.filter(role='student').order_by('-date_joined')
            
        try:
            admin_profile = self.request.user.school_admin_profile
            return User.objects.filter(
                role='student',
                student_profile__school=admin_profile.school
            ).order_by('-date_joined')
        except SchoolAdminProfile.DoesNotExist:
            return User.objects.none()

    def get_serializer_class(self):
        if self.action == 'create':
            return UserRegistrationSerializer
        return UserSerializer

    def create(self, request, *args, **kwargs):
        # We reuse UserRegistrationSerializer for creation.
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # RegisterSerializer's save will call custom_signup, 
        # but we also need to ensure the student is tied to the admin's school.
        user = serializer.save(request)
        
        # Tie to admin's school if school admin
        if self.request.user.role == 'school_admin' or hasattr(self.request.user, 'school_admin_profile'):
            try:
                admin_profile = request.user.school_admin_profile
                profile = user.student_profile
                profile.school = admin_profile.school
                profile.save()
            except SchoolAdminProfile.DoesNotExist:
                pass
        
        headers = self.get_success_headers(serializer.data)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED, headers=headers)

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        user = self.get_object()
        from allauth.account.models import EmailAddress
        email_obj, created = EmailAddress.objects.get_or_create(
            user=user, 
            email=user.email,
            defaults={'primary': True, 'verified': True}
        )
        if not created and not email_obj.verified:
            email_obj.verified = True
            email_obj.save()
        return Response({'status': 'Email marked as verified.'})

from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from django.db.models import Count

from .models import School, SchoolAdminProfile, StudentProfile
from .serializers import SchoolSerializer, UserSerializer, StudentProfileSerializer
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

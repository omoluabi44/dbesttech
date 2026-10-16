from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from django.db.models import Count

from .models import School, SchoolAdminProfile, StudentProfile, SubscriptionPlan
from .serializers import SchoolSerializer, UserSerializer, StudentProfileSerializer, UserRegistrationSerializer, SubscriptionPlanAdminSerializer, AdminUserCreationSerializer
from utils.permissions import IsRootAdmin, IsSchoolAdmin, IsAdminUser

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
            permission_classes = [permissions.IsAuthenticated, IsAdminUser]
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsAdminUser])
    def stats(self, request):
        """Root Admin stats: total schools, total students, quiz metrics, and recent sessions"""
        total_schools = School.objects.count()
        total_students = StudentProfile.objects.count()
        total_users = User.objects.count()
        from allauth.account.models import EmailAddress
        from apps.quiz.models import PracticeSession, PastQuestionSession
        from django.db.models import Avg, Sum
        from django.utils import timezone

        total_confirmed = EmailAddress.objects.filter(verified=True).count()

        practice_completed = PracticeSession.objects.filter(status='completed')
        pq_completed = PastQuestionSession.objects.filter(status='completed')

        practice_count = practice_completed.count()
        pq_count = pq_completed.count()
        total_quizzes = practice_count + pq_count

        prac_avg = practice_completed.aggregate(avg=Avg('score_percentage'))['avg'] or 0
        pq_avg = pq_completed.aggregate(avg=Avg('score_percentage'))['avg'] or 0
        
        if practice_count > 0 and pq_count > 0:
            avg_score = round(float((prac_avg * practice_count + pq_avg * pq_count) / total_quizzes), 1)
        elif practice_count > 0:
            avg_score = round(float(prac_avg), 1)
        elif pq_count > 0:
            avg_score = round(float(pq_avg), 1)
        else:
            avg_score = 0.0

        prac_q = practice_completed.aggregate(sum=Sum('total_questions'))['sum'] or 0
        pq_q = pq_completed.aggregate(sum=Sum('total_questions'))['sum'] or 0
        total_questions = prac_q + pq_q

        # Recent 8 sessions across both practice and past questions
        recent_practice = PracticeSession.objects.select_related('student', 'subject').order_by('-started_at')[:8]
        recent_pq = PastQuestionSession.objects.select_related('student', 'subject').order_by('-started_at')[:8]

        recent_list = []
        for s in recent_practice:
            student_name = f"{s.student.first_name} {s.student.last_name}".strip() or s.student.username
            recent_list.append({
                'id': f"prac_{s.id}",
                'session_id': s.id,
                'type': 'practice',
                'student_id': s.student.id,
                'student_name': student_name,
                'student_email': s.student.email,
                'subject_name': s.subject.name,
                'level': s.get_level_display() if hasattr(s, 'get_level_display') else s.level,
                'difficulty': s.difficulty,
                'score_percentage': float(s.score_percentage),
                'correct_answers': s.correct_answers,
                'total_questions': s.total_questions,
                'status': s.status,
                'completed_at': s.completed_at or s.started_at,
            })
        for s in recent_pq:
            student_name = f"{s.student.first_name} {s.student.last_name}".strip() or s.student.username
            recent_list.append({
                'id': f"pq_{s.id}",
                'session_id': s.id,
                'type': 'past_question',
                'student_id': s.student.id,
                'student_name': student_name,
                'student_email': s.student.email,
                'subject_name': s.subject.name,
                'level': s.get_level_display() if hasattr(s, 'get_level_display') else s.level,
                'exam_body': s.get_exam_body_display(),
                'year': s.year,
                'score_percentage': float(s.score_percentage),
                'correct_answers': s.correct_answers,
                'total_questions': s.total_questions,
                'status': s.status,
                'completed_at': s.completed_at or s.started_at,
            })

        recent_list.sort(key=lambda x: x.get('completed_at') or timezone.now(), reverse=True)

        return Response({
            'total_schools': total_schools,
            'total_students': total_users,
            'total_confirmed_users': total_confirmed,
            'total_quizzes': total_quizzes,
            'average_score': avg_score,
            'total_questions_attempted': total_questions,
            'recent_sessions': recent_list[:8],
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

from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 1000

class SchoolAdminStudentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for School Admins to manage students in their school.
    """
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        role = self.request.query_params.get('role')
        level = self.request.query_params.get('level')
        search = self.request.query_params.get('search', '').strip()

        if self.request.user.role in ['root_admin', 'admin'] or self.request.user.is_superuser:
            qs = User.objects.all().order_by('-date_joined')
        else:
            try:
                admin_profile = self.request.user.school_admin_profile
                qs = User.objects.filter(
                    role='student',
                    student_profile__school=admin_profile.school
                ).order_by('-date_joined')
            except SchoolAdminProfile.DoesNotExist:
                return User.objects.none()

        if role:
            qs = qs.filter(role=role)
        if level and level != 'all':
            qs = qs.filter(student_profile__level=level)
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(username__icontains=search) |
                Q(email__icontains=search)
            )
        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return AdminUserCreationSerializer
        return UserSerializer

    def create(self, request, *args, **kwargs):
        # We use AdminUserCreationSerializer for creation.
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # RegisterSerializer's save will call custom_signup, 
        # but we also need to ensure the student is tied to the admin's school.
        user = serializer.save(request)
        
        # Tie to admin's school if school admin
        if self.request.user.role == 'school_admin' or hasattr(self.request.user, 'school_admin_profile'):
            try:
                if hasattr(user, 'student_profile'):
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

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsRootAdmin])
    def make_admin(self, request, pk=None):
        user = self.get_object()
        if user.role == 'admin':
            return Response({'status': 'User is already an admin.'}, status=status.HTTP_400_BAD_REQUEST)
        user.role = 'admin'
        user.save()
        return Response({'status': 'User successfully promoted to admin.'})


class SubscriptionPlanAdminViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Root Admins and Admins to manage subscription plans from the frontend UI.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    serializer_class = SubscriptionPlanAdminSerializer
    queryset = SubscriptionPlan.objects.all().order_by('order')

from .models import PlatformSetting
from .serializers import PlatformSettingSerializer
from rest_framework import views

class PlatformSettingView(views.APIView):
    """
    API View to retrieve and update the global platform setting.
    Only Root Admin can modify this.
    """
    permission_classes = [permissions.IsAuthenticated, IsRootAdmin]

    def get(self, request):
        setting = PlatformSetting.get_setting()
        serializer = PlatformSettingSerializer(setting)
        return Response(serializer.data)

    def patch(self, request):
        setting = PlatformSetting.get_setting()
        serializer = PlatformSettingSerializer(setting, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

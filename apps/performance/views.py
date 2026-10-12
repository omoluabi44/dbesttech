from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Avg, Max, Min

from .models import PerformanceSummary, WeeklyProgress, StrengthWeakness
from .serializers import (
    PerformanceSummarySerializer,
    WeeklyProgressSerializer,
    StrengthWeaknessSerializer,
    OverallPerformanceSerializer,
    LeaderboardEntrySerializer,
)
from utils.constants import SCHOOL_LEVELS
from apps.quiz.models import Subject



class OverallPerformanceView(APIView):
    """Get overall performance summary across all subjects."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        summaries = PerformanceSummary.objects.filter(student=request.user)
        
        if not summaries.exists():
            return Response({
                'total_quizzes': 0,
                'total_questions': 0,
                'total_correct': 0,
                'overall_accuracy': 0,
                'overall_average_score': 0,
                'total_time_spent_seconds': 0,
                'subjects_count': 0,
                'strongest_subject': None,
                'weakest_subject': None,
            })
        
        aggregates = summaries.aggregate(
            total_quizzes=Sum('total_quizzes_taken'),
            total_questions=Sum('total_questions_attempted'),
            total_correct=Sum('total_correct_answers'),
            avg_score=Avg('average_score'),
            total_time=Sum('total_time_spent_seconds'),
        )
        
        # Find strongest and weakest subjects
        strongest = summaries.order_by('-average_score').first()
        weakest = summaries.order_by('average_score').first()
        
        total_q = aggregates['total_questions'] or 0
        total_c = aggregates['total_correct'] or 0
        
        data = {
            'total_quizzes': aggregates['total_quizzes'] or 0,
            'total_questions': total_q,
            'total_correct': total_c,
            'overall_accuracy': round(total_c / total_q * 100, 2) if total_q > 0 else 0,
            'overall_average_score': float(aggregates['avg_score'] or 0),
            'total_time_spent_seconds': aggregates['total_time'] or 0,
            'subjects_count': summaries.count(),
            'strongest_subject': strongest.subject.name if strongest else None,
            'weakest_subject': weakest.subject.name if weakest else None,
        }
        
        serializer = OverallPerformanceSerializer(data)
        return Response(serializer.data)


class SubjectPerformanceView(generics.ListAPIView):
    """Get performance broken down by subject."""
    serializer_class = PerformanceSummarySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return PerformanceSummary.objects.filter(
            student=self.request.user
        ).select_related('subject').order_by('-average_score')


class WeeklyProgressView(generics.ListAPIView):
    """Get weekly progress trend."""
    serializer_class = WeeklyProgressSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = WeeklyProgress.objects.filter(student=self.request.user)
        
        # Optional: limit number of weeks
        weeks = self.request.query_params.get('weeks')
        if weeks:
            try:
                queryset = queryset[:int(weeks)]
            except (ValueError, TypeError):
                pass
        
        return queryset


class StrengthWeaknessView(generics.ListAPIView):
    """Get topic-level strengths and weaknesses."""
    serializer_class = StrengthWeaknessSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = StrengthWeakness.objects.filter(
            student=self.request.user
        ).select_related('topic', 'topic__subject')
        
        # Optional filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter == 'strong':
            queryset = queryset.filter(mastery_percentage__gte=80)
        elif status_filter == 'weak':
            queryset = queryset.filter(mastery_percentage__lt=50)
        elif status_filter == 'average':
            queryset = queryset.filter(
                mastery_percentage__gte=50,
                mastery_percentage__lt=80,
            )
            
        subject_id = self.request.query_params.get('subject_id')
        if subject_id:
            queryset = queryset.filter(topic__subject_id=subject_id)
        
        return queryset


class LeaderboardView(APIView):
    """
    Leaderboard rankings based on class level and subject.
    Query params:
    - level: e.g. 'primary_1', 'primary_2', etc. (Defaults to student's level or 'primary_1')
    - subject_id: optional integer. If provided, filters to that subject. If omitted or 'all', aggregates across all subjects.
    - limit: optional integer. Max students returned (default 50).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        level = request.query_params.get('level')
        if not level:
            student_profile = getattr(request.user, 'student_profile', None)
            level = getattr(student_profile, 'level', 'primary_1') if student_profile else 'primary_1'

        level_dict = dict(SCHOOL_LEVELS)
        level_display = level_dict.get(level, level.replace('_', ' ').title())

        subject_id_raw = request.query_params.get('subject_id')
        subject_id = None
        subject_name = None
        if subject_id_raw and str(subject_id_raw).lower() not in ('all', '', 'null', 'undefined'):
            try:
                subject_id = int(subject_id_raw)
                subject_obj = Subject.objects.filter(id=subject_id).first()
                if subject_obj:
                    subject_name = subject_obj.name
                else:
                    subject_id = None
            except (ValueError, TypeError):
                subject_id = None

        limit = 50
        try:
            limit = min(int(request.query_params.get('limit', 50)), 100)
        except (ValueError, TypeError):
            pass

        base_qs = PerformanceSummary.objects.filter(
            level=level,
            total_quizzes_taken__gt=0
        )

        entries = []
        if subject_id:
            qs = base_qs.filter(subject_id=subject_id).select_related(
                'student', 'student__student_profile', 'subject'
            ).order_by(
                '-total_correct_answers', '-average_score', 'total_time_spent_seconds'
            )
            for item in qs:
                user = item.student
                profile = getattr(user, 'student_profile', None)
                student_name = f"{user.first_name} {user.last_name}".strip() or user.username or f"Student #{user.id}"
                avatar_url = profile.avatar.url if (profile and profile.avatar) else None
                acc_rate = round((item.total_correct_answers / item.total_questions_attempted * 100), 1) if item.total_questions_attempted > 0 else 0.0

                entries.append({
                    'student_id': user.id,
                    'student_name': student_name,
                    'avatar_url': avatar_url,
                    'level': level,
                    'level_display': level_display,
                    'subject_id': subject_id,
                    'subject_name': item.subject.name,
                    'total_correct_answers': item.total_correct_answers,
                    'total_questions_attempted': item.total_questions_attempted,
                    'total_quizzes_taken': item.total_quizzes_taken,
                    'average_score': float(item.average_score),
                    'accuracy_rate': acc_rate,
                    'total_time_spent_seconds': item.total_time_spent_seconds,
                    'is_current_user': (user.id == request.user.id),
                })
        else:
            aggregated = base_qs.values(
                'student_id',
                'student__username',
                'student__first_name',
                'student__last_name',
                'student__student_profile__avatar'
            ).annotate(
                total_correct=Sum('total_correct_answers'),
                total_attempted=Sum('total_questions_attempted'),
                total_quizzes=Sum('total_quizzes_taken'),
                avg_score=Avg('average_score'),
                total_time=Sum('total_time_spent_seconds')
            ).order_by(
                '-total_correct', '-avg_score', 'total_time'
            )

            for item in aggregated:
                first = item['student__first_name'] or ''
                last = item['student__last_name'] or ''
                name = f"{first} {last}".strip() or item['student__username'] or f"Student #{item['student_id']}"
                avatar_url = f"/media/{item['student__student_profile__avatar']}" if item['student__student_profile__avatar'] else None
                tot_c = item['total_correct'] or 0
                tot_a = item['total_attempted'] or 0
                acc_rate = round((tot_c / tot_a * 100), 1) if tot_a > 0 else 0.0

                entries.append({
                    'student_id': item['student_id'],
                    'student_name': name,
                    'avatar_url': avatar_url,
                    'level': level,
                    'level_display': level_display,
                    'subject_id': None,
                    'subject_name': 'All Subjects',
                    'total_correct_answers': tot_c,
                    'total_questions_attempted': tot_a,
                    'total_quizzes_taken': item['total_quizzes'] or 0,
                    'average_score': round(float(item['avg_score'] or 0), 1),
                    'accuracy_rate': acc_rate,
                    'total_time_spent_seconds': item['total_time'] or 0,
                    'is_current_user': (item['student_id'] == request.user.id),
                })

        # Assign ranks
        current_user_entry = None
        for idx, entry in enumerate(entries, start=1):
            entry['rank'] = idx
            if entry['is_current_user']:
                current_user_entry = entry

        total_participants = len(entries)
        top_entries = entries[:limit]

        # Available levels and subjects for filter dropdowns
        available_levels = [{'code': code, 'label': label} for code, label in SCHOOL_LEVELS]
        
        # Available subjects for this level
        subjects_qs = Subject.objects.filter(is_active=True).order_by('name')
        available_subjects = []
        for s in subjects_qs:
            if not s.applicable_levels or level in s.applicable_levels:
                available_subjects.append({'id': s.id, 'name': s.name})

        return Response({
            'level': level,
            'level_display': level_display,
            'subject_id': subject_id,
            'subject_name': subject_name or 'All Subjects',
            'leaderboard': LeaderboardEntrySerializer(top_entries, many=True).data,
            'current_user_rank': LeaderboardEntrySerializer(current_user_entry).data if current_user_entry else None,
            'total_participants': total_participants,
            'available_levels': available_levels,
            'available_subjects': available_subjects,
        })



class AdminStudentResultsView(APIView):
    """
    Admin view to see any student's quiz result history.
    Query params:
    - student_id: required integer
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from utils.permissions import IsAdminUser
        if request.user.role not in ['admin', 'root_admin']:
            return Response({'error': 'Admin access required.'}, status=403)

        student_id = request.query_params.get('student_id')
        if not student_id:
            return Response({'error': 'student_id is required.'}, status=400)

        from apps.quiz.models import PracticeSession, PastQuestionSession
        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            student = User.objects.get(id=student_id)
        except User.DoesNotExist:
            return Response({'error': 'Student not found.'}, status=404)

        # Practice sessions
        practice_sessions = PracticeSession.objects.filter(
            student=student, status='completed'
        ).select_related('subject').order_by('-completed_at')[:100]

        # Past question sessions
        pq_sessions = PastQuestionSession.objects.filter(
            student=student, status='completed'
        ).select_related('subject').order_by('-completed_at')[:100]

        history = []
        for s in practice_sessions:
            history.append({
                'id': f"prac_{s.id}",
                'type': 'practice',
                'subject_name': s.subject.name,
                'level': s.get_level_display() if hasattr(s, 'get_level_display') else s.level,
                'difficulty': s.difficulty,
                'score_percentage': float(s.score_percentage),
                'correct_answers': s.correct_answers,
                'total_questions': s.total_questions,
                'started_at': s.started_at,
                'completed_at': s.completed_at,
            })
        for s in pq_sessions:
            history.append({
                'id': f"pq_{s.id}",
                'type': 'past_question',
                'subject_name': s.subject.name,
                'level': s.get_level_display() if hasattr(s, 'get_level_display') else s.level,
                'exam_body': s.get_exam_body_display(),
                'year': s.year,
                'score_percentage': float(s.score_percentage),
                'correct_answers': s.correct_answers,
                'total_questions': s.total_questions,
                'started_at': s.started_at,
                'completed_at': s.completed_at,
            })

        from django.utils import timezone
        history.sort(key=lambda x: x.get('completed_at') or timezone.now(), reverse=True)

        # Student info
        profile = getattr(student, 'student_profile', None)
        student_info = {
            'id': student.id,
            'email': student.email,
            'name': f"{student.first_name} {student.last_name}".strip() or student.username,
            'level': profile.get_level_display() if profile else '',
            'level_code': profile.level if profile else '',
        }

        return Response({
            'student': student_info,
            'results': history[:100],
        })


class AdminStudentPerformanceView(APIView):
    """
    Admin view to see any student's performance summary.
    Query params:
    - student_id: required integer
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['admin', 'root_admin']:
            return Response({'error': 'Admin access required.'}, status=403)

        student_id = request.query_params.get('student_id')
        if not student_id:
            return Response({'error': 'student_id is required.'}, status=400)

        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            student = User.objects.get(id=student_id)
        except User.DoesNotExist:
            return Response({'error': 'Student not found.'}, status=404)

        summaries = PerformanceSummary.objects.filter(student=student).select_related('subject')

        profile = getattr(student, 'student_profile', None)
        student_info = {
            'id': student.id,
            'email': student.email,
            'name': f"{student.first_name} {student.last_name}".strip() or student.username,
            'level': profile.get_level_display() if profile else '',
            'level_code': profile.level if profile else '',
        }

        if not summaries.exists():
            return Response({
                'student': student_info,
                'overall': {
                    'total_quizzes': 0,
                    'total_questions': 0,
                    'total_correct': 0,
                    'overall_accuracy': 0,
                    'overall_average_score': 0,
                },
                'by_subject': [],
            })

        aggregates = summaries.aggregate(
            total_quizzes=Sum('total_quizzes_taken'),
            total_questions=Sum('total_questions_attempted'),
            total_correct=Sum('total_correct_answers'),
            avg_score=Avg('average_score'),
        )

        total_q = aggregates['total_questions'] or 0
        total_c = aggregates['total_correct'] or 0

        by_subject = []
        for s in summaries.order_by('-average_score'):
            acc = round(s.total_correct_answers / s.total_questions_attempted * 100, 1) if s.total_questions_attempted > 0 else 0
            by_subject.append({
                'subject_name': s.subject.name,
                'level': s.level,
                'total_quizzes_taken': s.total_quizzes_taken,
                'total_questions_attempted': s.total_questions_attempted,
                'total_correct_answers': s.total_correct_answers,
                'average_score': float(s.average_score),
                'best_score': float(s.best_score),
                'accuracy_rate': acc,
            })

        return Response({
            'student': student_info,
            'overall': {
                'total_quizzes': aggregates['total_quizzes'] or 0,
                'total_questions': total_q,
                'total_correct': total_c,
                'overall_accuracy': round(total_c / total_q * 100, 1) if total_q > 0 else 0,
                'overall_average_score': round(float(aggregates['avg_score'] or 0), 1),
            },
            'by_subject': by_subject,
        })


class AdminLeaderboardView(APIView):
    """
    Admin-only leaderboard across all school levels.
    Query params:
    - level: optional (if omitted, aggregates across ALL levels)
    - subject_id: optional
    - limit: optional (default 50)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['admin', 'root_admin']:
            return Response({'error': 'Admin access required.'}, status=403)

        level = request.query_params.get('level')
        subject_id_raw = request.query_params.get('subject_id')
        subject_id = None
        subject_name = None
        if subject_id_raw and str(subject_id_raw).lower() not in ('all', '', 'null', 'undefined'):
            try:
                subject_id = int(subject_id_raw)
                subject_obj = Subject.objects.filter(id=subject_id).first()
                if subject_obj:
                    subject_name = subject_obj.name
                else:
                    subject_id = None
            except (ValueError, TypeError):
                subject_id = None

        limit = 50
        try:
            limit = min(int(request.query_params.get('limit', 50)), 200)
        except (ValueError, TypeError):
            pass

        base_qs = PerformanceSummary.objects.filter(total_quizzes_taken__gt=0)
        if level:
            base_qs = base_qs.filter(level=level)
        if subject_id:
            base_qs = base_qs.filter(subject_id=subject_id)

        level_dict = dict(SCHOOL_LEVELS)

        aggregated = base_qs.values(
            'student_id',
            'student__username',
            'student__first_name',
            'student__last_name',
            'student__student_profile__level',
            'student__student_profile__avatar',
        ).annotate(
            total_correct=Sum('total_correct_answers'),
            total_attempted=Sum('total_questions_attempted'),
            total_quizzes=Sum('total_quizzes_taken'),
            avg_score=Avg('average_score'),
            total_time=Sum('total_time_spent_seconds'),
        ).order_by('-total_correct', '-avg_score', 'total_time')

        entries = []
        for item in aggregated:
            first = item['student__first_name'] or ''
            last = item['student__last_name'] or ''
            name = f"{first} {last}".strip() or item['student__username'] or f"Student #{item['student_id']}"
            avatar_url = f"/media/{item['student__student_profile__avatar']}" if item['student__student_profile__avatar'] else None
            student_level = item['student__student_profile__level'] or ''
            tot_c = item['total_correct'] or 0
            tot_a = item['total_attempted'] or 0
            acc_rate = round((tot_c / tot_a * 100), 1) if tot_a > 0 else 0.0

            entries.append({
                'rank': 0,
                'student_id': item['student_id'],
                'student_name': name,
                'avatar_url': avatar_url,
                'level': student_level,
                'level_display': level_dict.get(student_level, student_level.replace('_', ' ').title()),
                'subject_id': subject_id,
                'subject_name': subject_name or 'All Subjects',
                'total_correct_answers': tot_c,
                'total_questions_attempted': tot_a,
                'total_quizzes_taken': item['total_quizzes'] or 0,
                'average_score': round(float(item['avg_score'] or 0), 1),
                'accuracy_rate': acc_rate,
                'total_time_spent_seconds': item['total_time'] or 0,
                'is_current_user': False,
            })

        for idx, entry in enumerate(entries, start=1):
            entry['rank'] = idx

        total_participants = len(entries)
        top_entries = entries[:limit]

        available_levels = [{'code': 'all', 'label': 'All Levels'}] + [{'code': code, 'label': label} for code, label in SCHOOL_LEVELS]
        subjects_qs = Subject.objects.filter(is_active=True).order_by('name')
        available_subjects = [{'id': s.id, 'name': s.name} for s in subjects_qs]

        return Response({
            'level': level or 'all',
            'level_display': level_dict.get(level, 'All Levels') if level else 'All Levels',
            'subject_id': subject_id,
            'subject_name': subject_name or 'All Subjects',
            'leaderboard': LeaderboardEntrySerializer(top_entries, many=True).data,
            'total_participants': total_participants,
            'available_levels': available_levels,
            'available_subjects': available_subjects,
        })

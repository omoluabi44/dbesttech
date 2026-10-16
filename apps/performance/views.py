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
    Admin view to see student quiz result history.
    Query params:
    - student_id: optional integer (if omitted, returns results across all students)
    - level: optional school level code
    - subject_id: optional subject ID
    - type: optional ('practice', 'past_question', 'all')
    - status: optional ('completed', 'all')
    - search: optional search query
    - limit: optional integer (default 100)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['admin', 'root_admin']:
            return Response({'error': 'Admin access required.'}, status=403)

        from apps.quiz.models import PracticeSession, PastQuestionSession, Subject
        from apps.accounts.models import StudentProfile
        from django.contrib.auth import get_user_model
        from utils.constants import SCHOOL_LEVELS
        from django.db.models import Q, Count
        from django.utils import timezone
        User = get_user_model()

        student_id = request.query_params.get('student_id')
        level = request.query_params.get('level')
        subject_id = request.query_params.get('subject_id')
        quiz_type = request.query_params.get('type', 'all')
        session_status = request.query_params.get('status')
        search_query = request.query_params.get('search', '').strip()
        
        limit = 100
        try:
            limit = min(int(request.query_params.get('limit', 100)), 300)
        except (ValueError, TypeError):
            pass

        student = None
        student_info = None
        if student_id and str(student_id).lower() not in ['all', '', 'null', 'undefined']:
            try:
                student = User.objects.get(id=student_id)
                profile = getattr(student, 'student_profile', None)
                student_info = {
                    'id': student.id,
                    'email': student.email,
                    'name': f"{student.first_name} {student.last_name}".strip() or student.username,
                    'level': profile.get_level_display() if profile else '',
                    'level_code': profile.level if profile else '',
                }
            except User.DoesNotExist:
                return Response({'error': 'Student not found.'}, status=404)

        practice_qs = PracticeSession.objects.select_related('student', 'subject', 'student__student_profile')
        pq_qs = PastQuestionSession.objects.select_related('student', 'subject', 'student__student_profile')

        if student:
            practice_qs = practice_qs.filter(student=student)
            pq_qs = pq_qs.filter(student=student)

        if level and level != 'all':
            practice_qs = practice_qs.filter(level=level)
            pq_qs = pq_qs.filter(level=level)

        if subject_id and str(subject_id).lower() not in ['all', '', 'null']:
            try:
                sub_id_int = int(subject_id)
                practice_qs = practice_qs.filter(subject_id=sub_id_int)
                pq_qs = pq_qs.filter(subject_id=sub_id_int)
            except (ValueError, TypeError):
                pass

        if session_status and session_status != 'all':
            practice_qs = practice_qs.filter(status=session_status)
            pq_qs = pq_qs.filter(status=session_status)

        if search_query:
            p_q = Q(student__first_name__icontains=search_query) | \
                  Q(student__last_name__icontains=search_query) | \
                  Q(student__username__icontains=search_query) | \
                  Q(student__email__icontains=search_query) | \
                  Q(subject__name__icontains=search_query)
            practice_qs = practice_qs.filter(p_q)
            pq_qs = pq_qs.filter(p_q)

        history = []
        if quiz_type in ['all', 'practice']:
            for s in practice_qs.order_by('-started_at')[:limit]:
                student_name = f"{s.student.first_name} {s.student.last_name}".strip() or s.student.username
                history.append({
                    'id': f"prac_{s.id}",
                    'session_id': s.id,
                    'type': 'practice',
                    'student_id': s.student.id,
                    'student_name': student_name,
                    'student_email': s.student.email,
                    'subject_id': s.subject.id,
                    'subject_name': s.subject.name,
                    'level': s.get_level_display() if hasattr(s, 'get_level_display') else s.level,
                    'level_code': s.level,
                    'difficulty': s.difficulty,
                    'current_stage': s.current_stage,
                    'score_percentage': float(s.score_percentage),
                    'correct_answers': s.correct_answers,
                    'total_questions': s.total_questions,
                    'status': s.status,
                    'started_at': s.started_at,
                    'completed_at': s.completed_at,
                })

        if quiz_type in ['all', 'past_question']:
            for s in pq_qs.order_by('-started_at')[:limit]:
                student_name = f"{s.student.first_name} {s.student.last_name}".strip() or s.student.username
                history.append({
                    'id': f"pq_{s.id}",
                    'session_id': s.id,
                    'type': 'past_question',
                    'student_id': s.student.id,
                    'student_name': student_name,
                    'student_email': s.student.email,
                    'subject_id': s.subject.id,
                    'subject_name': s.subject.name,
                    'level': s.get_level_display() if hasattr(s, 'get_level_display') else s.level,
                    'level_code': s.level,
                    'exam_body': s.get_exam_body_display() if hasattr(s, 'get_exam_body_display') else s.exam_body,
                    'year': s.year,
                    'score_percentage': float(s.score_percentage),
                    'correct_answers': s.correct_answers,
                    'total_questions': s.total_questions,
                    'status': s.status,
                    'started_at': s.started_at,
                    'completed_at': s.completed_at,
                })

        history.sort(key=lambda x: x.get('completed_at') or x.get('started_at') or timezone.now(), reverse=True)

        subjects_qs = Subject.objects.filter(is_active=True).order_by('name')
        available_subjects = [{'id': s.id, 'name': s.name} for s in subjects_qs]

        # Calculate exact student counts from database per level
        level_counts_raw = StudentProfile.objects.values('level').annotate(count=Count('id'))
        level_counts_map = {item['level']: item['count'] for item in level_counts_raw}
        total_students_count = StudentProfile.objects.count()

        available_levels = [
            {'code': 'all', 'label': f'All Levels ({total_students_count})', 'count': total_students_count}
        ]
        for code, label in SCHOOL_LEVELS:
            c = level_counts_map.get(code, 0)
            available_levels.append({
                'code': code,
                'label': f'{label} ({c})',
                'count': c
            })

        # Fetch actual students matching the class level (or all students)
        students_base_qs = User.objects.filter(role='student')
        if level and level != 'all':
            students_base_qs = students_base_qs.filter(student_profile__level=level)

        level_student_total = students_base_qs.count()

        student_list = []
        for u in students_base_qs.select_related('student_profile').order_by('first_name', 'last_name', 'username')[:500]:
            u_name = f"{u.first_name} {u.last_name}".strip() or u.username
            u_prof = getattr(u, 'student_profile', None)
            u_lvl = getattr(u_prof, 'level', '') if u_prof else ''
            u_lvl_disp = u_prof.get_level_display() if u_prof and hasattr(u_prof, 'get_level_display') else u_lvl
            student_list.append({
                'id': u.id,
                'name': u_name,
                'first_name': u.first_name,
                'last_name': u.last_name,
                'username': u.username,
                'email': u.email,
                'level': u_lvl,
                'level_display': u_lvl_disp,
            })

        return Response({
            'student': student_info,
            'results': history[:limit],
            'total_count': len(history),
            'available_subjects': available_subjects,
            'available_levels': available_levels,
            'students': student_list,
            'student_count_for_level': level_student_total,
            'total_platform_students': total_students_count,
        })


class AdminStudentPerformanceView(APIView):
    """
    Admin view to see any student's performance summary OR platform-wide subject performance.
    Query params:
    - student_id: optional integer (if omitted, aggregates across all students)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['admin', 'root_admin']:
            return Response({'error': 'Admin access required.'}, status=403)

        student_id = request.query_params.get('student_id')
        from django.contrib.auth import get_user_model
        User = get_user_model()

        student = None
        student_info = None
        if student_id and str(student_id).lower() not in ['all', '', 'null', 'undefined']:
            try:
                student = User.objects.get(id=student_id)
                profile = getattr(student, 'student_profile', None)
                student_info = {
                    'id': student.id,
                    'email': student.email,
                    'name': f"{student.first_name} {student.last_name}".strip() or student.username,
                    'level': profile.get_level_display() if profile else '',
                    'level_code': profile.level if profile else '',
                }
            except User.DoesNotExist:
                return Response({'error': 'Student not found.'}, status=404)

        if student:
            summaries = PerformanceSummary.objects.filter(student=student).select_related('subject')
        else:
            summaries = PerformanceSummary.objects.all().select_related('subject')

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

        if not student:
            by_subject_qs = summaries.values('subject__name', 'subject_id', 'level').annotate(
                total_quizzes_taken=Sum('total_quizzes_taken'),
                total_questions_attempted=Sum('total_questions_attempted'),
                total_correct_answers=Sum('total_correct_answers'),
                average_score=Avg('average_score'),
                best_score=Max('best_score'),
            ).order_by('-total_quizzes_taken')

            by_subject = []
            for s in by_subject_qs:
                t_att = s['total_questions_attempted'] or 0
                t_cor = s['total_correct_answers'] or 0
                acc = round(t_cor / t_att * 100, 1) if t_att > 0 else 0
                by_subject.append({
                    'subject_name': s['subject__name'],
                    'level': s['level'],
                    'total_quizzes_taken': s['total_quizzes_taken'] or 0,
                    'total_questions_attempted': t_att,
                    'total_correct_answers': t_cor,
                    'average_score': round(float(s['average_score'] or 0), 1),
                    'best_score': round(float(s['best_score'] or 0), 1),
                    'accuracy_rate': acc,
                })
        else:
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


class AdminSessionReviewView(APIView):
    """
    Admin view to inspect the detailed questions and answers for any quiz session.
    Query params:
    - session_id: required (int or 'prac_X' / 'pq_X')
    - type: required ('practice' or 'past_question')
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['admin', 'root_admin']:
            return Response({'error': 'Admin access required.'}, status=403)

        raw_session_id = request.query_params.get('session_id')
        session_type = request.query_params.get('type')

        if not raw_session_id:
            return Response({'error': 'session_id is required.'}, status=400)

        str_id = str(raw_session_id).strip()
        if str_id.startswith('prac_'):
            session_type = 'practice'
            clean_id = str_id.replace('prac_', '')
        elif str_id.startswith('pq_'):
            session_type = 'past_question'
            clean_id = str_id.replace('pq_', '')
        else:
            clean_id = str_id

        if not session_type:
            session_type = 'practice'

        from apps.quiz.models import PracticeSession, PastQuestionSession

        if session_type == 'practice':
            try:
                session = PracticeSession.objects.select_related('student', 'subject', 'topic').get(id=clean_id)
            except PracticeSession.DoesNotExist:
                return Response({'error': 'Practice session not found.'}, status=404)

            answers = session.answers.select_related('question').order_by('id')

            questions_data = []
            for idx, ans in enumerate(answers):
                q = ans.question
                inc = q.incorrect_answers
                options = []
                correct_answer_text = q.correct_answer or ''

                if isinstance(inc, dict):
                    for label, text in sorted(inc.items()):
                        is_c = (label.strip().upper() == str(q.correct_answer or '').strip().upper())
                        if is_c:
                            correct_answer_text = text
                        options.append({
                            'label': label,
                            'text': text,
                            'is_correct': is_c
                        })
                elif isinstance(inc, list):
                    all_opts = [q.correct_answer] + list(inc)
                    labels = ['A', 'B', 'C', 'D', 'E']
                    for o_idx, opt_text in enumerate(all_opts):
                        lbl = labels[o_idx] if o_idx < len(labels) else str(o_idx + 1)
                        is_c = (opt_text == q.correct_answer)
                        options.append({
                            'label': lbl,
                            'text': str(opt_text),
                            'is_correct': is_c
                        })

                student_answer_text = ans.selected_answer or ''
                if isinstance(inc, dict) and student_answer_text in inc:
                    student_answer_text = inc[student_answer_text]

                questions_data.append({
                    'id': q.id,
                    'question_number': idx + 1,
                    'stage': ans.stage_submitted,
                    'question_text': q.questionText,
                    'question_type': q.questionType,
                    'options': options,
                    'selected_answer': ans.selected_answer,
                    'selected_answer_text': student_answer_text,
                    'correct_answer': q.correct_answer,
                    'correct_answer_text': correct_answer_text,
                    'is_correct': ans.is_correct,
                    'explanation': q.explanation or '',
                })

            student_name = f"{session.student.first_name} {session.student.last_name}".strip() or session.student.username
            return Response({
                'session': {
                    'id': session.id,
                    'type': 'practice',
                    'student_id': session.student.id,
                    'student_name': student_name,
                    'student_email': session.student.email,
                    'subject_name': session.subject.name,
                    'topic_name': session.topic.name if session.topic else None,
                    'level': session.get_level_display() if hasattr(session, 'get_level_display') else session.level,
                    'difficulty': session.difficulty,
                    'score_percentage': float(session.score_percentage),
                    'correct_answers': session.correct_answers,
                    'total_questions': session.total_questions,
                    'status': session.status,
                    'started_at': session.started_at,
                    'completed_at': session.completed_at,
                },
                'questions': questions_data
            })

        else: # past_question
            try:
                session = PastQuestionSession.objects.select_related('student', 'subject').get(id=clean_id)
            except PastQuestionSession.DoesNotExist:
                return Response({'error': 'Past question session not found.'}, status=404)

            answers = session.answers.select_related('question').order_by('id')

            questions_data = []
            for idx, ans in enumerate(answers):
                q = ans.question
                inc = q.incorrect_answers
                options = []
                correct_answer_text = q.correct_answer or ''

                if isinstance(inc, dict):
                    for label, text in sorted(inc.items()):
                        is_c = (label.strip().upper() == str(q.correct_answer or '').strip().upper())
                        if is_c:
                            correct_answer_text = text
                        options.append({
                            'label': label,
                            'text': text,
                            'is_correct': is_c
                        })
                elif isinstance(inc, list):
                    all_opts = [q.correct_answer] + list(inc)
                    labels = ['A', 'B', 'C', 'D', 'E']
                    for o_idx, opt_text in enumerate(all_opts):
                        lbl = labels[o_idx] if o_idx < len(labels) else str(o_idx + 1)
                        is_c = (opt_text == q.correct_answer)
                        options.append({
                            'label': lbl,
                            'text': str(opt_text),
                            'is_correct': is_c
                        })

                student_answer_text = ans.selected_answer or ''
                if isinstance(inc, dict) and student_answer_text in inc:
                    student_answer_text = inc[student_answer_text]

                questions_data.append({
                    'id': q.id,
                    'question_number': idx + 1,
                    'question_text': q.questionText,
                    'question_type': q.questionType,
                    'image_url': getattr(q, 'image_url', None),
                    'options': options,
                    'selected_answer': ans.selected_answer,
                    'selected_answer_text': student_answer_text,
                    'correct_answer': q.correct_answer,
                    'correct_answer_text': correct_answer_text,
                    'is_correct': ans.is_correct,
                    'time_spent_seconds': ans.time_spent_seconds,
                    'explanation': q.explanation or '',
                })

            student_name = f"{session.student.first_name} {session.student.last_name}".strip() or session.student.username
            return Response({
                'session': {
                    'id': session.id,
                    'type': 'past_question',
                    'student_id': session.student.id,
                    'student_name': student_name,
                    'student_email': session.student.email,
                    'subject_name': session.subject.name,
                    'level': session.get_level_display() if hasattr(session, 'get_level_display') else session.level,
                    'exam_body': session.get_exam_body_display(),
                    'year': session.year,
                    'score_percentage': float(session.score_percentage),
                    'correct_answers': session.correct_answers,
                    'total_questions': session.total_questions,
                    'status': session.status,
                    'started_at': session.started_at,
                    'completed_at': session.completed_at,
                },
                'questions': questions_data
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

import json
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.quiz.models import PracticeSession, PastQuestionSession
from apps.performance.models import PerformanceSummary, WeeklyProgress, StrengthWeakness

class Command(BaseCommand):
    help = 'Recalculates performance metrics for all completed sessions'

    def handle(self, *args, **kwargs):
        # 1. Clear existing performance data to avoid duplicates/inflation
        PerformanceSummary.objects.all().delete()
        WeeklyProgress.objects.all().delete()
        StrengthWeakness.objects.all().delete()
        
        self.stdout.write("Cleared existing performance data.")

        # 2. Process all completed PracticeSessions
        practice_sessions = PracticeSession.objects.filter(status='completed')
        for session in practice_sessions:
            self._update_metrics(session, is_past_question=False)
            
        self.stdout.write(f"Processed {practice_sessions.count()} Practice Sessions.")

        # 3. Process all completed PastQuestionSessions
        past_sessions = PastQuestionSession.objects.filter(status='completed')
        for session in past_sessions:
            self._update_metrics(session, is_past_question=True)
            
        self.stdout.write(f"Processed {past_sessions.count()} Past Question Sessions.")
        self.stdout.write(self.style.SUCCESS('Successfully recalculated all performance metrics!'))

    def _update_metrics(self, session, is_past_question=False):
        student = session.student
        subject = session.subject
        level = getattr(session, 'level', 'primary_1')
        
        # 1. Update PerformanceSummary
        summary, _ = PerformanceSummary.objects.get_or_create(
            student=student, subject=subject, level=level
        )
        
        time_spent_seconds = 0
        if is_past_question:
            time_spent_seconds = sum([ans.time_spent_seconds for ans in session.answers.all()])
        else:
            if session.completed_at and session.started_at:
                time_spent_seconds = int((session.completed_at - session.started_at).total_seconds())
        
        summary.total_quizzes_taken += 1
        summary.total_questions_attempted += session.total_questions
        summary.total_correct_answers += session.correct_answers
        summary.total_time_spent_seconds += time_spent_seconds
        
        if summary.total_questions_attempted > 0:
            summary.average_score = (summary.total_correct_answers / summary.total_questions_attempted) * 100
            
        if session.score_percentage > summary.best_score:
            summary.best_score = session.score_percentage
            
        # Update last quiz date
        if not summary.last_quiz_date or (session.completed_at and session.completed_at > summary.last_quiz_date):
            summary.last_quiz_date = session.completed_at
            
        summary.save()
        
        # 2. Update WeeklyProgress
        if not session.completed_at:
            return
            
        today = session.completed_at.date()
        days_since_sunday = (today.weekday() + 1) % 7
        week_start = today - timedelta(days=days_since_sunday)
        
        weekly, _ = WeeklyProgress.objects.get_or_create(
            student=student, week_start=week_start
        )
        
        weekly.quizzes_taken += 1
        weekly.total_questions += session.total_questions
        weekly.correct_answers += session.correct_answers
        
        if weekly.total_questions > 0:
            weekly.average_score = (weekly.correct_answers / weekly.total_questions) * 100
            
        if isinstance(weekly.subjects_practiced, str):
            try:
                weekly.subjects_practiced = json.loads(weekly.subjects_practiced)
            except json.JSONDecodeError:
                weekly.subjects_practiced = []
                
        if not isinstance(weekly.subjects_practiced, list):
            weekly.subjects_practiced = []
            
        if subject.name not in weekly.subjects_practiced:
            weekly.subjects_practiced.append(subject.name)
            
        weekly.save()
        
        # 3. Update StrengthWeakness
        # We only do this if answers are prefetched or accessible
        for answer in session.answers.select_related('question__topic_obj'):
            topic = answer.question.topic_obj
            if topic:
                sw, _ = StrengthWeakness.objects.get_or_create(
                    student=student, topic=topic
                )
                sw.total_attempts += 1
                if getattr(answer, 'is_correct', False):
                    sw.correct_attempts += 1
                    
                if sw.total_attempts > 0:
                    sw.mastery_percentage = (sw.correct_attempts / sw.total_attempts) * 100
                sw.save()

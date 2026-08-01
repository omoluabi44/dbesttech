from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
import json

from apps.quiz.models import PracticeSession, PastQuestionSession
from apps.performance.models import PerformanceSummary, WeeklyProgress, StrengthWeakness

@receiver(post_save, sender=PracticeSession)
def handle_practice_session_completion(sender, instance, created, **kwargs):
    if instance.status == 'completed' and instance.completed_at:
        _update_performance_metrics(instance)

@receiver(post_save, sender=PastQuestionSession)
def handle_past_question_session_completion(sender, instance, created, **kwargs):
    if instance.status == 'completed' and instance.completed_at:
        _update_performance_metrics(instance)

def _update_performance_metrics(session):
    student = session.student
    subject = session.subject
    level = session.level
    
    # 1. Update PerformanceSummary
    summary, _ = PerformanceSummary.objects.get_or_create(
        student=student, subject=subject, level=level
    )
    
    # Estimate time spent
    time_spent_seconds = 0
    if isinstance(session, PastQuestionSession):
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
        
    summary.last_quiz_date = session.completed_at
    summary.save()
    
    # 2. Update WeeklyProgress
    # Get start of the week (Sunday)
    today = timezone.now().date()
    # isoweekday: Monday is 1, Sunday is 7. We want Sunday as start.
    # Adjust to Python's weekday() where Monday is 0, Sunday is 6.
    # If today is Sunday (6), subtract 0. If Monday (0), subtract 1...
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
        
    # Update subjects_practiced (it's a JSON list)
    if isinstance(weekly.subjects_practiced, str):
        weekly.subjects_practiced = json.loads(weekly.subjects_practiced)
    if subject.name not in weekly.subjects_practiced:
        weekly.subjects_practiced.append(subject.name)
        
    weekly.save()
    
    # 3. Update StrengthWeakness for each topic answered in this session
    # For PracticeSession, it has a 'topic' field or topics on individual questions.
    # We look at the answers
    for answer in session.answers.select_related('question__topic_obj'):
        topic = answer.question.topic_obj
        if topic:
            sw, _ = StrengthWeakness.objects.get_or_create(
                student=student, topic=topic
            )
            sw.total_attempts += 1
            if answer.is_correct:
                sw.correct_attempts += 1
                
            if sw.total_attempts > 0:
                sw.mastery_percentage = (sw.correct_attempts / sw.total_attempts) * 100
            sw.save()

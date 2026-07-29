from django.conf import settings
from django.db import models
from utils.constants import SCHOOL_LEVELS


class PerformanceSummary(models.Model):
    """Aggregated performance per subject per student."""
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='performance_summaries'
    )
    subject = models.ForeignKey(
        'quiz.Subject', on_delete=models.CASCADE, related_name='performance_summaries'
    )
    level = models.CharField(max_length=20, choices=SCHOOL_LEVELS)
    total_quizzes_taken = models.PositiveIntegerField(default=0)
    total_questions_attempted = models.PositiveIntegerField(default=0)
    total_correct_answers = models.PositiveIntegerField(default=0)
    average_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    best_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_time_spent_seconds = models.PositiveIntegerField(default=0)
    last_quiz_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('student', 'subject', 'level')
        verbose_name = 'Performance Summary'
        verbose_name_plural = 'Performance Summaries'
    
    def __str__(self):
        return f"{self.student.email} - {self.subject.name} ({self.get_level_display()})"


class WeeklyProgress(models.Model):
    """Weekly performance snapshot for trend tracking."""
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='weekly_progress'
    )
    week_start = models.DateField()
    quizzes_taken = models.PositiveIntegerField(default=0)
    total_questions = models.PositiveIntegerField(default=0)
    correct_answers = models.PositiveIntegerField(default=0)
    average_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    subjects_practiced = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('student', 'week_start')
        ordering = ['-week_start']
        verbose_name = 'Weekly Progress'
        verbose_name_plural = 'Weekly Progress Records'
    
    def __str__(self):
        return f"{self.student.email} - Week of {self.week_start}"


class StrengthWeakness(models.Model):
    """Topic-level strength/weakness analysis."""
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='strength_weaknesses'
    )
    topic = models.ForeignKey(
        'quiz.Topic', on_delete=models.CASCADE, related_name='strength_weaknesses'
    )
    total_attempts = models.PositiveIntegerField(default=0)
    correct_attempts = models.PositiveIntegerField(default=0)
    mastery_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('student', 'topic')
        ordering = ['-mastery_percentage']
        verbose_name = 'Strength & Weakness'
        verbose_name_plural = 'Strengths & Weaknesses'
    
    def __str__(self):
        return f"{self.student.email} - {self.topic.name}: {self.mastery_percentage}%"

from django.contrib import admin
from .models import PerformanceSummary, WeeklyProgress, StrengthWeakness


@admin.register(PerformanceSummary)
class PerformanceSummaryAdmin(admin.ModelAdmin):
    list_display = (
        'student', 'subject', 'level', 'total_quizzes_taken',
        'average_score', 'best_score', 'last_quiz_date'
    )
    list_filter = ('subject', 'level')
    search_fields = ('student__email',)
    readonly_fields = (
        'total_quizzes_taken', 'total_questions_attempted',
        'total_correct_answers', 'average_score', 'best_score',
        'total_time_spent_seconds', 'last_quiz_date',
    )


@admin.register(WeeklyProgress)
class WeeklyProgressAdmin(admin.ModelAdmin):
    list_display = (
        'student', 'week_start', 'quizzes_taken',
        'average_score', 'subjects_practiced'
    )
    list_filter = ('week_start',)
    search_fields = ('student__email',)


@admin.register(StrengthWeakness)
class StrengthWeaknessAdmin(admin.ModelAdmin):
    list_display = ('student', 'topic', 'total_attempts', 'correct_attempts', 'mastery_percentage')
    list_filter = ('topic__subject',)
    search_fields = ('student__email', 'topic__name')

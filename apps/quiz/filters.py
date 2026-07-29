import django_filters
from .models import Question, QuizSession


class QuestionFilter(django_filters.FilterSet):
    """Filter for questions."""
    subject = django_filters.CharFilter(field_name='subject__slug')
    min_year = django_filters.NumberFilter(field_name='year', lookup_expr='gte')
    max_year = django_filters.NumberFilter(field_name='year', lookup_expr='lte')

    class Meta:
        model = Question
        fields = ['subject', 'level', 'difficulty', 'source', 'exam_body', 'is_active']


class QuizSessionFilter(django_filters.FilterSet):
    """Filter for quiz sessions."""
    subject = django_filters.CharFilter(field_name='subject__slug')
    start_date = django_filters.DateFilter(field_name='started_at', lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name='started_at', lookup_expr='lte')

    class Meta:
        model = QuizSession
        fields = ['subject', 'level', 'difficulty', 'status', 'quiz_type']

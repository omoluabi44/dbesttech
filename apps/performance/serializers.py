from rest_framework import serializers
from .models import PerformanceSummary, WeeklyProgress, StrengthWeakness


class PerformanceSummarySerializer(serializers.ModelSerializer):
    """Serializer for performance summary."""
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    accuracy_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = PerformanceSummary
        fields = [
            'id', 'subject_name', 'level', 'level_display',
            'total_quizzes_taken', 'total_questions_attempted',
            'total_correct_answers', 'average_score', 'best_score',
            'accuracy_rate', 'total_time_spent_seconds', 'last_quiz_date',
        ]
    
    def get_accuracy_rate(self, obj):
        if obj.total_questions_attempted > 0:
            return round(obj.total_correct_answers / obj.total_questions_attempted * 100, 2)
        return 0


class WeeklyProgressSerializer(serializers.ModelSerializer):
    """Serializer for weekly progress."""
    accuracy_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = WeeklyProgress
        fields = [
            'id', 'week_start', 'quizzes_taken', 'total_questions',
            'correct_answers', 'average_score', 'accuracy_rate',
            'subjects_practiced',
        ]
    
    def get_accuracy_rate(self, obj):
        if obj.total_questions > 0:
            return round(obj.correct_answers / obj.total_questions * 100, 2)
        return 0


class StrengthWeaknessSerializer(serializers.ModelSerializer):
    """Serializer for strength/weakness analysis."""
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    subject_name = serializers.CharField(source='topic.subject.name', read_only=True)
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = StrengthWeakness
        fields = [
            'id', 'topic_name', 'subject_name', 'total_attempts',
            'correct_attempts', 'mastery_percentage', 'status',
        ]
    
    def get_status(self, obj):
        """Categorize mastery level."""
        if obj.mastery_percentage >= 80:
            return 'strong'
        elif obj.mastery_percentage >= 50:
            return 'average'
        return 'weak'


class OverallPerformanceSerializer(serializers.Serializer):
    """Serializer for overall performance overview."""
    total_quizzes = serializers.IntegerField()
    total_questions = serializers.IntegerField()
    total_correct = serializers.IntegerField()
    overall_accuracy = serializers.FloatField()
    overall_average_score = serializers.FloatField()
    total_time_spent_seconds = serializers.IntegerField()
    subjects_count = serializers.IntegerField()
    strongest_subject = serializers.CharField(allow_null=True)
    weakest_subject = serializers.CharField(allow_null=True)

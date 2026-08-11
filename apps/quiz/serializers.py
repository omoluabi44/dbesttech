from rest_framework import serializers
from .models import (
    Subject, Topic, Quiz, PracticeSession, PracticeAnswer,
    PastQuestion, PastQuestionSession, PastQuestionAnswer,
    PastQuestionUpload
)

class SubjectSerializer(serializers.ModelSerializer):
    unlocked_difficulties = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = ['id', 'name', 'slug', 'description', 'icon', 'applicable_levels', 'unlocked_difficulties']

    def get_unlocked_difficulties(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return ['easy']
            
        unlocked = ['easy']
        if PracticeSession.objects.filter(
            student=request.user, subject=obj, difficulty='easy', status='completed', score_percentage__gte=50
        ).exists():
            unlocked.append('medium')
            
        if PracticeSession.objects.filter(
            student=request.user, subject=obj, difficulty='medium', status='completed', score_percentage__gte=50
        ).exists():
            unlocked.append('hard')
            
        return unlocked


class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = ['id', 'name', 'level', 'description']


class QuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = [
            'id', 'questionText', 'questionType', 'correct_answer', 
            'incorrect_answers', 'explanation'
        ]

class PastQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PastQuestion
        fields = [
            'id', 'questionText', 'questionType', 'correct_answer', 
            'incorrect_answers', 'explanation'
        ]

class PastQuestionUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PastQuestionUpload
        fields = [
            'id', 'subject', 'level', 'exam_body', 'year', 'file',
            'status', 'questions_extracted', 'error_message', 'uploaded_at', 'processed_at'
        ]
        read_only_fields = ['status', 'questions_extracted', 'error_message', 'uploaded_at', 'processed_at']


class PracticeSessionSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    
    class Meta:
        model = PracticeSession
        fields = [
            'id', 'subject_name', 'level', 'current_stage', 'status',
            'stage_1_score', 'stage_2_score', 'stage_3_score', 'stage_4_score', 'stage_5_score',
            'score_percentage'
        ]

class PracticeAnswerSubmissionSerializer(serializers.Serializer):
    question_id = serializers.CharField()
    selected_answer = serializers.CharField(allow_blank=True, required=False)

class PracticeStageSubmitSerializer(serializers.Serializer):
    stage = serializers.IntegerField(min_value=1, max_value=5)
    answers = PracticeAnswerSubmissionSerializer(many=True)


class PastQuestionSessionSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    exam_body_display = serializers.CharField(source='get_exam_body_display', read_only=True)
    
    class Meta:
        model = PastQuestionSession
        fields = ['id', 'subject_name', 'exam_body_display', 'year', 'status', 'score_percentage', 'total_questions', 'correct_answers']

class PastAnswerSubmissionSerializer(serializers.Serializer):
    question_id = serializers.CharField()
    selected_answer = serializers.CharField(allow_blank=True, required=False)
    time_spent_seconds = serializers.IntegerField(default=0)

class PastQuestionAnswerReviewSerializer(serializers.ModelSerializer):
    question = PastQuestionSerializer(read_only=True)

    class Meta:
        model = PastQuestionAnswer
        fields = ['id', 'question', 'selected_answer', 'is_correct']

class PracticeAnswerReviewSerializer(serializers.ModelSerializer):
    question = QuizSerializer(read_only=True)

    class Meta:
        model = PracticeAnswer
        fields = ['id', 'question', 'selected_answer', 'is_correct']


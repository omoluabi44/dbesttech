import uuid
from django.conf import settings
from django.db import models
from utils.constants import (
    SCHOOL_LEVELS, DIFFICULTY_CHOICES, QUESTION_SOURCE_CHOICES,
    QUIZ_TYPE_CHOICES, QUIZ_STATUS_CHOICES, EXAM_BODY_CHOICES
)

class Subject(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True, default='')
    icon = models.ImageField(upload_to='subject_icons/', null=True, blank=True)
    applicable_levels = models.JSONField(
        default=list,
        help_text='List of level codes this subject applies to',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name

class Topic(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='topics')
    name = models.CharField(max_length=200)
    level = models.CharField(max_length=20, choices=SCHOOL_LEVELS)
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['subject', 'level', 'name']
        unique_together = ('subject', 'name', 'level')
    
    def __str__(self):
        return f"{self.subject.name} - {self.name} ({self.get_level_display()})"

class Quiz(models.Model):
    """Unified Quiz model for both practice and past questions."""
    class Meta:
        db_table = 'quizzes'
        ordering = ['-created_at']

    QUESTION_TYPE_CHOICES = [
        ('mcq', 'MCQ'),
        ('theory', 'Theory'),
    ]

    id = models.CharField(max_length=60, primary_key=True, default=uuid.uuid4, editable=False)
    
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='quizzes')
    topic_obj = models.ForeignKey(Topic, on_delete=models.SET_NULL, null=True, blank=True, related_name='quizzes')
    
    level = models.CharField(max_length=20, choices=SCHOOL_LEVELS)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    
    is_practice = models.BooleanField(default=True)
    is_past_question = models.BooleanField(default=False)
    exam_body = models.CharField(max_length=50, choices=EXAM_BODY_CHOICES, null=True, blank=True)
    year = models.CharField(max_length=120, null=True, blank=True)

    questionText = models.TextField(db_column='questionText')
    questionType = models.CharField(
        max_length=10,
        choices=QUESTION_TYPE_CHOICES,
        default='mcq',
        db_column='questionType',
    )
    
    correct_answer = models.CharField(max_length=120, null=True, blank=True)
    incorrect_answers = models.JSONField(null=True, blank=True)
    explanation = models.TextField(null=True, blank=True)
    
    modelAnswer = models.TextField(null=True, blank=True, db_column='modelAnswer')
    markingGuide = models.JSONField(null=True, blank=True, db_column='markingGuide')
    
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = str(uuid.uuid4())
        elif not isinstance(self.id, str):
            self.id = str(self.id)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.get_questionType_display()}: {self.questionText[:50]}..."

class PastQuestion(models.Model):
    """Past Question model, mirroring Quiz model structure."""
    class Meta:
        db_table = 'past_questions'
        ordering = ['-created_at']

    QUESTION_TYPE_CHOICES = [
        ('mcq', 'MCQ'),
        ('theory', 'Theory'),
    ]

    id = models.CharField(max_length=60, primary_key=True, default=uuid.uuid4, editable=False)
    
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='past_questions')
    topic_obj = models.ForeignKey(Topic, on_delete=models.SET_NULL, null=True, blank=True, related_name='past_questions')
    
    level = models.CharField(max_length=20, choices=SCHOOL_LEVELS)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    
    exam_body = models.CharField(max_length=50, choices=EXAM_BODY_CHOICES, null=True, blank=True)
    year = models.CharField(max_length=120, null=True, blank=True)

    questionText = models.TextField(db_column='questionText')
    questionType = models.CharField(
        max_length=10,
        choices=QUESTION_TYPE_CHOICES,
        default='mcq',
        db_column='questionType',
    )
    
    correct_answer = models.CharField(max_length=120, null=True, blank=True)
    incorrect_answers = models.JSONField(null=True, blank=True)
    explanation = models.TextField(null=True, blank=True)
    
    modelAnswer = models.TextField(null=True, blank=True, db_column='modelAnswer')
    markingGuide = models.JSONField(null=True, blank=True, db_column='markingGuide')
    
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = str(uuid.uuid4())
        elif not isinstance(self.id, str):
            self.id = str(self.id)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.exam_body} {self.year}: {self.questionText[:50]}..."

class PracticeSession(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='practice_sessions')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    topic = models.ForeignKey(Topic, on_delete=models.SET_NULL, null=True, blank=True)
    level = models.CharField(max_length=20, choices=SCHOOL_LEVELS)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    status = models.CharField(max_length=15, choices=QUIZ_STATUS_CHOICES, default='in_progress')
    
    current_stage = models.IntegerField(default=1)
    total_questions = models.PositiveIntegerField(default=100)
    correct_answers = models.PositiveIntegerField(default=0)
    score_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    stage_1_score = models.IntegerField(null=True, blank=True)
    stage_2_score = models.IntegerField(null=True, blank=True)
    stage_3_score = models.IntegerField(null=True, blank=True)
    stage_4_score = models.IntegerField(null=True, blank=True)
    stage_5_score = models.IntegerField(null=True, blank=True)
    stage_6_score = models.IntegerField(null=True, blank=True)
    stage_7_score = models.IntegerField(null=True, blank=True)
    stage_8_score = models.IntegerField(null=True, blank=True)
    stage_9_score = models.IntegerField(null=True, blank=True)
    stage_10_score = models.IntegerField(null=True, blank=True)
    
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-started_at']

class PracticeAnswer(models.Model):
    session = models.ForeignKey(PracticeSession, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    selected_answer = models.CharField(max_length=255, null=True, blank=True)
    is_correct = models.BooleanField(default=False)
    stage_submitted = models.IntegerField()
    answered_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('session', 'question')
        ordering = ['id']

class PastQuestionSession(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='past_question_sessions')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    level = models.CharField(max_length=20, choices=SCHOOL_LEVELS)
    exam_body = models.CharField(max_length=50, choices=EXAM_BODY_CHOICES)
    year = models.IntegerField()
    status = models.CharField(max_length=15, choices=QUIZ_STATUS_CHOICES, default='in_progress')
    
    total_questions = models.PositiveIntegerField(default=0)
    correct_answers = models.PositiveIntegerField(default=0)
    score_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    time_limit_seconds = models.PositiveIntegerField(default=3600)
    
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-started_at']

class PastQuestionAnswer(models.Model):
    session = models.ForeignKey(PastQuestionSession, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(PastQuestion, on_delete=models.CASCADE)
    selected_answer = models.CharField(max_length=255, null=True, blank=True)
    is_correct = models.BooleanField(default=False)
    time_spent_seconds = models.PositiveIntegerField(default=0)
    answered_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('session', 'question')

class PastQuestionUpload(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='past_uploads')
    level = models.CharField(max_length=20, choices=SCHOOL_LEVELS)
    exam_body = models.CharField(max_length=50, choices=EXAM_BODY_CHOICES)
    year = models.IntegerField()
    file = models.FileField(upload_to='past_question_uploads/')
    status = models.CharField(max_length=15, choices=[('pending', 'Pending'), ('processing', 'Processing'), ('completed', 'Completed'), ('failed', 'Failed')], default='pending')
    questions_extracted = models.PositiveIntegerField(default=0)
    error_message = models.TextField(blank=True, default='')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-uploaded_at']

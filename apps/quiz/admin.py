import logging

from django.contrib import admin
from django.utils import timezone
from .models import (
    Subject, Topic, Quiz, PracticeSession, PracticeAnswer,
    PastQuestionSession, PastQuestionAnswer, PastQuestionUpload
)

logger = logging.getLogger(__name__)

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ('name', 'subject', 'level', 'is_active')
    list_filter = ('subject', 'level', 'is_active')
    search_fields = ('name', 'subject__name')


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('questionType', 'questionText', 'subject', 'level', 'difficulty', 'is_practice', 'is_past_question', 'is_active')
    list_filter = ('subject', 'level', 'difficulty', 'is_practice', 'is_past_question', 'exam_body', 'year', 'is_active')
    search_fields = ('questionText',)


@admin.register(PracticeSession)
class PracticeSessionAdmin(admin.ModelAdmin):
    list_display = ('student', 'subject', 'level', 'current_stage', 'status', 'score_percentage', 'started_at')
    list_filter = ('status', 'level', 'subject')
    search_fields = ('student__email', 'student__username')
    readonly_fields = ('score_percentage', 'correct_answers')


@admin.register(PastQuestionSession)
class PastQuestionSessionAdmin(admin.ModelAdmin):
    list_display = ('student', 'subject', 'exam_body', 'year', 'status', 'score_percentage')
    list_filter = ('status', 'exam_body', 'year', 'subject')
    search_fields = ('student__email', 'student__username')
    readonly_fields = ('score_percentage', 'correct_answers')


@admin.register(PastQuestionUpload)
class PastQuestionUploadAdmin(admin.ModelAdmin):
    list_filter = ('status', 'exam_body', 'subject', 'level')
    search_fields = ('subject__name', 'exam_body')
    readonly_fields = (
        'status', 'questions_extracted', 'error_message',
        'uploaded_by', 'processed_at',
    )
    fieldsets = (
        ('Upload Details', {
            'fields': ('subject', 'level', 'exam_body', 'year', 'file'),
        }),
        ('Processing Status', {
            'fields': ('status', 'questions_extracted', 'error_message', 'uploaded_by', 'processed_at'),
            'classes': ('collapse',),
        }),
    )

    def save_model(self, request, obj, form, change):
        """
        On first save (create), trigger AI extraction automatically.
        Updates will not re-trigger extraction.
        """
        if not change:
            # New upload — set metadata
            obj.uploaded_by = request.user
            obj.status = 'processing'

        super().save_model(request, obj, form, change)

        if not change:
            # Trigger extraction for new uploads
            self._process_extraction(request, obj)

    def _process_extraction(self, request, obj):
        """Run the AI extraction pipeline and update the upload status."""
        try:
            from .ai.extractor import PastQuestionExtractor

            extractor = PastQuestionExtractor()
            count = extractor.process_upload(obj)

            obj.status = 'completed'
            obj.questions_extracted = count
            obj.processed_at = timezone.now()
            obj.save()

            self.message_user(
                request,
                f"✅ Successfully extracted {count} questions from "
                f"{obj.exam_body} {obj.year} {obj.subject.name}!"
            )

        except Exception as e:
            logger.error(f"Past question extraction failed for upload #{obj.id}: {e}")

            obj.status = 'failed'
            obj.error_message = str(e)
            obj.processed_at = timezone.now()
            obj.save()

            self.message_user(
                request,
                f"❌ Extraction failed: {e}",
                level='error',
            )

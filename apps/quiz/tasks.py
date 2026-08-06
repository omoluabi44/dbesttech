import logging
from celery import shared_task
from django.utils import timezone
from .models import PastQuestionUpload
from .ai.extractor import PastQuestionExtractor
from .ai.gemini_client import GeminiQuizClient

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def extract_past_questions_task(self, upload_id: int):
    """
    Background task to extract questions from an uploaded document.
    """
    try:
        upload = PastQuestionUpload.objects.get(id=upload_id)
        
        # Prevent re-processing
        if upload.status in ['completed', 'processing']:
            return f"Upload {upload_id} already {upload.status}"
            
        upload.status = 'processing'
        upload.save(update_fields=['status'])
        
        extractor = PastQuestionExtractor()
        saved_count = extractor.process_upload(upload)
        
        upload.status = 'completed'
        upload.questions_extracted = saved_count
        upload.processed_at = timezone.now()
        upload.save(update_fields=['status', 'questions_extracted', 'processed_at'])
        
        return f"Successfully extracted {saved_count} questions."
        
    except PastQuestionUpload.DoesNotExist:
        logger.error(f"Upload {upload_id} not found.")
        return "Upload not found."
    except Exception as e:
        logger.exception(f"Failed to process upload {upload_id}: {e}")
        try:
            upload = PastQuestionUpload.objects.get(id=upload_id)
            upload.status = 'failed'
            upload.error_message = str(e)
            upload.save(update_fields=['status', 'error_message'])
        except Exception:
            pass
        raise self.retry(exc=e, countdown=60 * 2)  # Retry after 2 minutes

@shared_task(bind=True, max_retries=2)
def generate_questions_task(self, subject_name: str, topic_name: str, level: str, difficulty: str, num_questions: int):
    """
    Background task to generate questions using Gemini API.
    """
    try:
        client = GeminiQuizClient()
        questions = client.generate_questions(
            subject_name=subject_name,
            topic_name=topic_name,
            level=level,
            difficulty=difficulty,
            num_questions=num_questions
        )
        return questions
    except Exception as e:
        logger.exception(f"Failed to generate questions: {e}")
        raise e

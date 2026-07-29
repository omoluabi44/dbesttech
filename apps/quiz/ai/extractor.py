"""
Past Question Extraction pipeline (Agent 2).

Handles the full process of reading an uploaded document (PDF or image),
sending it to Gemini for extraction, and saving the questions to the database.
"""

import base64
import logging

from django.db import transaction
from django.utils import timezone

from ..models import Question, Option, PastQuestionUpload

logger = logging.getLogger(__name__)


class PastQuestionExtractor:
    """
    Orchestrates past question extraction from uploaded documents.
    
    Flow:
    1. Read the uploaded file
    2. Determine type (PDF vs image)
    3. Prepare content for Gemini (text extraction for PDF, base64 for images)
    4. Call GeminiQuizClient.extract_past_questions()
    5. Validate and save questions to DB
    6. Update upload status
    """

    def process_upload(self, upload: PastQuestionUpload) -> int:
        """
        Main entry point. Processes an uploaded file and saves extracted questions.
        
        Args:
            upload: PastQuestionUpload instance with file, subject, level, etc.
        
        Returns:
            Number of questions successfully extracted and saved.
        
        Raises:
            Exception: On critical failures (propagated to admin for error display).
        """
        from .gemini_client import GeminiQuizClient

        file_path = upload.file.path
        file_name = upload.file.name.lower()

        # Determine file type and prepare content
        if file_name.endswith('.pdf'):
            file_type = 'pdf'
            file_content = self._extract_pdf_text(file_path)
            if not file_content.strip():
                raise ValueError(
                    "Could not extract any text from the PDF. "
                    "The file may be scanned images — try uploading as individual page images instead."
                )
        elif file_name.endswith(('.jpg', '.jpeg')):
            file_type = 'image/jpeg'
            file_content = self._read_image_base64(file_path)
        elif file_name.endswith('.png'):
            file_type = 'image/png'
            file_content = self._read_image_base64(file_path)
        elif file_name.endswith('.webp'):
            file_type = 'image/webp'
            file_content = self._read_image_base64(file_path)
        else:
            raise ValueError(
                f"Unsupported file type: {file_name}. "
                "Supported formats: PDF, JPEG, PNG, WEBP."
            )

        logger.info(f"Processing upload #{upload.id}: {file_name} ({file_type})")

        # Call Gemini
        client = GeminiQuizClient()
        raw_questions = client.extract_past_questions(
            file_content=file_content,
            file_type=file_type,
            exam_body=upload.exam_body,
            year=upload.year,
            subject_name=upload.subject.name,
            level=upload.level,
        )

        if not raw_questions:
            raise ValueError(
                "Gemini could not extract any questions from this document. "
                "Please verify the file contains clear, readable multiple-choice questions."
            )

        # Save to database in a single transaction
        saved_count = self._save_questions(
            questions_data=raw_questions,
            subject=upload.subject,
            level=upload.level,
            exam_body=upload.exam_body,
            year=upload.year,
        )

        logger.info(
            f"Upload #{upload.id}: saved {saved_count}/{len(raw_questions)} questions"
        )

        return saved_count

    def _extract_pdf_text(self, file_path: str) -> str:
        """Extract text from a PDF file using PyPDF2."""
        try:
            from PyPDF2 import PdfReader

            reader = PdfReader(file_path)
            text_parts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)

            return '\n\n'.join(text_parts)
        except Exception as e:
            logger.error(f"PDF text extraction failed: {e}")
            raise ValueError(f"Failed to read PDF file: {e}")

    def _read_image_base64(self, file_path: str) -> str:
        """Read an image file and return base64-encoded content."""
        try:
            with open(file_path, 'rb') as f:
                return base64.b64encode(f.read()).decode('utf-8')
        except Exception as e:
            logger.error(f"Image reading failed: {e}")
            raise ValueError(f"Failed to read image file: {e}")

    @transaction.atomic
    def _save_questions(
        self,
        questions_data: list[dict],
        subject,
        level: str,
        exam_body: str,
        year: int,
    ) -> int:
        """
        Save extracted questions to the database.
        
        Skips duplicates by checking question_text + subject + year.
        Uses a transaction so partial failures don't leave orphaned data.
        
        Returns number of questions saved.
        """
        saved_count = 0

        for q_data in questions_data:
            question_text = q_data['question_text']

            # Check for duplicates
            exists = Question.objects.filter(
                subject=subject,
                question_text=question_text,
                year=year,
            ).exists()

            if exists:
                logger.info(f"Skipping duplicate question: {question_text[:60]}...")
                continue

            # Create the question
            question = Question.objects.create(
                subject=subject,
                topic=None,  # Past questions are not topic-assigned by default
                level=level,
                difficulty='medium',  # Default; can be updated by admin later
                source='past_question',
                question_text=question_text,
                explanation=q_data.get('explanation', ''),
                year=year,
                exam_body=exam_body,
                is_active=True,
            )

            # Create options
            for opt_data in q_data['options']:
                Option.objects.create(
                    question=question,
                    label=opt_data['label'],
                    text=opt_data['text'],
                    is_correct=opt_data['is_correct'],
                )

            saved_count += 1

        return saved_count

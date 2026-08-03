"""
Gemini API client for quiz question generation and past question extraction.

Uses the official google-generativeai SDK with structured JSON output.
"""

import json
import logging

from django.conf import settings

import base64
from google import genai
from google.genai import types

from .prompts import (
    QUIZ_GENERATION_SYSTEM,
    EXTRACTION_SYSTEM,
    build_quiz_prompt,
    build_extraction_prompt,
)

logger = logging.getLogger(__name__)


class GeminiQuizClient:
    """
    Handles all Gemini API interactions for the quiz platform.
    
    Two main capabilities:
    1. generate_questions() — Agent 1: On-demand quiz generation
    2. extract_past_questions() — Agent 2: Past paper extraction
    """

    def __init__(self):
        project_id = getattr(settings, 'GCP_PROJECT_ID', None)
        location = getattr(settings, 'GCP_LOCATION', 'us-central1')
        if not project_id:
            raise ValueError("GCP_PROJECT_ID is not configured in settings.")
        
        self.client = genai.Client(vertexai=True, project=project_id, location=location)
        self.model_name = settings.GEMINI_MODEL

    def _get_temperature(self, difficulty: str) -> float:
        """Tune creativity based on difficulty level."""
        temps = {'easy': 0.3, 'medium': 0.5, 'hard': 0.7}
        return temps.get(difficulty, 0.5)

    def _validate_questions(self, raw_questions: list) -> list[dict]:
        """
        Validate each question dict from Gemini's response.
        
        Ensures:
        - question_text is a non-empty string
        - explanation is a non-empty string
        - Exactly 4 options with labels A, B, C, D
        - Exactly 1 option is marked is_correct=True
        
        Silently drops malformed questions with a log warning.
        """
        valid = []
        for i, q in enumerate(raw_questions):
            try:
                # Check required fields
                question_text = str(q.get('question_text', '')).strip()
                explanation = str(q.get('explanation', '')).strip()
                options = q.get('options', [])

                if not question_text:
                    logger.warning(f"Question {i}: empty question_text, skipping.")
                    continue

                if not explanation:
                    # Allow empty explanation but set a default
                    explanation = "The correct answer is based on the concepts taught in this topic."

                if not isinstance(options, list) or len(options) != 4:
                    logger.warning(f"Question {i}: expected 4 options, got {len(options) if isinstance(options, list) else 'non-list'}, skipping.")
                    continue

                # Validate option labels
                labels = set()
                correct_count = 0
                clean_options = []

                for opt in options:
                    label = str(opt.get('label', '')).strip().upper()
                    text = str(opt.get('text', '')).strip()
                    is_correct = bool(opt.get('is_correct', False))

                    if not label or not text:
                        logger.warning(f"Question {i}: option missing label or text, skipping question.")
                        break

                    labels.add(label)
                    if is_correct:
                        correct_count += 1

                    clean_options.append({
                        'label': label,
                        'text': text,
                        'is_correct': is_correct,
                    })
                else:
                    # Only reach here if we didn't break
                    if labels != {'A', 'B', 'C', 'D'}:
                        logger.warning(f"Question {i}: labels are {labels}, expected A/B/C/D, skipping.")
                        continue

                    if correct_count != 1:
                        logger.warning(f"Question {i}: {correct_count} correct options (expected 1), skipping.")
                        continue

                    valid.append({
                        'question_text': question_text,
                        'explanation': explanation,
                        'options': clean_options,
                    })
                    continue

                # If we broke out of the for loop, skip this question
                continue

            except Exception as e:
                logger.warning(f"Question {i}: unexpected error during validation: {e}")
                continue

        return valid

    def generate_questions(
        self,
        subject_name: str,
        topic_name: str | None,
        level: str,
        difficulty: str,
        num_questions: int = 20,
    ) -> list[dict]:
        """
        Generate quiz questions using Gemini AI (Agent 1).
        
        Returns a list of validated question dicts, each containing:
        - question_text (str)
        - explanation (str)
        - options (list of 4 dicts with label, text, is_correct)
        
        Returns empty list on any API or parsing failure.
        """
        try:
            prompt = build_quiz_prompt(
                subject_name=subject_name,
                topic_name=topic_name,
                level=level,
                difficulty=difficulty,
                num_questions=num_questions,
            )

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=QUIZ_GENERATION_SYSTEM,
                    temperature=self._get_temperature(difficulty),
                    response_mime_type="application/json",
                )
            )

            # Parse JSON response
            raw_text = response.text.strip()
            raw_questions = json.loads(raw_text)

            if not isinstance(raw_questions, list):
                logger.error(f"Gemini returned non-list response: {type(raw_questions)}")
                return []

            validated = self._validate_questions(raw_questions)
            logger.info(
                f"Generated {len(validated)}/{len(raw_questions)} valid questions "
                f"(requested {num_questions})"
            )
            return validated

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini JSON response: {e}")
            return []
        except Exception as e:
            logger.error(f"Gemini API error during question generation: {e}")
            return []

    def extract_past_questions(
        self,
        file_content: bytes | str,
        file_type: str,
        exam_body: str,
        year: int,
        subject_name: str,
        level: str,
    ) -> list[dict]:
        """
        Extract questions from a past exam document using Gemini (Agent 2).
        
        Args:
            file_content: Raw file bytes (for images) or extracted text (for PDFs)
            file_type: 'pdf', 'image/jpeg', 'image/png', 'image/webp'
            exam_body: e.g., 'WAEC', 'NECO', 'Common Entrance'
            year: Exam year
            subject_name: Subject name
            level: School level code
        
        Returns a list of validated question dicts, or empty list on failure.
        """
        try:
            prompt = build_extraction_prompt(
                exam_body=exam_body,
                year=year,
                subject_name=subject_name,
                level=level,
            )

            config = types.GenerateContentConfig(
                system_instruction=EXTRACTION_SYSTEM,
                temperature=0.2,
                response_mime_type="application/json",
            )

            logger.info(
                f"Extracting past questions: {exam_body} {year} "
                f"{subject_name} ({file_type})"
            )

            # Build the content parts based on file type
            if file_type == 'pdf':
                # For PDF, file_content is already extracted text
                content = f"EXAM PAPER TEXT:\n\n{file_content}\n\n{prompt}"
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=content,
                    config=config
                )
            else:
                # For images, send as multimodal input
                # If file_content is base64 string, decode it first
                if isinstance(file_content, str):
                    raw_bytes = base64.b64decode(file_content)
                else:
                    raw_bytes = file_content
                    
                image_part = types.Part.from_bytes(data=raw_bytes, mime_type=file_type)
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=[image_part, prompt],
                    config=config
                )

            # Parse JSON response
            raw_text = response.text.strip()
            raw_questions = json.loads(raw_text)

            if not isinstance(raw_questions, list):
                logger.error(f"Gemini returned non-list response for extraction: {type(raw_questions)}")
                return []

            validated = self._validate_questions(raw_questions)
            logger.info(
                f"Extracted {len(validated)}/{len(raw_questions)} valid questions "
                f"from {exam_body} {year} {subject_name}"
            )
            return validated

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini extraction response: {e}")
            return []
        except Exception as e:
            logger.error(f"Gemini API error during past question extraction: {e}")
            return []

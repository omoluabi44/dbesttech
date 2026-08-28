import logging
import random

from django.db.models import Q
from django.utils import timezone

from .models import Quiz, Topic
from utils.constants import GRADUATING_LEVELS

logger = logging.getLogger(__name__)


class QuizGeneratorService:
    """Service for generating quizzes by selecting questions."""
    
    @staticmethod
    def get_quiz_type(level):
        """Determine quiz type based on student's level."""
        if level in GRADUATING_LEVELS:
            return 'past_question'
        return 'auto_generated'
    
    @staticmethod
    def _generate_and_save_questions(subject, topic, level, difficulty, count):
        """
        Call Gemini AI to generate questions, save them to the database,
        and return the new Quiz queryset.
        """
        try:
            from .ai.gemini_client import GeminiQuizClient

            client = GeminiQuizClient()
            raw_questions = client.generate_questions(
                subject_name=subject.name,
                topic_name=topic.name if topic else None,
                level=level,
                difficulty=difficulty,
                num_questions=count,
            )

            if not raw_questions:
                logger.warning(
                    f"Gemini returned no questions for: "
                    f"subject={subject.name}, topic={topic.name if topic else 'None'}, level={level}, difficulty={difficulty}"
                )
                return Quiz.objects.none()

            created_ids = []
            for q_data in raw_questions:
                # Check for near-duplicate questions
                exists = Quiz.objects.filter(
                    subject=subject,
                    level=level,
                    questionText=q_data['question_text'],
                ).exists()

                if exists:
                    logger.debug(f"Skipping duplicate AI question: {q_data['question_text'][:60]}...")
                    continue

                # Build options for Quiz model
                options_dict = {}
                correct_label = 'A'
                for opt in q_data['options']:
                    options_dict[opt['label']] = opt['text']
                    if opt['is_correct']:
                        correct_label = opt['label']
                
                incorrect_answers = [opt['text'] for opt in q_data['options'] if not opt['is_correct']]

                quiz = Quiz.objects.create(
                    subject=subject,
                    topic_obj=topic,
                    level=level,
                    difficulty=difficulty,
                    is_practice=True,
                    is_past_question=False,
                    questionText=q_data['question_text'],
                    explanation=q_data.get('explanation', ''),
                    questionType='mcq',
                    correct_answer=correct_label,
                    incorrect_answers=options_dict, # Keeping it as options_dict for AI questions as seen in AIBulkSaveQuizView
                    is_active=True,
                )

                created_ids.append(quiz.id)

            logger.info(f"AI generated and saved {len(created_ids)} new questions.")
            return Quiz.objects.filter(id__in=created_ids)

        except Exception as e:
            logger.error(f"AI question generation failed: {e}")
            return Quiz.objects.none()
    
    @staticmethod
    def select_questions(subject, level, difficulty, num_questions=20, topic=None):
        """
        Select practice questions for a quiz session.
        If not enough questions exist, generates more with AI.
        """
        queryset = Quiz.objects.filter(
            subject=subject,
            level=level,
            difficulty=difficulty,
            is_practice=True,
            is_active=True,
        )
        
        if topic:
            queryset = queryset.filter(topic_obj=topic)
        
        # Get available questions
        available = list(queryset)
        
        # AI FALLBACK: If not enough questions, generate more
        if len(available) < num_questions:
            deficit = num_questions - len(available)
            logger.info(
                f"DB has {len(available)}/{num_questions} questions. "
                f"Generating {deficit} more with AI."
            )
            new_questions = QuizGeneratorService._generate_and_save_questions(
                subject=subject,
                topic=topic,
                level=level,
                difficulty=difficulty,
                count=deficit,
            )
            available.extend(list(new_questions))
        
        # Randomly select up to num_questions
        if len(available) <= num_questions:
            selected = available
        else:
            selected = random.sample(available, num_questions)
        
        return selected

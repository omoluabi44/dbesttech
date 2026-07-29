import logging
import random

from django.db.models import Q
from django.utils import timezone

from .models import Question, QuizSession, StudentAnswer, Option
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
        and return the new Question queryset.
        
        This is called when the existing DB pool has fewer questions than
        requested for non-graduating levels.
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
                    f"subject={subject.name}, level={level}, difficulty={difficulty}"
                )
                return Question.objects.none()

            created_ids = []
            for q_data in raw_questions:
                # Check for near-duplicate questions
                exists = Question.objects.filter(
                    subject=subject,
                    level=level,
                    question_text=q_data['question_text'],
                ).exists()

                if exists:
                    logger.debug(f"Skipping duplicate AI question: {q_data['question_text'][:60]}...")
                    continue

                question = Question.objects.create(
                    subject=subject,
                    topic=topic,
                    level=level,
                    difficulty=difficulty,
                    source='ai_generated',
                    question_text=q_data['question_text'],
                    explanation=q_data.get('explanation', ''),
                    is_active=True,
                )

                for opt_data in q_data['options']:
                    Option.objects.create(
                        question=question,
                        label=opt_data['label'],
                        text=opt_data['text'],
                        is_correct=opt_data['is_correct'],
                    )

                created_ids.append(question.id)

            logger.info(f"AI generated and saved {len(created_ids)} new questions.")
            return Question.objects.filter(id__in=created_ids)

        except Exception as e:
            logger.error(f"AI question generation failed: {e}")
            return Question.objects.none()
    
    @staticmethod
    def select_questions(subject, level, difficulty, num_questions=20, topic=None, year=None, exam_body=None):
        """
        Select questions for a quiz session.
        For graduating levels: selects from past questions.
        For other levels: selects from all available questions (AI-generated or manual).
        If not enough questions exist for non-graduating levels, generates more with AI.
        """
        queryset = Question.objects.filter(
            subject=subject,
            level=level,
            difficulty=difficulty,
            is_active=True,
        )
        
        quiz_type = QuizGeneratorService.get_quiz_type(level)
        
        if quiz_type == 'past_question':
            queryset = queryset.filter(source='past_question')
            if year:
                queryset = queryset.filter(year=year)
            if exam_body:
                queryset = queryset.filter(exam_body=exam_body)
        else:
            # For auto-generated quizzes, use any available questions
            queryset = queryset.filter(
                Q(source='ai_generated') | Q(source='manual')
            )
        
        if topic:
            queryset = queryset.filter(topic=topic)
        
        # Get available questions
        available = list(queryset)
        
        # AI FALLBACK: If non-graduating level and not enough questions, generate more
        if quiz_type != 'past_question' and len(available) < num_questions:
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
    
    @staticmethod
    def create_quiz_session(student, subject, level, difficulty, num_questions=20, topic=None, year=None, exam_body=None):
        """
        Create a new quiz session and populate it with questions.
        Returns the quiz session and list of selected questions.
        """
        quiz_type = QuizGeneratorService.get_quiz_type(level)
        
        questions = QuizGeneratorService.select_questions(
            subject=subject,
            level=level,
            difficulty=difficulty,
            num_questions=num_questions,
            topic=topic,
            year=year,
            exam_body=exam_body,
        )
        
        if not questions:
            return None, []
        
        session = QuizSession.objects.create(
            student=student,
            subject=subject,
            topic=topic,
            level=level,
            difficulty=difficulty,
            quiz_type=quiz_type,
            total_questions=len(questions),
        )
        
        return session, questions


class QuizScoringService:
    """Service for scoring quizzes and recording answers."""
    
    @staticmethod
    def submit_answer(quiz_session, question, selected_option_id, time_spent=0):
        """
        Record a student's answer for a question.
        Returns the StudentAnswer instance.
        """
        # Check if already answered
        existing = StudentAnswer.objects.filter(
            quiz_session=quiz_session,
            question=question
        ).first()
        
        if existing:
            return existing, False  # Already answered
        
        # Get the selected option
        selected_option = None
        is_correct = False
        
        if selected_option_id:
            try:
                selected_option = Option.objects.get(
                    id=selected_option_id,
                    question=question
                )
                is_correct = selected_option.is_correct
            except Option.DoesNotExist:
                pass
        
        answer = StudentAnswer.objects.create(
            quiz_session=quiz_session,
            question=question,
            selected_option=selected_option,
            is_correct=is_correct,
            time_spent_seconds=time_spent,
        )
        
        return answer, True  # Newly created
    
    @staticmethod
    def complete_quiz(quiz_session):
        """
        Mark a quiz session as completed and calculate the score.
        """
        if quiz_session.status == 'completed':
            return quiz_session
        
        answers = quiz_session.answers.all()
        correct_count = answers.filter(is_correct=True).count()
        total = quiz_session.total_questions
        
        quiz_session.correct_answers = correct_count
        quiz_session.score_percentage = (
            (correct_count / total * 100) if total > 0 else 0
        )
        quiz_session.status = 'completed'
        quiz_session.completed_at = timezone.now()
        quiz_session.save()
        
        return quiz_session

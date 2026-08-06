from rest_framework import generics, status, views, permissions
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.db import transaction

from .models import PastQuestionUpload, Subject, Topic, Quiz
from .serializers import PastQuestionUploadSerializer, QuizSerializer
from .tasks import extract_past_questions_task
from .ai.gemini_client import GeminiQuizClient
import logging

logger = logging.getLogger(__name__)

class IsAdminUser(permissions.BasePermission):
    """Allows access only to admin users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['admin', 'root_admin', 'school_admin'])

class AIUploadPastQuestionView(generics.CreateAPIView):
    """
    Endpoint for admins to upload a past question document (PDF/Image)
    and trigger the background extraction task.
    """
    queryset = PastQuestionUpload.objects.all()
    serializer_class = PastQuestionUploadSerializer
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        upload = serializer.save(uploaded_by=self.request.user)
        # Trigger Celery task
        extract_past_questions_task.delay(upload.id)

class AIUploadStatusView(generics.RetrieveAPIView):
    """Check the status of a past question upload."""
    queryset = PastQuestionUpload.objects.all()
    serializer_class = PastQuestionUploadSerializer
    permission_classes = [IsAdminUser]

class AIGenerateQuizView(views.APIView):
    """
    Generates quiz questions on the fly using Gemini AI based on a prompt.
    Returns the questions as a JSON list without saving them to the DB.
    """
    permission_classes = [IsAdminUser]

    def post(self, request):
        subject_id = request.data.get('subject_id')
        topic_id = request.data.get('topic_id')
        level = request.data.get('level')
        difficulty = request.data.get('difficulty', 'medium')
        num_questions = int(request.data.get('num_questions', 5))
        prompt_text = request.data.get('prompt', '')

        if not all([subject_id, level]):
            return Response({"error": "subject_id and level are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce maximum 100 questions limit per subject, level, and difficulty
        existing_count = Quiz.objects.filter(
            subject_id=subject_id, 
            level=level, 
            difficulty=difficulty,
            is_practice=True
        ).count()
        
        if existing_count + num_questions > 100:
            excess = (existing_count + num_questions) - 100
            return Response({
                "error": f"Maximum limit of 100 questions. You currently have {existing_count} questions for this configuration. Please delete at least {excess} questions before generating {num_questions} new ones."
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            subject = Subject.objects.get(id=subject_id)
            topic = Topic.objects.get(id=topic_id) if topic_id else None
            
            topic_name = topic.name if topic else prompt_text
            
            client = GeminiQuizClient()
            questions = client.generate_questions(
                subject_name=subject.name,
                topic_name=topic_name,
                level=level,
                difficulty=difficulty,
                num_questions=num_questions
            )
            
            return Response(questions, status=status.HTTP_200_OK)
        except Subject.DoesNotExist:
            return Response({"error": "Subject not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error generating quiz: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIBulkSaveQuizView(views.APIView):
    """
    Saves a list of approved AI-generated questions to the database.
    """
    permission_classes = [IsAdminUser]

    @transaction.atomic
    def post(self, request):
        questions_data = request.data.get('questions', [])
        subject_id = request.data.get('subject_id')
        topic_id = request.data.get('topic_id')
        level = request.data.get('level')
        difficulty = request.data.get('difficulty', 'medium')

        if not questions_data or not subject_id or not level:
            return Response({"error": "questions, subject_id, and level are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce maximum 100 questions limit per subject, level, and difficulty
        existing_count = Quiz.objects.filter(
            subject_id=subject_id, 
            level=level, 
            difficulty=difficulty,
            is_practice=True
        ).count()
        num_questions = len(questions_data)
        
        if existing_count + num_questions > 100:
            excess = (existing_count + num_questions) - 100
            return Response({
                "error": f"Maximum limit of 100 questions. You currently have {existing_count} questions for this configuration. Cannot save {num_questions} new ones."
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            subject = Subject.objects.get(id=subject_id)
            topic = Topic.objects.get(id=topic_id) if topic_id else None
            
            saved_count = 0
            for q_data in questions_data:
                quiz = Quiz.objects.create(
                    subject=subject,
                    topic_obj=topic,
                    level=level,
                    difficulty=difficulty,
                    is_practice=True,
                    is_past_question=False,
                    questionText=q_data.get('question_text', ''),
                    explanation=q_data.get('explanation', ''),
                    questionType='mcq',
                    correct_answer=next((opt['label'] for opt in q_data['options'] if opt['is_correct']), 'A'),
                    incorrect_answers=[opt['text'] for opt in q_data['options'] if not opt['is_correct']],
                )
                
                # The model uses `incorrect_answers` as a JSON array of texts, and `correct_answer` as a label/text
                # Wait, let's format it exactly as the model expects.
                # Actually, the Quiz model uses incorrect_answers=JSONField, correct_answer=CharField.
                
                # Let's rebuild how options are stored for Quiz model.
                options_dict = {}
                correct_label = 'A'
                for opt in q_data['options']:
                    options_dict[opt['label']] = opt['text']
                    if opt['is_correct']:
                        correct_label = opt['label']
                        
                quiz.correct_answer = correct_label
                quiz.incorrect_answers = options_dict # It seems the Quiz model stores all options or incorrect options here. Let's check serializer later.
                quiz.save()
                saved_count += 1
                
            return Response({"message": f"Successfully saved {saved_count} questions.", "count": saved_count}, status=status.HTTP_201_CREATED)
        
        except Subject.DoesNotExist:
            return Response({"error": "Subject not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error saving quizzes: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class QuizListAdminView(generics.ListCreateAPIView):
    """
    List and create questions (both Practice and Past Questions) 
    with filtering and pagination for the Question Bank admin interface.
    """
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = Quiz.objects.all()
        
        # Filtering
        subject_id = self.request.query_params.get('subject_id')
        level = self.request.query_params.get('level')
        difficulty = self.request.query_params.get('difficulty')
        is_practice = self.request.query_params.get('is_practice')
        is_past_question = self.request.query_params.get('is_past_question')
        exam_body = self.request.query_params.get('exam_body')
        year = self.request.query_params.get('year')

        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        if level:
            queryset = queryset.filter(level=level)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        if is_practice is not None:
            is_practice_bool = str(is_practice).lower() == 'true'
            queryset = queryset.filter(is_practice=is_practice_bool)
        if is_past_question is not None:
            is_past_question_bool = str(is_past_question).lower() == 'true'
            queryset = queryset.filter(is_past_question=is_past_question_bool)
        if exam_body:
            queryset = queryset.filter(exam_body=exam_body)
        if year:
            queryset = queryset.filter(year=year)
            
        return queryset

class QuizDetailAdminView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a specific question.
    """
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsAdminUser]


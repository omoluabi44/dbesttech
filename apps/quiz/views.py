from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
import random

from .models import (
    Subject, Topic, Quiz, PracticeSession, PracticeAnswer,
    PastQuestion, PastQuestionSession, PastQuestionAnswer, PastQuestionUpload
)
from .serializers import (
    SubjectSerializer, TopicSerializer, PracticeSessionSerializer, QuizSerializer,
    PracticeStageSubmitSerializer, PastQuestionSessionSerializer,
    PastAnswerSubmissionSerializer, PastQuestionSerializer
)
from .services import QuizGeneratorService

class SubjectListView(generics.ListAPIView):
    queryset = Subject.objects.filter(is_active=True)
    serializer_class = SubjectSerializer

class TopicListView(generics.ListAPIView):
    serializer_class = TopicSerializer
    
    def get_queryset(self):
        subject_id = self.kwargs.get('subject_id')
        return Topic.objects.filter(subject_id=subject_id, is_active=True)

# ---------------------------------------------------------
# PRACTICE QUIZ API
# ---------------------------------------------------------

class PracticeStartView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        subject_id = request.data.get('subject_id')
        topic_id = request.data.get('topic_id')
        level = request.data.get('level')
        difficulty = request.data.get('difficulty', 'medium')
        
        subject = get_object_or_404(Subject, id=subject_id)
        topic = None
        if topic_id:
            topic = get_object_or_404(Topic, id=topic_id, subject=subject)
        
        if request.user.role not in ['admin', 'root_admin'] and request.user.subscription_plan == 'free':
            if difficulty != 'easy':
                return Response({'error': 'Free plan users can only access easy questions. Upgrade for medium and hard difficulty.'}, status=status.HTTP_403_FORBIDDEN)
            difficulty = 'easy'
        
        # Get up to 50 questions, with AI fallback if needed
        questions = QuizGeneratorService.select_questions(
            subject=subject,
            level=level,
            difficulty=difficulty,
            num_questions=50,
            topic=topic
        )
        
        if not questions:
            return Response({'error': f'Could not retrieve or generate {difficulty} questions for this topic.'}, status=status.HTTP_400_BAD_REQUEST)
        
        session = PracticeSession.objects.create(
            student=request.user,
            subject=subject,
            topic=topic,
            level=level,
            difficulty=difficulty,
            total_questions=len(questions),
            current_stage=1
        )
        
        for q in questions:
            PracticeAnswer.objects.create(session=session, question=q, stage_submitted=0)
            
        stage_1_answers = session.answers.order_by('id')[:10]
        stage_1_questions = [a.question for a in stage_1_answers]
        
        return Response({
            'session': PracticeSessionSerializer(session).data,
            'questions': QuizSerializer(stage_1_questions, many=True).data
        }, status=status.HTTP_201_CREATED)

class PracticeSubmitStageView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        session = get_object_or_404(PracticeSession, pk=pk, student=request.user)
        
        if session.status != 'in_progress':
            return Response({'error': 'Session is already completed.'}, status=status.HTTP_400_BAD_REQUEST)
            
        serializer = PracticeStageSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        stage = serializer.validated_data['stage']
        if stage != session.current_stage:
            return Response({'error': f'Expected answers for stage {session.current_stage}'}, status=status.HTTP_400_BAD_REQUEST)
            
        answers_data = serializer.validated_data['answers']
        
        all_session_answers = list(session.answers.order_by('id'))
        start_idx = (stage - 1) * 10
        end_idx = stage * 10
        stage_answers = all_session_answers[start_idx:end_idx]
        
        stage_correct = 0
        
        for ans_data in answers_data:
            q_id = ans_data['question_id']
            sel_ans = ans_data.get('selected_answer', '')
            
            p_ans = next((a for a in stage_answers if str(a.question_id) == str(q_id)), None)
            if p_ans:
                p_ans.selected_answer = sel_ans
                
                is_correct = False
                if sel_ans and p_ans.question.correct_answer:
                    correct_answer_text = p_ans.question.correct_answer
                    
                    # If incorrect_answers is a dict (AI-generated questions),
                    # correct_answer is a label like "A" and the dict maps labels to texts.
                    # Resolve the label to the actual text for comparison.
                    inc = p_ans.question.incorrect_answers
                    if isinstance(inc, dict) and correct_answer_text in inc:
                        correct_answer_text = inc[correct_answer_text]
                    
                    if sel_ans.strip().lower() == correct_answer_text.strip().lower():
                        is_correct = True
                    
                p_ans.is_correct = is_correct
                p_ans.stage_submitted = stage
                p_ans.save()
                
                if is_correct:
                    stage_correct += 1
                        
        setattr(session, f'stage_{stage}_score', stage_correct)
        session.correct_answers += stage_correct
        
        requires_upgrade = False
        if stage == 5 or end_idx >= len(all_session_answers):
            session.status = 'completed'
            session.completed_at = timezone.now()
            session.score_percentage = (session.correct_answers / max(1, session.total_questions)) * 100
        elif stage == 1 and request.user.role not in ['admin', 'root_admin'] and request.user.subscription_plan == 'free':
            # Do not complete the session and do not increment current_stage.
            # This allows the user to resume and submit this stage again after upgrading.
            requires_upgrade = True
        else:
            session.current_stage += 1
            
        session.save()
        
        response_data = {
            'session': PracticeSessionSerializer(session).data,
            'stage_score': stage_correct
        }
        
        if requires_upgrade:
            response_data['requires_upgrade'] = True
        
        if session.status != 'completed':
            next_start = (session.current_stage - 1) * 10
            next_end = session.current_stage * 10
            next_answers = all_session_answers[next_start:next_end]
            next_questions = [a.question for a in next_answers]
            response_data['next_questions'] = QuizSerializer(next_questions, many=True).data
            
        return Response(response_data)


class PracticeResultsView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        session = get_object_or_404(PracticeSession, pk=pk, student=request.user)
        if session.status == 'in_progress':
            session.status = 'abandoned'
            session.completed_at = timezone.now()
            
            # For abandoned sessions (like free users hitting paywall), 
            # only count the questions they actually submitted for the score.
            attempted = session.answers.filter(stage_submitted__gt=0).count()
            if attempted > 0:
                session.total_questions = attempted
                session.score_percentage = (session.correct_answers / attempted) * 100
            else:
                session.score_percentage = 0
            
            session.save()
            
        # Get user's answers and correct answers for review
        answers = session.answers.select_related('question').order_by('id')
        review_data = []
        for ans in answers:
            if ans.stage_submitted > 0:
                review_data.append({
                    'question': QuizSerializer(ans.question).data,
                    'selected_answer': ans.selected_answer,
                    'is_correct': ans.is_correct,
                })
            
        return Response({
            'session': PracticeSessionSerializer(session).data,
            'review': review_data
        })

class PracticeRetryView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        session = get_object_or_404(PracticeSession, pk=pk, student=request.user)
        
        session.current_stage = 1
        session.status = 'in_progress'
        session.correct_answers = 0
        session.score_percentage = 0.0
        session.stage_1_score = 0
        session.stage_2_score = 0
        session.stage_3_score = 0
        session.stage_4_score = 0
        session.stage_5_score = 0
        session.stage_6_score = 0
        session.stage_7_score = 0
        session.stage_8_score = 0
        session.stage_9_score = 0
        session.stage_10_score = 0
        session.completed_at = None
        session.save()
        
        session.answers.update(selected_answer=None, is_correct=False, stage_submitted=0)
        
        stage_1_answers = session.answers.order_by('id')[:10]
        stage_1_questions = [a.question for a in stage_1_answers]
        
        return Response({
            'session': PracticeSessionSerializer(session).data,
            'questions': QuizSerializer(stage_1_questions, many=True).data
        })

class PracticeReviewView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        session = get_object_or_404(PracticeSession, pk=pk, student=request.user)
        # We can optionally enforce that it must be 'completed', but for now let's just return what's available
        
        answers = session.answers.select_related('question').order_by('id')
        from .serializers import PracticeAnswerReviewSerializer
        return Response(PracticeAnswerReviewSerializer(answers, many=True).data)

# ---------------------------------------------------------
# PAST QUESTION API
# ---------------------------------------------------------

class PastQuestionFiltersView(views.APIView):
    def get(self, request):
        subject_id = request.query_params.get('subject_id')
        level = request.query_params.get('level')
        
        # Query both PastQuestion table and Quiz table (where AI uploads save)
        pq_qs = PastQuestion.objects.filter(is_active=True)
        quiz_qs = Quiz.objects.filter(is_active=True, is_past_question=True)
        
        if subject_id:
            pq_qs = pq_qs.filter(subject_id=subject_id)
            quiz_qs = quiz_qs.filter(subject_id=subject_id)
        if level:
            pq_qs = pq_qs.filter(level=level)
            quiz_qs = quiz_qs.filter(level=level)
            
        pq_exam_bodies = set(pq_qs.values_list('exam_body', flat=True).distinct())
        quiz_exam_bodies = set(quiz_qs.values_list('exam_body', flat=True).distinct())
        
        pq_years = set(pq_qs.values_list('year', flat=True).distinct())
        quiz_years = set(quiz_qs.values_list('year', flat=True).distinct())
        
        all_exam_bodies = sorted([e for e in (pq_exam_bodies | quiz_exam_bodies) if e])
        all_years = sorted([y for y in (pq_years | quiz_years) if y], reverse=True)
        
        return Response({
            'exam_bodies': all_exam_bodies,
            'years': all_years
        })


class PastQuestionStartView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        subject_id = request.data.get('subject_id')
        level = request.data.get('level')
        exam_body = request.data.get('exam_body')
        year = request.data.get('year')
        
        subject = get_object_or_404(Subject, id=subject_id)
        
        # Check both PastQuestion and Quiz tables
        pq_questions = PastQuestion.objects.filter(
            subject=subject, level=level, exam_body=exam_body, year=year, is_active=True
        )
        quiz_questions = Quiz.objects.filter(
            subject=subject, level=level, exam_body=exam_body, year=year,
            is_active=True, is_past_question=True
        )
        
        total_count = pq_questions.count() + quiz_questions.count()
        
        if total_count == 0:
            return Response({'error': 'No past questions found for these filters.'}, status=status.HTTP_400_BAD_REQUEST)
            
        session = PastQuestionSession.objects.create(
            student=request.user,
            subject=subject,
            level=level,
            exam_body=exam_body,
            year=year,
            total_questions=total_count
        )
        
        # Combine questions from both sources into a unified format
        all_questions = []
        all_questions.extend(PastQuestionSerializer(pq_questions, many=True).data)
        all_questions.extend(QuizSerializer(quiz_questions, many=True).data)
        
        # Shuffle past questions so they don't always appear in the same order
        random.shuffle(all_questions)
        
        return Response({
            'session': PastQuestionSessionSerializer(session).data,
            'questions': all_questions
        }, status=status.HTTP_201_CREATED)

class PastQuestionSubmitView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        session = get_object_or_404(PastQuestionSession, pk=pk, student=request.user)
        if session.status != 'in_progress':
            return Response({'error': 'Session is already completed.'}, status=status.HTTP_400_BAD_REQUEST)
            
        serializer = PastAnswerSubmissionSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        
        for ans_data in serializer.validated_data:
            q_id = ans_data['question_id']
            sel_ans = ans_data.get('selected_answer', '')
            time_spent = ans_data.get('time_spent_seconds', 0)
            
            question = PastQuestion.objects.filter(id=q_id).first()
            quiz_question = None
            if not question:
                # AI-uploaded past questions are stored in the Quiz table
                quiz_question = Quiz.objects.filter(id=q_id, is_past_question=True).first()
            
            source_question = question or quiz_question
            if source_question:
                is_correct = False
                if sel_ans and source_question.correct_answer:
                    correct_answer_text = source_question.correct_answer
                    
                    # If incorrect_answers is a dict (AI-generated questions),
                    # correct_answer is a label like "A" and the dict maps labels to texts.
                    inc = source_question.incorrect_answers
                    if isinstance(inc, dict) and correct_answer_text in inc:
                        correct_answer_text = inc[correct_answer_text]
                    
                    if sel_ans.strip().lower() == correct_answer_text.strip().lower():
                        is_correct = True
                
                if question:
                    PastQuestionAnswer.objects.update_or_create(
                        session=session,
                        question=question,
                        defaults={
                            'selected_answer': sel_ans,
                            'is_correct': is_correct,
                            'time_spent_seconds': time_spent
                        }
                    )
        
        return Response({'status': 'success'})

class PastQuestionCompleteView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        session = get_object_or_404(PastQuestionSession, pk=pk, student=request.user)
        if session.status != 'in_progress':
            return Response({'error': 'Session is already completed.'}, status=status.HTTP_400_BAD_REQUEST)
            
        correct = session.answers.filter(is_correct=True).count()
        session.correct_answers = correct
        if session.total_questions > 0:
            session.score_percentage = (correct / session.total_questions) * 100
        
        session.status = 'completed'
        session.completed_at = timezone.now()
        session.save()
        
        return Response(PastQuestionSessionSerializer(session).data)

class PastQuestionReviewView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        session = get_object_or_404(PastQuestionSession, pk=pk, student=request.user)
        # Ensure session is completed
        # if session.status != 'completed':
        #     return Response({'error': 'Session is not completed.'}, status=status.HTTP_400_BAD_REQUEST)
        
        answers = session.answers.select_related('question').order_by('id')
        from .serializers import PastQuestionAnswerReviewSerializer
        return Response(PastQuestionAnswerReviewSerializer(answers, many=True).data)

# ---------------------------------------------------------
# BATCH UPLOAD API (CSV)
# ---------------------------------------------------------
from rest_framework.parsers import MultiPartParser, FormParser
from tablib import Dataset
from .resources import QuizResource, PastQuestionResource

class BaseBatchUploadView(views.APIView):
    permission_classes = [IsAuthenticated] 
    parser_classes = [MultiPartParser, FormParser]
    resource_class = None

    def post(self, request, *args, **kwargs):
        if 'file' not in request.FILES:
            return Response({'error': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['file']
        if not file.name.endswith('.csv'):
            return Response({'error': 'Please upload a valid CSV file.'}, status=status.HTTP_400_BAD_REQUEST)

        dataset = Dataset()
        try:
            # Read CSV data
            file_data = file.read().decode('utf-8')
            dataset.load(file_data, format='csv')
            
            # Import data using the resource
            resource = self.resource_class()
            result = resource.import_data(dataset, dry_run=False)
            
            if result.has_errors():
                errors = []
                for row_errors in result.row_errors():
                    for error in row_errors[1]:
                        errors.append(f"Row {row_errors[0]}: {str(error.error)}")
                return Response({'error': 'Import failed with errors', 'details': errors}, status=status.HTTP_400_BAD_REQUEST)
                
            return Response({'message': f'Successfully imported {result.total_rows} questions.'}, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': f'Failed to process file: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class QuizBatchUploadView(BaseBatchUploadView):
    resource_class = QuizResource

class PastQuestionBatchUploadView(BaseBatchUploadView):
    resource_class = PastQuestionResource

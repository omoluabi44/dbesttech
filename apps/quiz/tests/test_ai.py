"""
Tests for the AI service layer (Agent 1: Quiz Generation, Agent 2: Past Question Extraction).

Uses mocking to avoid real Gemini API calls during testing.
"""

from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth import get_user_model

from apps.quiz.models import Subject, Topic, Question, Option, PastQuestionUpload
from apps.quiz.services import QuizGeneratorService
from apps.quiz.ai.prompts import build_quiz_prompt, build_extraction_prompt
from apps.quiz.ai.gemini_client import GeminiQuizClient

User = get_user_model()


# --- Sample Data ---

VALID_AI_RESPONSE = [
    {
        "question_text": "What is 2 + 3?",
        "explanation": "Adding 2 and 3 gives 5.",
        "options": [
            {"label": "A", "text": "3", "is_correct": False},
            {"label": "B", "text": "4", "is_correct": False},
            {"label": "C", "text": "5", "is_correct": True},
            {"label": "D", "text": "6", "is_correct": False},
        ]
    },
    {
        "question_text": "What is the value of 10 - 4?",
        "explanation": "Subtracting 4 from 10 gives 6.",
        "options": [
            {"label": "A", "text": "5", "is_correct": False},
            {"label": "B", "text": "6", "is_correct": True},
            {"label": "C", "text": "7", "is_correct": False},
            {"label": "D", "text": "8", "is_correct": False},
        ]
    },
]

MALFORMED_AI_RESPONSE = [
    {
        "question_text": "Missing options question",
        "explanation": "This has no options",
    },
    {
        "question_text": "Wrong option count",
        "explanation": "Has 3 options instead of 4",
        "options": [
            {"label": "A", "text": "One", "is_correct": False},
            {"label": "B", "text": "Two", "is_correct": True},
            {"label": "C", "text": "Three", "is_correct": False},
        ]
    },
    {
        "question_text": "No correct answer",
        "explanation": "None marked correct",
        "options": [
            {"label": "A", "text": "One", "is_correct": False},
            {"label": "B", "text": "Two", "is_correct": False},
            {"label": "C", "text": "Three", "is_correct": False},
            {"label": "D", "text": "Four", "is_correct": False},
        ]
    },
    {
        "question_text": "Two correct answers",
        "explanation": "Two options marked correct",
        "options": [
            {"label": "A", "text": "One", "is_correct": True},
            {"label": "B", "text": "Two", "is_correct": True},
            {"label": "C", "text": "Three", "is_correct": False},
            {"label": "D", "text": "Four", "is_correct": False},
        ]
    },
]


class TestPromptBuilding(TestCase):
    """Test that prompt templates are constructed correctly."""

    def test_quiz_prompt_includes_subject(self):
        prompt = build_quiz_prompt("Mathematics", None, "primary_1", "easy", 10)
        self.assertIn("Mathematics", prompt)

    def test_quiz_prompt_includes_topic_when_provided(self):
        prompt = build_quiz_prompt("Mathematics", "Algebra", "jss_1", "medium", 5)
        self.assertIn("Algebra", prompt)

    def test_quiz_prompt_includes_mixed_when_no_topic(self):
        prompt = build_quiz_prompt("Mathematics", None, "jss_1", "medium", 5)
        self.assertIn("Mixed", prompt)

    def test_quiz_prompt_includes_num_questions(self):
        prompt = build_quiz_prompt("Mathematics", None, "ss_1", "hard", 25)
        self.assertIn("25", prompt)

    def test_quiz_prompt_includes_difficulty(self):
        prompt = build_quiz_prompt("Mathematics", None, "primary_3", "easy", 10)
        self.assertIn("easy", prompt)
        self.assertIn("straightforward", prompt.lower())

    def test_extraction_prompt_includes_exam_body(self):
        prompt = build_extraction_prompt("WAEC", 2023, "Mathematics", "ss_3")
        self.assertIn("WAEC", prompt)
        self.assertIn("2023", prompt)
        self.assertIn("Mathematics", prompt)

    def test_extraction_prompt_includes_level(self):
        prompt = build_extraction_prompt("NECO", 2022, "English", "jss_3")
        self.assertIn("NECO", prompt)


class TestQuestionValidation(TestCase):
    """Test the Gemini client's question validation logic."""

    def setUp(self):
        """Set up a client instance with mocked API key."""
        with patch.dict('os.environ', {'GEMINI_API_KEY': 'test-key'}):
            with patch('apps.quiz.ai.gemini_client.genai'):
                self.client = GeminiQuizClient.__new__(GeminiQuizClient)

    def test_valid_questions_pass_validation(self):
        result = self.client._validate_questions(VALID_AI_RESPONSE)
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]['question_text'], "What is 2 + 3?")
        self.assertEqual(len(result[0]['options']), 4)

    def test_malformed_questions_rejected(self):
        result = self.client._validate_questions(MALFORMED_AI_RESPONSE)
        self.assertEqual(len(result), 0)

    def test_mixed_valid_and_invalid(self):
        mixed = VALID_AI_RESPONSE + MALFORMED_AI_RESPONSE
        result = self.client._validate_questions(mixed)
        self.assertEqual(len(result), 2)

    def test_empty_question_text_rejected(self):
        bad = [{"question_text": "", "explanation": "test", "options": VALID_AI_RESPONSE[0]['options']}]
        result = self.client._validate_questions(bad)
        self.assertEqual(len(result), 0)

    def test_empty_explanation_gets_default(self):
        q = {
            "question_text": "Some question?",
            "explanation": "",
            "options": VALID_AI_RESPONSE[0]['options'],
        }
        result = self.client._validate_questions([q])
        self.assertEqual(len(result), 1)
        self.assertIn("correct answer", result[0]['explanation'])

    def test_labels_normalized_to_uppercase(self):
        q = {
            "question_text": "Test?",
            "explanation": "Explanation",
            "options": [
                {"label": "a", "text": "One", "is_correct": False},
                {"label": "b", "text": "Two", "is_correct": True},
                {"label": "c", "text": "Three", "is_correct": False},
                {"label": "d", "text": "Four", "is_correct": False},
            ]
        }
        result = self.client._validate_questions([q])
        self.assertEqual(len(result), 1)
        labels = {opt['label'] for opt in result[0]['options']}
        self.assertEqual(labels, {'A', 'B', 'C', 'D'})


class TestQuizGeneratorServiceAIFallback(TestCase):
    """Test that QuizGeneratorService properly falls back to AI generation."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='student@test.com',
            username='student',
            password='testpass123',
        )
        self.subject = Subject.objects.create(
            name='Mathematics',
            slug='mathematics',
            applicable_levels=['primary_1', 'primary_2', 'primary_3'],
        )
        self.topic = Topic.objects.create(
            subject=self.subject,
            name='Addition',
            level='primary_1',
        )

    @patch('apps.quiz.services.QuizGeneratorService._generate_and_save_questions')
    def test_ai_called_when_db_has_no_questions(self, mock_generate):
        """When DB is empty for non-graduating level, AI should be called."""
        mock_generate.return_value = Question.objects.none()

        questions = QuizGeneratorService.select_questions(
            subject=self.subject,
            level='primary_1',
            difficulty='easy',
            num_questions=5,
        )

        mock_generate.assert_called_once()
        call_kwargs = mock_generate.call_args
        self.assertEqual(call_kwargs[1]['count'], 5)

    @patch('apps.quiz.services.QuizGeneratorService._generate_and_save_questions')
    def test_ai_called_with_correct_deficit(self, mock_generate):
        """AI should be asked to generate only the deficit amount."""
        # Create 3 existing questions
        for i in range(3):
            q = Question.objects.create(
                subject=self.subject, level='primary_1', difficulty='easy',
                source='manual', question_text=f'Manual question {i}?',
            )
            for label in ['A', 'B', 'C', 'D']:
                Option.objects.create(
                    question=q, label=label, text=f'Option {label}',
                    is_correct=(label == 'A'),
                )

        mock_generate.return_value = Question.objects.none()

        QuizGeneratorService.select_questions(
            subject=self.subject,
            level='primary_1',
            difficulty='easy',
            num_questions=10,
        )

        # Should request 7 more (10 - 3 existing)
        mock_generate.assert_called_once()
        self.assertEqual(mock_generate.call_args[1]['count'], 7)

    @patch('apps.quiz.services.QuizGeneratorService._generate_and_save_questions')
    def test_ai_not_called_when_db_has_enough(self, mock_generate):
        """When DB has enough questions, AI should NOT be called."""
        for i in range(10):
            q = Question.objects.create(
                subject=self.subject, level='primary_1', difficulty='easy',
                source='manual', question_text=f'Question {i}?',
            )
            for label in ['A', 'B', 'C', 'D']:
                Option.objects.create(
                    question=q, label=label, text=f'Opt {label}',
                    is_correct=(label == 'A'),
                )

        QuizGeneratorService.select_questions(
            subject=self.subject,
            level='primary_1',
            difficulty='easy',
            num_questions=5,
        )

        mock_generate.assert_not_called()

    @patch('apps.quiz.services.QuizGeneratorService._generate_and_save_questions')
    def test_ai_not_called_for_graduating_level(self, mock_generate):
        """AI should NEVER be called for graduating levels (past questions only)."""
        QuizGeneratorService.select_questions(
            subject=self.subject,
            level='primary_6',  # Graduating level
            difficulty='medium',
            num_questions=10,
        )

        mock_generate.assert_not_called()

    @patch('apps.quiz.services.QuizGeneratorService._generate_and_save_questions')
    def test_ai_not_called_for_jss3(self, mock_generate):
        """AI should NOT be called for JSS 3 (graduating level)."""
        QuizGeneratorService.select_questions(
            subject=self.subject,
            level='jss_3',
            difficulty='hard',
            num_questions=10,
        )

        mock_generate.assert_not_called()


class TestAIQuestionPersistence(TestCase):
    """Test that AI-generated questions are properly saved to the DB."""

    def setUp(self):
        self.subject = Subject.objects.create(
            name='English',
            slug='english',
            applicable_levels=['primary_1'],
        )

    @patch('apps.quiz.ai.gemini_client.genai')
    def test_generate_and_save_creates_db_records(self, mock_genai):
        """Verify _generate_and_save_questions creates Question + Option records."""
        # Mock the Gemini response
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = str(VALID_AI_RESPONSE).replace("'", '"').replace('True', 'true').replace('False', 'false')
        mock_model.generate_content.return_value = mock_response
        mock_genai.GenerativeModel.return_value = mock_model

        import json
        mock_response.text = json.dumps(VALID_AI_RESPONSE)

        with patch.dict('os.environ', {'GEMINI_API_KEY': 'test-key'}):
            new_qs = QuizGeneratorService._generate_and_save_questions(
                subject=self.subject,
                topic=None,
                level='primary_1',
                difficulty='easy',
                count=2,
            )

        # Check questions were created
        self.assertEqual(new_qs.count(), 2)

        # Check source is ai_generated
        for q in new_qs:
            self.assertEqual(q.source, 'ai_generated')
            self.assertEqual(q.options.count(), 4)
            self.assertEqual(q.options.filter(is_correct=True).count(), 1)


class TestPastQuestionUploadModel(TestCase):
    """Test the PastQuestionUpload model."""

    def setUp(self):
        self.subject = Subject.objects.create(
            name='Mathematics',
            slug='mathematics',
        )
        self.user = User.objects.create_user(
            email='admin@test.com',
            username='admin',
            password='testpass123',
            role='admin',
        )

    def test_upload_creation(self):
        upload = PastQuestionUpload.objects.create(
            subject=self.subject,
            level='ss_3',
            exam_body='WAEC',
            year=2023,
            file='test.pdf',
            uploaded_by=self.user,
        )
        self.assertEqual(upload.status, 'pending')
        self.assertEqual(upload.questions_extracted, 0)
        self.assertIn('WAEC', str(upload))

    def test_upload_status_choices(self):
        upload = PastQuestionUpload.objects.create(
            subject=self.subject,
            level='ss_3',
            exam_body='NECO',
            year=2022,
            file='test.pdf',
        )
        upload.status = 'completed'
        upload.questions_extracted = 45
        upload.save()
        upload.refresh_from_db()
        self.assertEqual(upload.status, 'completed')
        self.assertEqual(upload.questions_extracted, 45)

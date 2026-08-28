from rest_framework.test import APITestCase, APIClient
from django.urls import reverse
from apps.accounts.models import User, StudentProfile
from .models import Subject, Topic, Question, Option, QuizSession, StudentAnswer


class QuizTestBase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='student@test.com',
            username='student',
            password='password123',
            role='student'
        )
        self.profile = self.user.student_profile
        self.profile.level = 'jss_1'
        self.profile.save()
        self.user.refresh_from_db()
        
        self.client.force_authenticate(user=self.user)
        
        self.subject = Subject.objects.create(name='Mathematics', slug='mathematics')
        self.topic = Topic.objects.create(subject=self.subject, name='Algebra', level='jss_1')
        
        self.q1 = Question.objects.create(
            subject=self.subject,
            topic=self.topic,
            level='jss_1',
            difficulty='medium',
            question_text='What is 2x = 4?',
            source='manual'
        )
        self.opt_q1_1 = Option.objects.create(question=self.q1, label='A', text='1', is_correct=False)
        self.opt_q1_2 = Option.objects.create(question=self.q1, label='B', text='2', is_correct=True)


class TestSubjectAPI(QuizTestBase):
    def test_list_subjects(self):
        url = reverse('quiz:subject-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Mathematics')


class TestQuizSessionAPI(QuizTestBase):
    def test_start_quiz(self):
        url = reverse('quiz:start-quiz')
        data = {
            'subject_id': self.subject.id,
            'difficulty': 'medium',
            'num_questions': 5
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertIn('session', response.data)
        self.assertEqual(response.data['session']['status'], 'in_progress')
        
    def test_submit_answer(self):
        # Start a quiz
        session = QuizSession.objects.create(
            student=self.user,
            subject=self.subject,
            level='jss_1',
            difficulty='medium',
            quiz_type='auto_generated',
            total_questions=1
        )
        
        url = reverse('quiz:submit-answer', kwargs={'pk': session.id})
        data = {
            'question_id': self.q1.id,
            'selected_option_id': self.opt_q1_2.id,
            'time_spent_seconds': 10
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['is_correct'])
        
    def test_complete_quiz(self):
        session = QuizSession.objects.create(
            student=self.user,
            subject=self.subject,
            level='jss_1',
            difficulty='medium',
            quiz_type='auto_generated',
            total_questions=1
        )
        StudentAnswer.objects.create(
            quiz_session=session,
            question=self.q1,
            selected_option=self.opt_q1_2,
            is_correct=True
        )
        
        url = reverse('quiz:complete-quiz', kwargs={'pk': session.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['session']['status'], 'completed')
        self.assertEqual(response.data['session']['score_percentage'], '100.00')

from rest_framework.test import APITestCase, APIClient
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from apps.accounts.models import User, StudentProfile
from apps.quiz.models import Subject, Topic, Question, Option, QuizSession, StudentAnswer
from .models import PerformanceSummary, WeeklyProgress, StrengthWeakness


class PerformanceTestBase(APITestCase):
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
        
        self.subject = Subject.objects.create(name='Mathematics', slug='mathematics')
        self.topic = Topic.objects.create(subject=self.subject, name='Algebra', level='jss_1')
        
        self.client.force_authenticate(user=self.user)

    def create_completed_session(self, score_percentage=80, num_questions=10, correct_answers=8):
        session = QuizSession.objects.create(
            student=self.user,
            subject=self.subject,
            level='jss_1',
            difficulty='medium',
            quiz_type='auto_generated',
            total_questions=num_questions,
            correct_answers=correct_answers,
            score_percentage=score_percentage,
            status='completed',
            completed_at=timezone.now()
        )
        return session


class TestPerformanceSummaryModel(PerformanceTestBase):
    def test_creation(self):
        summary = PerformanceSummary.objects.create(
            student=self.user,
            subject=self.subject,
            level='jss_1',
            average_score=85.5
        )
        self.assertEqual(summary.average_score, 85.5)
        self.assertEqual(str(summary), f"student@test.com - Mathematics (JSS 1)")


class TestWeeklyProgressModel(PerformanceTestBase):
    def test_creation(self):
        week_start = timezone.now().date()
        progress = WeeklyProgress.objects.create(
            student=self.user,
            week_start=week_start,
            average_score=90.0
        )
        self.assertEqual(progress.average_score, 90.0)


class TestStrengthWeaknessModel(PerformanceTestBase):
    def test_creation(self):
        sw = StrengthWeakness.objects.create(
            student=self.user,
            topic=self.topic,
            mastery_percentage=75.0
        )
        self.assertEqual(sw.mastery_percentage, 75.0)


class TestOverallPerformanceAPI(PerformanceTestBase):
    def test_get_overall_performance_empty(self):
        url = reverse('performance:overall-summary')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total_quizzes'], 0)

    def test_get_overall_performance_with_data(self):
        PerformanceSummary.objects.create(
            student=self.user,
            subject=self.subject,
            level='jss_1',
            total_quizzes_taken=2,
            total_questions_attempted=20,
            total_correct_answers=15,
            average_score=75.0
        )
        url = reverse('performance:overall-summary')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total_quizzes'], 2)
        self.assertEqual(response.data['overall_accuracy'], 75.0)


class TestSubjectPerformanceAPI(PerformanceTestBase):
    def test_get_subject_performance(self):
        PerformanceSummary.objects.create(
            student=self.user,
            subject=self.subject,
            level='jss_1',
            average_score=80.0
        )
        url = reverse('performance:by-subject')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['subject_name'], 'Mathematics')


class TestWeeklyProgressAPI(PerformanceTestBase):
    def test_get_weekly_progress(self):
        week_start = timezone.now().date()
        WeeklyProgress.objects.create(
            student=self.user,
            week_start=week_start,
            average_score=85.0
        )
        url = reverse('performance:weekly-progress')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)


class TestStrengthWeaknessAPI(PerformanceTestBase):
    def test_get_strengths(self):
        StrengthWeakness.objects.create(
            student=self.user,
            topic=self.topic,
            mastery_percentage=90.0
        )
        url = reverse('performance:strengths')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['topic_name'], 'Algebra')
        self.assertEqual(response.data['results'][0]['status'], 'strong')

    def test_filter_strengths(self):
        StrengthWeakness.objects.create(
            student=self.user,
            topic=self.topic,
            mastery_percentage=40.0
        )
        url = reverse('performance:strengths')
        response = self.client.get(f"{url}?status=weak")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)
        
        response = self.client.get(f"{url}?status=strong")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 0)

from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token

from .models import User, StudentProfile
from utils.constants import GRADUATING_LEVELS, LEVEL_TO_CATEGORY


# ---------------------------------------------------------------------------
# Model Tests
# ---------------------------------------------------------------------------

class TestUserModel(TestCase):
    """Tests for the custom User model."""

    def test_create_user_with_email(self):
        """Test creating a user with email as the primary identifier."""
        user = User.objects.create_user(
            email='student@example.com',
            username='student1',
            password='TestPass123!',
        )
        self.assertEqual(user.email, 'student@example.com')
        self.assertEqual(user.username, 'student1')
        self.assertTrue(user.check_password('TestPass123!'))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)

    def test_email_uniqueness(self):
        """Test that duplicate emails are rejected."""
        User.objects.create_user(
            email='unique@example.com',
            username='user1',
            password='TestPass123!',
        )
        with self.assertRaises(Exception):
            User.objects.create_user(
                email='unique@example.com',
                username='user2',
                password='TestPass123!',
            )

    def test_role_default_is_student(self):
        """Test that the default role is 'student'."""
        user = User.objects.create_user(
            email='default@example.com',
            username='defaultuser',
            password='TestPass123!',
        )
        self.assertEqual(user.role, 'student')

    def test_is_student_property(self):
        """Test the is_student property returns True for students."""
        user = User.objects.create_user(
            email='s@example.com',
            username='s1',
            password='TestPass123!',
            role='student',
        )
        self.assertTrue(user.is_student)
        self.assertFalse(user.is_teacher)

    def test_is_teacher_property(self):
        """Test the is_teacher property returns True for teachers."""
        user = User.objects.create_user(
            email='t@example.com',
            username='t1',
            password='TestPass123!',
            role='teacher',
        )
        self.assertTrue(user.is_teacher)
        self.assertFalse(user.is_student)

    def test_str_returns_email(self):
        """Test string representation returns email."""
        user = User.objects.create_user(
            email='str@example.com',
            username='struser',
            password='TestPass123!',
        )
        self.assertEqual(str(user), 'str@example.com')


class TestStudentProfile(TestCase):
    """Tests for the StudentProfile model."""

    def setUp(self):
        self.user = User.objects.create_user(
            email='profile@example.com',
            username='profileuser',
            password='TestPass123!',
            role='student',
        )

    def test_auto_school_category_from_level(self):
        """Test that school_category is auto-set from the level field."""
        for level, expected_category in LEVEL_TO_CATEGORY.items():
            profile, _ = StudentProfile.objects.get_or_create(user=self.user)
            profile.level = level
            profile.save()
            profile.refresh_from_db()
            self.assertEqual(
                profile.school_category,
                expected_category,
                f"Level '{level}' should map to category '{expected_category}', "
                f"got '{profile.school_category}'",
            )

    def test_auto_is_graduating(self):
        """Test that is_graduating is auto-set based on level."""
        profile, _ = StudentProfile.objects.get_or_create(user=self.user)

        for level in GRADUATING_LEVELS:
            profile.level = level
            profile.save()
            profile.refresh_from_db()
            self.assertTrue(
                profile.is_graduating,
                f"Level '{level}' should be graduating",
            )

    def test_non_graduating_level(self):
        """Test that non-graduating levels have is_graduating=False."""
        profile, _ = StudentProfile.objects.get_or_create(user=self.user)
        profile.level = 'primary_1'
        profile.save()
        profile.refresh_from_db()
        if 'primary_1' not in GRADUATING_LEVELS:
            self.assertFalse(profile.is_graduating)

    def test_str_representation(self):
        """Test the string representation of StudentProfile."""
        profile, _ = StudentProfile.objects.get_or_create(user=self.user)
        profile.level = 'primary_1'
        profile.save()
        self.assertIn(self.user.email, str(profile))


# ---------------------------------------------------------------------------
# API Tests
# ---------------------------------------------------------------------------

@override_settings(
    AUTH_PASSWORD_VALIDATORS=[],  # Disable password validators for test convenience
)
class TestRegistrationAPI(APITestCase):
    """Tests for the registration endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('accounts:register')
        self.valid_data = {
            'email': 'newuser@example.com',
            'username': 'newuser',
            'first_name': 'New',
            'last_name': 'User',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
            'level': 'primary_1',
            'school_name': 'Test School',
        }

    def test_successful_registration(self):
        """Test that a valid registration creates a user and returns a token."""
        response = self.client.post(self.url, self.valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'newuser@example.com')
        self.assertEqual(response.data['user']['role'], 'student')

        # Verify user and profile exist in DB
        user = User.objects.get(email='newuser@example.com')
        self.assertTrue(user.check_password('StrongPass123!'))
        self.assertTrue(
            StudentProfile.objects.filter(user=user).exists(),
            'StudentProfile should be created on registration',
        )

    def test_duplicate_email_rejected(self):
        """Test that registering with an existing email fails."""
        User.objects.create_user(
            email='existing@example.com',
            username='existing',
            password='TestPass123!',
        )
        data = self.valid_data.copy()
        data['email'] = 'existing@example.com'
        data['username'] = 'different'
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_mismatch(self):
        """Test that mismatched passwords are rejected."""
        data = self.valid_data.copy()
        data['password_confirm'] = 'DifferentPass456!'
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_required_fields(self):
        """Test that missing required fields are rejected."""
        for field in ['email', 'username', 'password', 'password_confirm', 'level']:
            data = self.valid_data.copy()
            del data[field]
            response = self.client.post(self.url, data, format='json')
            self.assertEqual(
                response.status_code,
                status.HTTP_400_BAD_REQUEST,
                f"Missing '{field}' should cause a 400 error",
            )


@override_settings(
    AUTH_PASSWORD_VALIDATORS=[],
)
class TestLoginAPI(APITestCase):
    """Tests for the login endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('accounts:login')
        self.user = User.objects.create_user(
            email='login@example.com',
            username='loginuser',
            password='TestPass123!',
            role='student',
        )

    def test_successful_login(self):
        """Test login with valid credentials returns a token."""
        response = self.client.post(self.url, {
            'email': 'login@example.com',
            'password': 'TestPass123!',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'login@example.com')

    def test_wrong_password(self):
        """Test login with wrong password is rejected."""
        response = self.client.post(self.url, {
            'email': 'login@example.com',
            'password': 'WrongPass!',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_nonexistent_user(self):
        """Test login with non-existent email is rejected."""
        response = self.client.post(self.url, {
            'email': 'nobody@example.com',
            'password': 'TestPass123!',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_inactive_user(self):
        """Test login with an inactive user account is rejected."""
        self.user.is_active = False
        self.user.save()
        response = self.client.post(self.url, {
            'email': 'login@example.com',
            'password': 'TestPass123!',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TestProfileAPI(APITestCase):
    """Tests for the profile endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='profile@example.com',
            username='profileuser',
            password='TestPass123!',
            role='student',
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    def test_get_profile(self):
        """Test authenticated user can retrieve their profile."""
        url = reverse('accounts:profile')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'profile@example.com')
        self.assertEqual(response.data['role'], 'student')

    def test_update_profile(self):
        """Test authenticated user can update their profile."""
        url = reverse('accounts:profile')
        response = self.client.patch(url, {
            'first_name': 'Updated',
            'last_name': 'Name',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Updated')
        self.assertEqual(self.user.last_name, 'Name')

    def test_unauthenticated_profile_access(self):
        """Test that unauthenticated access to profile is denied."""
        self.client.credentials()  # Remove auth
        url = reverse('accounts:profile')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_student_profile(self):
        """Test retrieving the student profile."""
        url = reverse('accounts:student-profile')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('level', response.data)
        self.assertIn('school_category', response.data)

    def test_update_student_profile(self):
        """Test updating student profile fields."""
        url = reverse('accounts:student-profile')
        response = self.client.patch(url, {
            'school_name': 'New School',
            'level': 'primary_3',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        profile = StudentProfile.objects.get(user=self.user)
        self.assertEqual(profile.school_name, 'New School')
        self.assertEqual(profile.level, 'primary_3')


@override_settings(
    AUTH_PASSWORD_VALIDATORS=[],
)
class TestChangePasswordAPI(APITestCase):
    """Tests for the change password endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='changepw@example.com',
            username='changepw',
            password='OldPass123!',
            role='student',
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.url = reverse('accounts:change-password')

    def test_successful_password_change(self):
        """Test changing password with valid data."""
        response = self.client.post(self.url, {
            'old_password': 'OldPass123!',
            'new_password': 'NewPass456!',
            'new_password_confirm': 'NewPass456!',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

        # Verify old token is invalidated and new one works
        self.assertNotEqual(response.data['token'], self.token.key)

        # Verify new password works
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewPass456!'))

    def test_wrong_old_password(self):
        """Test that providing the wrong old password is rejected."""
        response = self.client.post(self.url, {
            'old_password': 'WrongOldPass!',
            'new_password': 'NewPass456!',
            'new_password_confirm': 'NewPass456!',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_new_password_mismatch(self):
        """Test that mismatched new passwords are rejected."""
        response = self.client.post(self.url, {
            'old_password': 'OldPass123!',
            'new_password': 'NewPass456!',
            'new_password_confirm': 'DifferentPass!',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated_change_password(self):
        """Test that unauthenticated users cannot change passwords."""
        self.client.credentials()  # Remove auth
        url = reverse('accounts:change-password')
        data = {
            'old_password': 'password123',
            'new_password': 'newpassword123',
            'new_password_confirm': 'newpassword123'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TestLogoutAPI(APITestCase):
    """Tests for the logout endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='logout@example.com',
            username='logoutuser',
            password='TestPass123!',
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.url = reverse('accounts:logout')

    def test_successful_logout(self):
        """Test that logout deletes the token."""
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Token.objects.filter(user=self.user).exists())

    def test_unauthenticated_logout(self):
        """Test that unauthenticated logout is rejected."""
        url = reverse('accounts:logout')
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

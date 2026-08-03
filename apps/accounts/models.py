from django.contrib.auth.models import AbstractUser
from django.db import models
from utils.constants import ROLE_CHOICES, SCHOOL_CATEGORIES, SCHOOL_LEVELS, GRADUATING_LEVELS, LEVEL_TO_CATEGORY

class School(models.Model):
    """Model representing a school."""
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True, default='')
    contact_email = models.EmailField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'School'
        verbose_name_plural = 'Schools'
    
    def __str__(self):
        return self.name
from utils.constants import ROLE_CHOICES, SCHOOL_CATEGORIES, SCHOOL_LEVELS, GRADUATING_LEVELS, LEVEL_TO_CATEGORY


class User(AbstractUser):
    """Extended user model with role field."""
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email

    @property
    def is_student(self):
        return self.role == 'student'

    @property
    def is_teacher(self):
        return self.role == 'teacher'

    @property
    def is_root_admin(self):
        return self.role == 'root_admin'

    @property
    def is_school_admin(self):
        return self.role == 'school_admin'

    SUBSCRIPTION_CHOICES = [('free', 'Free'), ('basic', 'Basic'), ('premium', 'Premium')]
    subscription_plan = models.CharField(max_length=10, choices=SUBSCRIPTION_CHOICES, default='free')
    
    SUBSCRIPTION_STATUS_CHOICES = [('active', 'Active'), ('expired', 'Expired'), ('cancelled', 'Cancelled')]
    subscription_status = models.CharField(max_length=20, choices=SUBSCRIPTION_STATUS_CHOICES, default='active')
    subscription_start_date = models.DateTimeField(null=True, blank=True)
    subscription_end_date = models.DateTimeField(null=True, blank=True)
    quizzes_taken_today = models.IntegerField(default=0)
    last_quiz_date = models.DateField(null=True, blank=True)

    @property
    def daily_quiz_limit(self):
        return {'free': 5, 'basic': 20, 'premium': 999}.get(self.subscription_plan, 5)


class SchoolAdminProfile(models.Model):
    """Admin profile for school administrators."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='school_admin_profile')
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='admins')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'School Admin Profile'
        verbose_name_plural = 'School Admin Profiles'
    
    def __str__(self):
        return f"{self.user.email} - {self.school.name}"


class StudentProfile(models.Model):
    """Student-specific profile linked to User."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    school_category = models.CharField(max_length=20, choices=SCHOOL_CATEGORIES, default='primary')
    level = models.CharField(max_length=20, choices=SCHOOL_LEVELS, default='primary_1')
    is_graduating = models.BooleanField(default=False)
    date_of_birth = models.DateField(null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Student Profile'
        verbose_name_plural = 'Student Profiles'

    def __str__(self):
        return f"{self.user.email} - {self.get_level_display()}"

    def save(self, *args, **kwargs):
        # Auto-set school_category from level
        self.school_category = LEVEL_TO_CATEGORY.get(self.level, 'primary')
        # Auto-set is_graduating from level
        self.is_graduating = self.level in GRADUATING_LEVELS
        super().save(*args, **kwargs)


class PaymentTransaction(models.Model):
    """Immutable audit log of payment transactions via Flutterwave."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('successful', 'Successful'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payment_transactions')
    tx_ref = models.CharField(max_length=100, unique=True, db_index=True)
    flw_transaction_id = models.CharField(max_length=100, blank=True, default='')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='NGN')
    plan = models.CharField(max_length=10)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_type = models.CharField(max_length=50, blank=True, default='')
    verified_at = models.DateTimeField(null=True, blank=True)
    flw_response = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Payment Transaction'
        verbose_name_plural = 'Payment Transactions'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.tx_ref} - {self.status} - ₦{self.amount}"

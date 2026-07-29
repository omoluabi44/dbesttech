from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, StudentProfile


@receiver(post_save, sender=User)
def create_student_profile(sender, instance, created, **kwargs):
    """Auto-create student profile when a student user is created."""
    if created and instance.role == 'student':
        StudentProfile.objects.get_or_create(user=instance)

"""
Celery tasks for the config app.
"""
from celery import shared_task
from django.core.mail import send_mail as django_send_mail


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_email_task(self, subject, body, from_email, recipient_list, html_message=None):
    """
    Send an email asynchronously via Celery.
    Retries up to 3 times with 60s delay on failure.
    """
    try:
        django_send_mail(
            subject=subject,
            message=body,
            from_email=from_email,
            recipient_list=recipient_list,
            html_message=html_message,
            fail_silently=False,
        )
    except Exception as exc:
        raise self.retry(exc=exc)

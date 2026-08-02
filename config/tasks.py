"""
Celery tasks for the config app.
"""
from celery import shared_task


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_email_task(self, subject, body, from_email, recipient_list, html_message=None):
    """
    Send an email asynchronously via Celery.
    Uses the SMTP backend DIRECTLY to avoid the circular loop
    with the CeleryEmailBackend.
    Retries up to 3 times with 60s delay on failure.
    """
    from django.core.mail import EmailMultiAlternatives
    from django.core.mail.backends.smtp import EmailBackend as SMTPBackend
    from django.conf import settings

    try:
        # Create a direct SMTP connection instead of going through EMAIL_BACKEND
        connection = SMTPBackend(
            host=settings.EMAIL_HOST,
            port=settings.EMAIL_PORT,
            username=settings.EMAIL_HOST_USER,
            password=settings.EMAIL_HOST_PASSWORD,
            use_tls=settings.EMAIL_USE_TLS,
            use_ssl=settings.EMAIL_USE_SSL,
        )

        msg = EmailMultiAlternatives(
            subject=subject,
            body=body,
            from_email=from_email,
            to=recipient_list,
            connection=connection,
        )

        if html_message:
            msg.attach_alternative(html_message, 'text/html')

        msg.send(fail_silently=False)

    except Exception as exc:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Celery email task failed: {exc}")
        raise self.retry(exc=exc)

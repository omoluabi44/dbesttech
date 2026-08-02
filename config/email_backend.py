"""
Celery email backend that sends emails asynchronously via Celery tasks.
"""
from django.core.mail.backends.base import BaseEmailBackend
from .tasks import send_email_task


class CeleryEmailBackend(BaseEmailBackend):
    """
    Email backend that queues all emails as Celery tasks.
    Emails are sent via SMTP in the Celery worker process,
    not in the Django request/response cycle.
    """

    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        count = 0
        for message in email_messages:
            try:
                send_email_task.delay(
                    subject=message.subject,
                    body=message.body,
                    from_email=message.from_email,
                    recipient_list=list(message.to),
                    html_message=self._get_html_body(message),
                )
                count += 1
            except Exception:
                if not self.fail_silently:
                    raise
        return count

    def _get_html_body(self, message):
        """Extract HTML alternative from the email message if present."""
        if hasattr(message, 'alternatives'):
            for content, mimetype in message.alternatives:
                if mimetype == 'text/html':
                    return content
        return None

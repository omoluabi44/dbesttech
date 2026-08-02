"""
Threaded email backend that sends emails in a background thread
so the HTTP response is not blocked by slow SMTP connections.
"""
import threading
from django.core.mail.backends.smtp import EmailBackend as SMTPBackend


class ThreadedEmailBackend(SMTPBackend):
    """
    A wrapper around Django's default SMTP email backend that sends
    each email in a separate thread, preventing slow SMTP servers
    (like Zoho) from blocking the API response.
    """

    def send_messages(self, email_messages):
        """
        Send one or more EmailMessage objects in a background thread
        and return the number of email messages (optimistically).
        """
        if not email_messages:
            return 0

        thread = threading.Thread(
            target=self._send_in_background,
            args=(email_messages,),
            daemon=True,
        )
        thread.start()

        # Return immediately — assume all messages will be sent
        return len(email_messages)

    def _send_in_background(self, email_messages):
        """Actually send the emails using the parent SMTP backend."""
        try:
            super().send_messages(email_messages)
        except Exception as e:
            # Log the error but don't crash the thread
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Background email sending failed: {e}")

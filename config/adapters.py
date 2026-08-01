from allauth.account.adapter import DefaultAccountAdapter
from django.conf import settings

class CustomAccountAdapter(DefaultAccountAdapter):
    def get_email_confirmation_url(self, request, emailconfirmation):
        """
        Constructs the email confirmation URL that points to our Next.js frontend
        instead of the Django backend.
        """
        # The frontend route that will handle the verification
        frontend_url = "https://dbestquiz.com/verify-email"
        
        # We append the key to the URL query string
        url = f"{frontend_url}?key={emailconfirmation.key}"
        return url

    def send_mail(self, template_prefix, email, context):
        try:
            super().send_mail(template_prefix, email, context)
        except Exception as e:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({
                "detail": f"Registration failed: The server could not send the verification email. Please check your SMTP/Zoho credentials. Internal error: {str(e)}"
            })

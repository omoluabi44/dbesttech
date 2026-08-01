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

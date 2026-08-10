"""
Root URL configuration for the Quiz Platform project.

Routes API endpoints to their respective app URL modules and
serves media files during development.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/quiz/', include('apps.quiz.urls')),
    path('api/performance/', include('apps.performance.urls')),
    path('accounts/', include('allauth.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

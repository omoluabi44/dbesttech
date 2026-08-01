from django.urls import path
from . import views

app_name = 'performance'

urlpatterns = [
    path('summary/', views.OverallPerformanceView.as_view(), name='summary'),
    path('by-subject/', views.SubjectPerformanceView.as_view(), name='by_subject'),
    path('weekly/', views.WeeklyProgressView.as_view(), name='weekly'),
    path('strengths/', views.StrengthWeaknessView.as_view(), name='strengths'),
]

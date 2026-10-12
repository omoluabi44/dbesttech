from django.urls import path
from . import views

app_name = 'performance'

urlpatterns = [
    path('summary/', views.OverallPerformanceView.as_view(), name='summary'),
    path('by-subject/', views.SubjectPerformanceView.as_view(), name='by_subject'),
    path('weekly/', views.WeeklyProgressView.as_view(), name='weekly'),
    path('strengths/', views.StrengthWeaknessView.as_view(), name='strengths'),
    path('leaderboard/', views.LeaderboardView.as_view(), name='leaderboard'),
    path('admin/student-results/', views.AdminStudentResultsView.as_view(), name='admin-student-results'),
    path('admin/student-performance/', views.AdminStudentPerformanceView.as_view(), name='admin-student-performance'),
    path('admin/leaderboard/', views.AdminLeaderboardView.as_view(), name='admin-leaderboard'),
]

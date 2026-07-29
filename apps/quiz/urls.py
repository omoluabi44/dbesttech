from django.urls import path
from . import views

app_name = 'quiz'

urlpatterns = [
    # General Endpoints
    path('subjects/', views.SubjectListView.as_view(), name='subject-list'),
    path('subjects/<int:subject_id>/topics/', views.TopicListView.as_view(), name='topic-list'),
    
    # Practice Endpoints
    path('practice/start/', views.PracticeStartView.as_view(), name='practice-start'),
    path('practice/sessions/<int:pk>/submit-stage/', views.PracticeSubmitStageView.as_view(), name='practice-submit-stage'),
    path('practice/sessions/<int:pk>/results/', views.PracticeResultsView.as_view(), name='practice-results'),
    path('practice/sessions/<int:pk>/retry/', views.PracticeRetryView.as_view(), name='practice-retry'),
    
    # Past Question Endpoints
    path('past-questions/filters/', views.PastQuestionFiltersView.as_view(), name='past-question-filters'),
    path('past-questions/start/', views.PastQuestionStartView.as_view(), name='past-question-start'),
    path('past-questions/sessions/<int:pk>/submit/', views.PastQuestionSubmitView.as_view(), name='past-question-submit'),
    path('past-questions/sessions/<int:pk>/complete/', views.PastQuestionCompleteView.as_view(), name='past-question-complete'),
    path('past-questions/sessions/<int:pk>/review/', views.PastQuestionReviewView.as_view(), name='past-question-review'),
]

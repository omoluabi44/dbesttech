from django.urls import path
from . import views
from . import admin_views

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
    
    # AI Quiz Generation & Extraction Endpoints
    path('admin/ai/upload/', admin_views.AIUploadPastQuestionView.as_view(), name='ai-upload-past-question'),
    path('admin/ai/upload/<int:pk>/status/', admin_views.AIUploadStatusView.as_view(), name='ai-upload-status'),
    path('admin/ai/generate/', admin_views.AIGenerateQuizView.as_view(), name='ai-generate-quiz'),
    path('admin/ai/bulk-save/', admin_views.AIBulkSaveQuizView.as_view(), name='ai-bulk-save-quiz'),
    
    # Admin Question Bank Data Grid
    path('admin/questions/', admin_views.QuizListAdminView.as_view(), name='admin-quiz-list'),
    path('admin/questions/<str:pk>/', admin_views.QuizDetailAdminView.as_view(), name='admin-quiz-detail'),

    # Admin Batch Upload
    path('admin/quizzes/import/', views.QuizBatchUploadView.as_view(), name='quiz-batch-import'),
    path('admin/past-questions/import/', views.PastQuestionBatchUploadView.as_view(), name='past-question-batch-import'),
]

from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Avg, Max, Min

from .models import PerformanceSummary, WeeklyProgress, StrengthWeakness
from .serializers import (
    PerformanceSummarySerializer,
    WeeklyProgressSerializer,
    StrengthWeaknessSerializer,
    OverallPerformanceSerializer,
)


class OverallPerformanceView(APIView):
    """Get overall performance summary across all subjects."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        summaries = PerformanceSummary.objects.filter(student=request.user)
        
        if not summaries.exists():
            return Response({
                'total_quizzes': 0,
                'total_questions': 0,
                'total_correct': 0,
                'overall_accuracy': 0,
                'overall_average_score': 0,
                'total_time_spent_seconds': 0,
                'subjects_count': 0,
                'strongest_subject': None,
                'weakest_subject': None,
            })
        
        aggregates = summaries.aggregate(
            total_quizzes=Sum('total_quizzes_taken'),
            total_questions=Sum('total_questions_attempted'),
            total_correct=Sum('total_correct_answers'),
            avg_score=Avg('average_score'),
            total_time=Sum('total_time_spent_seconds'),
        )
        
        # Find strongest and weakest subjects
        strongest = summaries.order_by('-average_score').first()
        weakest = summaries.order_by('average_score').first()
        
        total_q = aggregates['total_questions'] or 0
        total_c = aggregates['total_correct'] or 0
        
        data = {
            'total_quizzes': aggregates['total_quizzes'] or 0,
            'total_questions': total_q,
            'total_correct': total_c,
            'overall_accuracy': round(total_c / total_q * 100, 2) if total_q > 0 else 0,
            'overall_average_score': float(aggregates['avg_score'] or 0),
            'total_time_spent_seconds': aggregates['total_time'] or 0,
            'subjects_count': summaries.count(),
            'strongest_subject': strongest.subject.name if strongest else None,
            'weakest_subject': weakest.subject.name if weakest else None,
        }
        
        serializer = OverallPerformanceSerializer(data)
        return Response(serializer.data)


class SubjectPerformanceView(generics.ListAPIView):
    """Get performance broken down by subject."""
    serializer_class = PerformanceSummarySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return PerformanceSummary.objects.filter(
            student=self.request.user
        ).select_related('subject').order_by('-average_score')


class WeeklyProgressView(generics.ListAPIView):
    """Get weekly progress trend."""
    serializer_class = WeeklyProgressSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = WeeklyProgress.objects.filter(student=self.request.user)
        
        # Optional: limit number of weeks
        weeks = self.request.query_params.get('weeks')
        if weeks:
            try:
                queryset = queryset[:int(weeks)]
            except (ValueError, TypeError):
                pass
        
        return queryset


class StrengthWeaknessView(generics.ListAPIView):
    """Get topic-level strengths and weaknesses."""
    serializer_class = StrengthWeaknessSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = StrengthWeakness.objects.filter(
            student=self.request.user
        ).select_related('topic', 'topic__subject')
        
        # Optional filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter == 'strong':
            queryset = queryset.filter(mastery_percentage__gte=80)
        elif status_filter == 'weak':
            queryset = queryset.filter(mastery_percentage__lt=50)
        elif status_filter == 'average':
            queryset = queryset.filter(
                mastery_percentage__gte=50,
                mastery_percentage__lt=80,
            )
            
        subject_id = self.request.query_params.get('subject_id')
        if subject_id:
            queryset = queryset.filter(topic__subject_id=subject_id)
        
        return queryset

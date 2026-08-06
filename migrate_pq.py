import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
django.setup()

from apps.quiz.models import Quiz, PastQuestion

def migrate():
    quizzes = Quiz.objects.filter(is_past_question=True)
    count = 0
    for q in quizzes:
        if not PastQuestion.objects.filter(subject=q.subject, questionText=q.questionText, year=q.year, exam_body=q.exam_body).exists():
            PastQuestion.objects.create(
                subject=q.subject,
                topic_obj=q.topic_obj,
                level=q.level,
                difficulty=q.difficulty,
                exam_body=q.exam_body,
                year=q.year,
                questionText=q.questionText,
                questionType=q.questionType,
                correct_answer=q.correct_answer,
                incorrect_answers=q.incorrect_answers,
                explanation=q.explanation,
                modelAnswer=q.modelAnswer,
                markingGuide=q.markingGuide,
                is_active=q.is_active,
            )
            count += 1
        q.delete()
    print(f"Migrated {count} questions to PastQuestion table.")

if __name__ == '__main__':
    migrate()

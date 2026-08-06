import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
django.setup()

from apps.quiz.models import Quiz, PastQuestion

def fix_questions():
    print("Fixing PastQuestions...")
    count = 0
    for q in PastQuestion.objects.all():
        if isinstance(q.incorrect_answers, dict):
            correct_label = q.correct_answer
            options_dict = q.incorrect_answers
            
            # Find the actual text for the correct answer
            correct_text = options_dict.get(correct_label)
            if not correct_text and correct_label in ["A", "B", "C", "D"]:
                correct_text = options_dict.get(correct_label, "Unknown")
            elif not correct_text:
                # If correct_answer was already the text for some reason
                correct_text = correct_label
                
            incorrect_list = [v for k, v in options_dict.items() if k != correct_label]
            
            if len(incorrect_list) > 0 and correct_text:
                q.correct_answer = correct_text
                q.incorrect_answers = incorrect_list
                q.save()
                count += 1
    print(f"Fixed {count} PastQuestions.")

    print("Fixing Quizzes...")
    quiz_count = 0
    for q in Quiz.objects.filter(is_past_question=True):
        if isinstance(q.incorrect_answers, dict):
            correct_label = q.correct_answer
            options_dict = q.incorrect_answers
            
            correct_text = options_dict.get(correct_label)
            if not correct_text and correct_label in ["A", "B", "C", "D"]:
                correct_text = options_dict.get(correct_label, "Unknown")
            elif not correct_text:
                correct_text = correct_label
                
            incorrect_list = [v for k, v in options_dict.items() if k != correct_label]
            
            if len(incorrect_list) > 0 and correct_text:
                q.correct_answer = correct_text
                q.incorrect_answers = incorrect_list
                q.save()
                quiz_count += 1
    print(f"Fixed {quiz_count} Quizzes.")

if __name__ == '__main__':
    fix_questions()

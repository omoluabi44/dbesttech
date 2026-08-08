from apps.quiz.models import Quiz
print(f"Total quizzes: {Quiz.objects.count()}")
print(f"Easy quizzes: {Quiz.objects.filter(difficulty='easy').count()}")
print(f"Medium quizzes: {Quiz.objects.filter(difficulty='medium').count()}")
print(f"Hard quizzes: {Quiz.objects.filter(difficulty='hard').count()}")

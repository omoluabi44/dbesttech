import os
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.quiz.models import Subject, Topic, Quiz
from utils.constants import SCHOOL_LEVELS, GRADUATING_LEVELS

def seed_ss3_practice():
    print("Seeding SS3 Practice Questions...")
    subject = Subject.objects.get(slug="english-language")
    
    for level in GRADUATING_LEVELS:
        topic, _ = Topic.objects.get_or_create(
            subject=subject,
            level=level,
            name=f"Comprehension Basics {level} Practice"
        )
        
        for difficulty in ['easy', 'medium', 'hard']:
            count = 0
            for i in range(1, 51):
                _, created = Quiz.objects.get_or_create(
                    subject=subject, topic_obj=topic, level=level, difficulty=difficulty,
                    is_practice=True, is_past_question=False,
                    questionText=f"Practice {difficulty} Q{i} for {level}: What is a synonym for Happy?",
                    defaults={
                        "explanation": "Joyful is the correct synonym.",
                        "correct_answer": "Joyful",
                        "incorrect_answers": ["Sad", "Angry", "Tired"]
                    }
                )
                if created:
                    count += 1
            print(f"Created {count} {difficulty} practice questions for {level}.")

if __name__ == '__main__':
    seed_ss3_practice()

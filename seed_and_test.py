import json
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from apps.quiz.models import Subject, Topic, Quiz
from apps.accounts.models import StudentProfile
from django.test import Client
from utils.constants import SCHOOL_LEVELS, GRADUATING_LEVELS

User = get_user_model()

def seed_data():
    print("Seeding database...")
    subject, _ = Subject.objects.get_or_create(
        name="English Language",
        slug="english-language",
        defaults={
            "description": "General English Language",
            "applicable_levels": [level[0] for level in SCHOOL_LEVELS]
        }
    )
    
    levels = [level[0] for level in SCHOOL_LEVELS]
    
    for level in levels:
        topic, _ = Topic.objects.get_or_create(
            subject=subject,
            level=level,
            name=f"Comprehension Basics {level}"
        )
        
        if level not in GRADUATING_LEVELS:
            # Seed Practice Questions (50 questions) for each difficulty
            for difficulty in ['easy', 'medium', 'hard']:
                for i in range(1, 51):
                    Quiz.objects.get_or_create(
                        subject=subject, topic_obj=topic, level=level, difficulty=difficulty,
                        is_practice=True, is_past_question=False,
                        questionText=f"Practice {difficulty} Q{i} for {level}: What is a synonym for Happy?",
                        defaults={
                            "explanation": "Joyful is the correct synonym.",
                            "correct_answer": "Joyful",
                            "incorrect_answers": ["Sad", "Angry", "Tired"]
                        }
                    )
        else:
            # Seed Past Questions
            exam_body = 'waec' if level == 'ss_3' else ('bece' if level == 'jss_3' else 'federal_common_entrance')
            for year in [2022, 2023]:
                for i in range(1, 11):
                    Quiz.objects.get_or_create(
                        subject=subject, topic_obj=topic, level=level, exam_body=exam_body, year=str(year),
                        is_practice=False, is_past_question=True,
                        questionText=f"Past Q{i} for {level} ({exam_body} {year})",
                        defaults={
                            "explanation": "Check the marking guide.",
                            "correct_answer": "Correct",
                            "incorrect_answers": ["Wrong 1", "Wrong 2", "Wrong 3"]
                        }
                    )

    print("Database seeded successfully.")
    return subject

def setup_test_user():
    user, _ = User.objects.get_or_create(
        username="teststudent2",
        email="teststudent2@example.com",
        defaults={"role": "student"}
    )
    user.set_password("password123")
    user.save()
    
    profile, _ = StudentProfile.objects.get_or_create(user=user)
    profile.level = "primary_1"
    profile.save()
    
    token, _ = Token.objects.get_or_create(user=user)
    return user, token.key

def run_tests(token_key, subject):
    client = Client(HTTP_AUTHORIZATION=f'Token {token_key}', SERVER_NAME='localhost')
    print("\n--- Running API Tests ---")
    
    # 1. Practice Start
    print("Testing Practice Flow (Primary 1, Medium)...")
    start_resp = client.post('/api/quiz/practice/start/', data=json.dumps({
        "subject_id": subject.id,
        "level": "primary_1",
        "difficulty": "medium"
    }), content_type="application/json")
    
    if start_resp.status_code == 201:
        session = start_resp.json()['session']
        session_id = session['id']
        questions = start_resp.json()['questions']
        print(f"Started Practice Session {session_id}. Got {len(questions)} questions for Stage 1.")
        
        # Submit Stage 1
        answers = []
        for q in questions:
            answers.append({"question_id": q['id'], "selected_answer": "Joyful"}) # correct_answer is Joyful
            
        submit_resp = client.post(f'/api/quiz/practice/sessions/{session_id}/submit-stage/', data=json.dumps({
            "stage": 1,
            "answers": answers
        }), content_type="application/json")
        
        if submit_resp.status_code == 200:
            print(f"Stage 1 submitted successfully. Score: {submit_resp.json()['stage_score']}/10")
            print(f"Next stage questions: {len(submit_resp.json().get('next_questions', []))}")
        else:
            print("Stage submit failed:", submit_resp.json())
            
        # Get Results (Early)
        results_resp = client.get(f'/api/quiz/practice/sessions/{session_id}/results/')
        print("Early Results (Abandoned):", results_resp.json()['session']['score_percentage'], "%")
    else:
        print("Practice Start failed:", start_resp.json())

    # 2. Past Question Start
    print("\nTesting Past Question Flow (SS 3 WAEC 2022)...")
    profile = StudentProfile.objects.get(user__email="teststudent2@example.com")
    profile.level = 'ss_3'
    profile.save()
    
    filters_resp = client.get('/api/quiz/past-questions/filters/?level=ss_3')
    print("Available filters for SS 3:", filters_resp.json())
    
    start_resp = client.post('/api/quiz/past-questions/start/', data=json.dumps({
        "subject_id": subject.id,
        "level": "ss_3",
        "exam_body": "waec",
        "year": 2022
    }), content_type="application/json")
    
    if start_resp.status_code == 201:
        pq_session_id = start_resp.json()['session']['id']
        print(f"Started PQ Session {pq_session_id}.")
        
        # Complete it
        complete_resp = client.post(f'/api/quiz/past-questions/sessions/{pq_session_id}/complete/')
        print("PQ Completed. Final Score:", complete_resp.json()['score_percentage'])
    else:
        print("Past Question Start failed:", start_resp.json())

if __name__ == '__main__':
    subject = seed_data()
    user, token_key = setup_test_user()
    run_tests(token_key, subject)

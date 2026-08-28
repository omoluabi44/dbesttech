import os
import django
import random
from datetime import timedelta
from django.utils import timezone

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.quiz.models import Subject, Topic, Quiz, PastQuestion
from apps.performance.models import StrengthWeakness
from django.contrib.auth import get_user_model
from utils.constants import SCHOOL_LEVELS, LEVEL_TO_CATEGORY

User = get_user_model()

# Dictionary of real topics by subject and category
TOPIC_DATA = {
    'Mathematics': {
        'primary': ['Addition & Subtraction', 'Fractions & Decimals', 'Basic Geometry', 'Multiplication Tables', 'Time & Money'],
        'junior_secondary': ['Algebraic Processes', 'Basic Statistics', 'Geometry & Mensuration', 'Number Bases', 'Fractions, Decimals & Percentages'],
        'senior_secondary': ['Quadratic Equations', 'Trigonometry', 'Calculus', 'Probability & Statistics', 'Vectors & Mechanics']
    },
    'English Language': {
        'primary': ['Nouns & Pronouns', 'Verbs & Tenses', 'Reading Comprehension', 'Spelling & Vocabulary', 'Adjectives & Adverbs'],
        'junior_secondary': ['Lexis & Structure', 'Summary Writing', 'Oral English', 'Essay Writing', 'Phrases & Clauses'],
        'senior_secondary': ['Advanced Comprehension', 'Test of Orals', 'Lexis & Structure', 'Summary & Essay', 'Figures of Speech']
    },
    'Basic Science': {
        'primary': ['Living & Non-Living Things', 'The Human Body', 'Plants & Animals', 'Water & Air', 'Forces & Energy'],
        'junior_secondary': ['Matter & Energy', 'Ecosystems', 'Chemical Elements', 'Reproduction in Humans', 'Environmental Pollution']
    },
    'Biology': {
        'senior_secondary': ['Cell Biology', 'Genetics & Evolution', 'Ecology', 'Human Anatomy & Physiology', 'Plant Nutrition']
    },
    'Chemistry': {
        'senior_secondary': ['Atomic Structure', 'Chemical Bonding', 'Stoichiometry', 'Organic Chemistry', 'Acids, Bases & Salts']
    },
    'Physics': {
        'senior_secondary': ['Kinematics', 'Dynamics', 'Waves & Optics', 'Electricity & Magnetism', 'Modern Physics']
    },
    'default': {
        'primary': ['Basic Concepts', 'Introduction to Subject', 'Key Principles', 'Foundations', 'Practical Applications'],
        'junior_secondary': ['Intermediate Concepts', 'Theories & Models', 'Problem Solving', 'Analysis', 'Core Principles'],
        'senior_secondary': ['Advanced Topics', 'Complex Problem Solving', 'Theoretical Frameworks', 'Applied Subject', 'Mastery Level']
    }
}

def get_topics_for_subject(subject_name, level):
    category = LEVEL_TO_CATEGORY.get(level, 'primary')
    # Try exact match, then try partial match
    matched_subject = 'default'
    for known_subject in TOPIC_DATA.keys():
        if known_subject.lower() in subject_name.lower():
            matched_subject = known_subject
            break
            
    category_topics = TOPIC_DATA[matched_subject].get(category, TOPIC_DATA['default'][category])
    return category_topics

def run():
    print("Starting Topic and Performance Seeding...")
    subjects = Subject.objects.filter(is_active=True)
    levels = [level[0] for level in SCHOOL_LEVELS]
    
    total_topics_created = 0
    
    for subject in subjects:
        print(f"Processing Subject: {subject.name}")
        for level in levels:
            # Check if this subject applies to this level
            if subject.applicable_levels and level not in subject.applicable_levels:
                continue
                
            topic_names = get_topics_for_subject(subject.name, level)
            
            # Select 3 distinct topics randomly from the available ones
            selected_names = random.sample(topic_names, min(3, len(topic_names)))
            
            for name in selected_names:
                topic, created = Topic.objects.get_or_create(
                    subject=subject,
                    name=name,
                    level=level,
                    defaults={'description': f'Learn about {name} for {level}'}
                )
                if created:
                    total_topics_created += 1
    
    print(f"Created {total_topics_created} new topics.")
    
    # Assign existing questions to topics randomly if they don't have one
    print("Assigning topics to Quizzes...")
    quizzes = Quiz.objects.filter(topic_obj__isnull=True)
    quiz_updated = 0
    for q in quizzes:
        topics = Topic.objects.filter(subject=q.subject, level=q.level)
        if topics.exists():
            q.topic_obj = random.choice(topics)
            q.save()
            quiz_updated += 1
            
    print(f"Updated {quiz_updated} Quiz questions.")
    
    print("Assigning topics to Past Questions...")
    pqs = PastQuestion.objects.filter(topic_obj__isnull=True)
    pq_updated = 0
    for pq in pqs:
        topics = Topic.objects.filter(subject=pq.subject, level=pq.level)
        if topics.exists():
            pq.topic_obj = random.choice(topics)
            pq.save()
            pq_updated += 1
            
    print(f"Updated {pq_updated} Past Questions.")
    
    # Generate mock performance data for the first admin/user
    user = User.objects.first()
    if user:
        print(f"Generating mock Strength/Weakness data for user {user.email}")
        topics = list(Topic.objects.all())
        selected_topics = random.sample(topics, min(10, len(topics)))
        
        for topic in selected_topics:
            total = random.randint(10, 50)
            correct = random.randint(3, total)
            mastery = (correct / total) * 100
            
            StrengthWeakness.objects.update_or_create(
                student=user,
                topic=topic,
                defaults={
                    'total_attempts': total,
                    'correct_attempts': correct,
                    'mastery_percentage': mastery
                }
            )
        print("Mock performance data generated.")
    else:
        print("No user found to generate mock data.")
        
    print("Seeding Complete!")

if __name__ == '__main__':
    run()

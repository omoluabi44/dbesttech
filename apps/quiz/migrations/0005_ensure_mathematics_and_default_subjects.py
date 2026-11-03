from django.db import migrations
from django.db.models import Q

def ensure_core_subjects(apps, schema_editor):
    Subject = apps.get_model('quiz', 'Subject')
    Quiz = apps.get_model('quiz', 'Quiz')
    PastQuestion = apps.get_model('quiz', 'PastQuestion')
    Topic = apps.get_model('quiz', 'Topic')
    
    # 1. Mathematics
    math = Subject.objects.filter(Q(name__iexact='Mathematics') | Q(name__iexact='Math')).first()
    if not math:
        math = Subject.objects.create(
            name='Mathematics',
            slug='mathematics',
            description='Master numbers, arithmetic, algebra, geometry, and problem solving across all levels.',
            applicable_levels=[],
            is_active=True
        )
    elif not math.is_active:
        math.is_active = True
        math.save(update_fields=['is_active'])

    # 2. English Language
    english = Subject.objects.filter(Q(name__iexact='English') | Q(name__iexact='English Language')).first()
    if not english:
        english = Subject.objects.create(
            name='English Language',
            slug='english-language',
            description='Grammar, vocabulary, reading comprehension, and communication skills.',
            applicable_levels=[],
            is_active=True
        )
    elif not english.is_active:
        english.is_active = True
        english.save(update_fields=['is_active'])

    # 3. Re-link math topics
    Topic.objects.filter(
        Q(name__icontains='math') | 
        Q(name__icontains='algebra') | 
        Q(name__icontains='fraction') | 
        Q(name__icontains='geometry') |
        Q(name__icontains='addition') |
        Q(name__icontains='arithmetic')
    ).exclude(subject=math).update(subject=math)

    # 4. Re-link math quizzes (both by topic and by mathematical question text)
    Quiz.objects.filter(topic_obj__subject=math).exclude(subject=math).update(subject=math)

    Quiz.objects.filter(
        Q(questionText__icontains='math') |
        Q(questionText__icontains='algebra') |
        Q(questionText__icontains='calculate') |
        Q(questionText__icontains='fraction') |
        Q(questionText__icontains='triangle') |
        Q(questionText__icontains='equation') |
        Q(questionText__icontains='perimeter') |
        Q(questionText__icontains='rectangle') |
        Q(questionText__icontains='multiply') |
        Q(questionText__icontains='divide') |
        Q(questionText__icontains='sum of') |
        Q(questionText__icontains='difference between')
    ).exclude(subject=math).update(subject=math)

    PastQuestion.objects.filter(
        Q(question_text__icontains='calculate') |
        Q(question_text__icontains='algebra') |
        Q(question_text__icontains='equation') |
        Q(question_text__icontains='mathematics')
    ).exclude(subject=math).update(subject=math)

def reverse_code(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('quiz', '0004_pastquestion_image_url_and_more'),
    ]

    operations = [
        migrations.RunPython(ensure_core_subjects, reverse_code),
    ]

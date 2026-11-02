from django.db import migrations
from django.db.models import Q

def ensure_core_subjects(apps, schema_editor):
    Subject = apps.get_model('quiz', 'Subject')
    
    # Mathematics
    math = Subject.objects.filter(Q(name__iexact='Mathematics') | Q(name__iexact='Math')).first()
    if not math:
        Subject.objects.create(
            name='Mathematics',
            slug='mathematics',
            description='Master numbers, arithmetic, algebra, geometry, and problem solving across all levels.',
            applicable_levels=[],
            is_active=True
        )
    elif not math.is_active:
        math.is_active = True
        math.save(update_fields=['is_active'])

    # English Language
    english = Subject.objects.filter(Q(name__iexact='English') | Q(name__iexact='English Language')).first()
    if not english:
        Subject.objects.create(
            name='English Language',
            slug='english-language',
            description='Grammar, vocabulary, reading comprehension, and communication skills.',
            applicable_levels=[],
            is_active=True
        )
    elif not english.is_active:
        english.is_active = True
        english.save(update_fields=['is_active'])

def reverse_code(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('quiz', '0004_pastquestion_image_url_and_more'),
    ]

    operations = [
        migrations.RunPython(ensure_core_subjects, reverse_code),
    ]

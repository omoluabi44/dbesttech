import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.quiz.models import PracticeQuestion, PracticeOption

def seed_more_difficulties():
    easy_qs = PracticeQuestion.objects.filter(difficulty='easy')
    count = 0
    for diff in ['medium', 'hard']:
        for q in easy_qs:
            # We need to fetch options before we set pk to None
            options = list(q.options.all())
            q.pk = None
            q.difficulty = diff
            q.save()
            for opt in options:
                opt.pk = None
                opt.question = q
                opt.save()
            count += 1
    print(f"Created {count} new questions for medium and hard difficulties.")

if __name__ == '__main__':
    seed_more_difficulties()

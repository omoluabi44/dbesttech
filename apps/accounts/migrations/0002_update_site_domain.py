from django.db import migrations

def update_site_domain(apps, schema_editor):
    Site = apps.get_model('sites', 'Site')
    try:
        # Update the default Site object
        site = Site.objects.get(id=1)
        site.domain = 'dbestquiz.com'
        site.name = 'DBestQuiz'
        site.save()
    except Site.DoesNotExist:
        # Create it if it doesn't exist
        Site.objects.create(id=1, domain='dbestquiz.com', name='DBestQuiz')

def reverse_update_site_domain(apps, schema_editor):
    Site = apps.get_model('sites', 'Site')
    try:
        site = Site.objects.get(id=1)
        site.domain = 'example.com'
        site.name = 'example.com'
        site.save()
    except Site.DoesNotExist:
        pass

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('sites', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(update_site_domain, reverse_update_site_domain),
    ]

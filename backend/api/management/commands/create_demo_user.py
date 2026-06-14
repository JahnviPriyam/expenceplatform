from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Creates a demo admin user for development'

    def handle(self, *args, **options):
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@expense-nexus.local', 'admin')
            self.stdout.write(self.style.SUCCESS('Demo user created: admin / admin'))
        else:
            self.stdout.write('Demo user already exists.')

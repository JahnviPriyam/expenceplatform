from django.contrib import admin
from .models import Expense, Anomaly, ImportBatch, Participant, Settlement

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['description', 'amount', 'currency', 'date', 'payer', 'import_batch']
    list_filter = ['currency', 'is_settlement']
    search_fields = ['description', 'payer']

@admin.register(Anomaly)
class AnomalyAdmin(admin.ModelAdmin):
    list_display = ['expense', 'anomaly_type', 'severity', 'resolved']
    list_filter = ['severity', 'anomaly_type', 'resolved']

@admin.register(ImportBatch)
class ImportBatchAdmin(admin.ModelAdmin):
    list_display = ['filename', 'records_imported', 'integrity_score', 'grade', 'created_at']

admin.site.register(Participant)
admin.site.register(Settlement)

from django.db import models
from django.contrib.auth.models import User


class ImportBatch(models.Model):
    """Represents a single CSV upload session."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='import_batches')
    filename = models.CharField(max_length=255)
    total_records = models.IntegerField(default=0)
    records_imported = models.IntegerField(default=0)
    warnings = models.IntegerField(default=0)
    critical_issues = models.IntegerField(default=0)
    integrity_score = models.FloatField(default=100.0)
    grade = models.CharField(max_length=4, default='A')
    actions_taken = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.filename} ({self.created_at.date()})"


class Participant(models.Model):
    """A person involved in expense splitting."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='participants')
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, default='')
    total_owed = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Expense(models.Model):
    """A single expense record from a CSV import."""
    CURRENCY_CHOICES = [
        ('INR', 'Indian Rupee'),
        ('USD', 'US Dollar'),
        ('EUR', 'Euro'),
        ('GBP', 'British Pound'),
        ('JPY', 'Japanese Yen'),
        ('UNKNOWN', 'Unknown'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expenses')
    import_batch = models.ForeignKey(ImportBatch, on_delete=models.CASCADE, related_name='expenses', null=True)
    description = models.CharField(max_length=500)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, choices=CURRENCY_CHOICES, default='UNKNOWN')
    currency_inferred = models.BooleanField(default=False)
    date = models.DateField()
    category = models.CharField(max_length=100, blank=True, default='')
    payer = models.CharField(max_length=255, blank=True, default='')
    participants = models.JSONField(default=list)  # list of {name, share_amount, share_pct}
    split_type = models.CharField(max_length=50, default='equal')  # equal, percentage, exact
    notes = models.TextField(blank=True, default='')
    is_settlement = models.BooleanField(default=False)
    raw_row = models.JSONField(default=dict)  # original CSV row for reference
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.description} — {self.currency} {self.amount}"


class Anomaly(models.Model):
    """A detected data quality issue linked to an expense."""
    SEVERITY_CHOICES = [
        ('CRITICAL', 'Critical'),
        ('HIGH', 'High'),
        ('MEDIUM', 'Medium'),
        ('LOW', 'Low'),
    ]

    TYPE_CHOICES = [
        ('DUPLICATE_EXPENSE', 'Duplicate Expense'),
        ('MISSING_CURRENCY', 'Missing Currency'),
        ('MISSING_PAYER', 'Missing Payer'),
        ('INVALID_SPLIT', 'Invalid Split'),
        ('UNUSUAL_AMOUNT', 'Unusual Amount'),
        ('FUTURE_DATE', 'Future Date'),
        ('AMBIGUOUS_DATE', 'Ambiguous Date'),
        ('SINGLE_PARTICIPANT', 'Single Participant'),
        ('SETTLEMENT_MIXED', 'Settlement Mixed with Expenses'),
    ]

    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name='anomalies')
    import_batch = models.ForeignKey(ImportBatch, on_delete=models.CASCADE, related_name='anomalies', null=True)
    anomaly_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    description = models.TextField()
    ai_explanation = models.TextField(blank=True, default='')
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['severity', '-created_at']

    def __str__(self):
        return f"[{self.severity}] {self.anomaly_type} — {self.expense.description}"


class Settlement(models.Model):
    """A settlement transaction between participants."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='settlements')
    import_batch = models.ForeignKey(ImportBatch, on_delete=models.CASCADE, related_name='settlements', null=True)
    from_participant = models.CharField(max_length=255)
    to_participant = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    date = models.DateField()
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.from_participant} → {self.to_participant}: {self.currency} {self.amount}"

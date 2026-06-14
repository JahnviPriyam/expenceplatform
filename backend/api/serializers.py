from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Expense, Anomaly, ImportBatch, Participant, Settlement


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class ParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Participant
        fields = '__all__'
        read_only_fields = ['user', 'created_at']


class AnomalySerializer(serializers.ModelSerializer):
    expense_description = serializers.CharField(source='expense.description', read_only=True)
    expense_amount = serializers.DecimalField(source='expense.amount', max_digits=12, decimal_places=2, read_only=True)
    expense_currency = serializers.CharField(source='expense.currency', read_only=True)
    expense_date = serializers.DateField(source='expense.date', read_only=True)

    class Meta:
        model = Anomaly
        fields = '__all__'
        read_only_fields = ['created_at']


class ExpenseSerializer(serializers.ModelSerializer):
    anomalies = AnomalySerializer(many=True, read_only=True)
    anomaly_count = serializers.IntegerField(source='anomalies.count', read_only=True)

    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ['user', 'created_at']


class ImportBatchSerializer(serializers.ModelSerializer):
    anomaly_breakdown = serializers.SerializerMethodField()

    class Meta:
        model = ImportBatch
        fields = '__all__'
        read_only_fields = ['user', 'created_at']

    def get_anomaly_breakdown(self, obj):
        anomalies = obj.anomalies.all()
        return {
            'CRITICAL': anomalies.filter(severity='CRITICAL').count(),
            'HIGH': anomalies.filter(severity='HIGH').count(),
            'MEDIUM': anomalies.filter(severity='MEDIUM').count(),
            'LOW': anomalies.filter(severity='LOW').count(),
        }


class SettlementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Settlement
        fields = '__all__'
        read_only_fields = ['user', 'created_at']


class DashboardStatsSerializer(serializers.Serializer):
    total_expenses = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_anomalies = serializers.IntegerField()
    critical_anomalies = serializers.IntegerField()
    high_anomalies = serializers.IntegerField()
    medium_anomalies = serializers.IntegerField()
    low_anomalies = serializers.IntegerField()
    duplicate_count = serializers.IntegerField()
    missing_field_count = serializers.IntegerField()
    settlement_count = serializers.IntegerField()
    integrity_score = serializers.FloatField()
    grade = serializers.CharField()
    currency_distribution = serializers.DictField()
    top_categories = serializers.ListField()
    latest_import = ImportBatchSerializer(allow_null=True)

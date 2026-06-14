"""
API Views — Django REST Framework
"""
import io
from decimal import Decimal
from collections import Counter

from django.contrib.auth.models import User
from django.http import HttpResponse
from django.db.models import Sum, Count, Q
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser

from .models import Expense, Anomaly, ImportBatch, Participant, Settlement
from .serializers import (
    ExpenseSerializer, AnomalySerializer, ImportBatchSerializer,
    ParticipantSerializer, SettlementSerializer, UserSerializer, DashboardStatsSerializer
)
from services.csv_import import parse_csv
from services.anomaly_engine import detect_anomalies
from services.ai_explainer import explain_anomaly
from services.report_generator import build_report_data, render_pdf


# ─────────────────────────────────────────────────────────────────────────────
# Auth
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


# ─────────────────────────────────────────────────────────────────────────────
# CSV Import
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def import_csv(request):
    """
    POST /api/import/
    Accepts multipart/form-data with a 'file' field.
    Runs parse → anomaly detection → integrity scoring → DB write.
    """
    file_obj = request.FILES.get('file')
    if not file_obj:
        return Response({'error': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)
    if not file_obj.name.endswith('.csv'):
        return Response({'error': 'Only CSV files are accepted.'}, status=status.HTTP_400_BAD_REQUEST)

    content = file_obj.read()
    parsed = parse_csv(content)

    if 'error' in parsed:
        return Response({'error': parsed['error']}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

    expense_rows = parsed['expenses']
    settlement_rows = parsed.get('settlements', [])
    actions_taken = parsed.get('actions_taken', [])

    # Anomaly detection
    detection = detect_anomalies(expense_rows)
    anomaly_data = detection['anomalies']
    integrity_score = detection['integrity_score']
    grade = detection['grade']

    # Count severities for the batch record
    critical_count = sum(1 for a in anomaly_data if a['severity'] == 'CRITICAL')
    warning_count = sum(1 for a in anomaly_data if a['severity'] in ('HIGH', 'MEDIUM'))

    if critical_count:
        actions_taken.append(f"{critical_count} critical anomaly(s) flagged for review")

    # Create ImportBatch record
    batch = ImportBatch.objects.create(
        user=request.user,
        filename=file_obj.name,
        total_records=parsed['total_rows'],
        records_imported=len(expense_rows),
        warnings=warning_count,
        critical_issues=critical_count,
        integrity_score=integrity_score,
        grade=grade,
        actions_taken=actions_taken,
    )

    # Save expenses
    saved_expenses = []
    for row in expense_rows:
        exp = Expense.objects.create(
            user=request.user,
            import_batch=batch,
            description=row['description'],
            amount=Decimal(row['amount']),
            currency=row['currency'],
            currency_inferred=row.get('currency_inferred', False),
            date=row['date'] or '2000-01-01',
            category=row.get('category', ''),
            payer=row.get('payer', ''),
            participants=row.get('participants', []),
            split_type=row.get('split_type', 'equal'),
            notes=row.get('notes', ''),
            is_settlement=False,
            raw_row=row.get('raw_row', {}),
        )
        saved_expenses.append(exp)

    # Save settlements
    for row in settlement_rows:
        Settlement.objects.create(
            user=request.user,
            import_batch=batch,
            from_participant=row.get('payer', ''),
            to_participant='',
            amount=Decimal(row['amount']),
            currency=row['currency'],
            date=row['date'] or '2000-01-01',
            notes=row.get('notes', ''),
        )

    # Save anomalies
    anomaly_index = {i: exp for i, exp in enumerate(saved_expenses)}
    for a in anomaly_data:
        row_idx = a.get('row_index', 0)
        expense_obj = anomaly_index.get(row_idx, saved_expenses[0] if saved_expenses else None)
        if not expense_obj:
            continue
        Anomaly.objects.create(
            expense=expense_obj,
            import_batch=batch,
            anomaly_type=a['anomaly_type'],
            severity=a['severity'],
            description=a['description'],
        )

    return Response(ImportBatchSerializer(batch).data, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────────────────────────────────────
# Dashboard Stats
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    expenses = Expense.objects.filter(user=request.user, is_settlement=False)
    anomalies = Anomaly.objects.filter(expense__user=request.user)

    total_amount = expenses.aggregate(t=Sum('amount'))['t'] or Decimal('0')
    currency_dist = dict(Counter(expenses.values_list('currency', flat=True)))

    categories = list(
        expenses.values('category')
        .annotate(total=Sum('amount'), count=Count('id'))
        .order_by('-total')[:5]
    )

    latest_batch = ImportBatch.objects.filter(user=request.user).first()
    integrity_score = latest_batch.integrity_score if latest_batch else 100.0
    grade = latest_batch.grade if latest_batch else 'A'

    data = {
        'total_expenses': expenses.count(),
        'total_amount': total_amount,
        'total_anomalies': anomalies.count(),
        'critical_anomalies': anomalies.filter(severity='CRITICAL').count(),
        'high_anomalies': anomalies.filter(severity='HIGH').count(),
        'medium_anomalies': anomalies.filter(severity='MEDIUM').count(),
        'low_anomalies': anomalies.filter(severity='LOW').count(),
        'integrity_score': integrity_score,
        'grade': grade,
        'currency_distribution': currency_dist,
        'top_categories': categories,
        'latest_import': latest_batch,
    }
    return Response(DashboardStatsSerializer(data).data)


# ─────────────────────────────────────────────────────────────────────────────
# AI Explain
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_explain(request, anomaly_id):
    try:
        anomaly = Anomaly.objects.select_related('expense').get(
            id=anomaly_id, expense__user=request.user
        )
    except Anomaly.DoesNotExist:
        return Response({'error': 'Anomaly not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Build context window: 3 expenses before and after this one
    expense = anomaly.expense
    all_expenses = list(
        Expense.objects.filter(user=request.user, is_settlement=False)
        .order_by('date', 'id')
    )
    try:
        idx = next(i for i, e in enumerate(all_expenses) if e.id == expense.id)
        nearby = all_expenses[max(0, idx - 3): idx] + all_expenses[idx + 1: idx + 4]
    except StopIteration:
        nearby = []

    explanation = explain_anomaly(anomaly, nearby_expenses=nearby)

    # Cache on the anomaly record
    anomaly.ai_explanation = explanation
    anomaly.save(update_fields=['ai_explanation'])

    return Response({'anomaly_id': anomaly.id, 'explanation': explanation})


# ─────────────────────────────────────────────────────────────────────────────
# Standard ViewSets
# ─────────────────────────────────────────────────────────────────────────────

class ExpenseViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Expense.objects.filter(user=self.request.user, is_settlement=False).prefetch_related('anomalies')
        severity = self.request.query_params.get('anomaly_severity')
        if severity:
            qs = qs.filter(anomalies__severity=severity).distinct()
        return qs


class AnomalyViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AnomalySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Anomaly.objects.filter(expense__user=self.request.user).select_related('expense')
        severity = self.request.query_params.get('severity')
        if severity:
            qs = qs.filter(severity=severity.upper())
        anomaly_type = self.request.query_params.get('type')
        if anomaly_type:
            qs = qs.filter(anomaly_type=anomaly_type.upper())
        return qs


class ImportBatchViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ImportBatchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ImportBatch.objects.filter(user=self.request.user)

    @action(detail=True, methods=['get'], url_path='pdf')
    def download_pdf(self, request, pk=None):
        batch = self.get_object()
        report_data = build_report_data(batch)
        pdf_bytes = render_pdf(report_data)

        content_type = 'application/pdf' if pdf_bytes[:4] == b'%PDF' else 'text/plain'
        response = HttpResponse(pdf_bytes, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="report_{batch.id}.pdf"'
        return response

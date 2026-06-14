"""
Report Generator Service

Builds structured ImportReport data and renders PDF output.
"""
import io
from typing import Dict, Any
from django.db.models import Count

from django.template.loader import render_to_string


def build_report_data(import_batch) -> Dict[str, Any]:
    """Assemble the full report payload from an ImportBatch instance."""
    # Use DB-side aggregation for anomaly breakdown and top types
    breakdown_qs = import_batch.anomalies.values('severity').annotate(count=Count('id'))
    breakdown = {item['severity']: item['count'] for item in breakdown_qs}

    top_types_qs = import_batch.anomalies.values('anomaly_type').annotate(count=Count('id')).order_by('-count')
    top_types_sorted = [(item['anomaly_type'], item['count']) for item in top_types_qs]

    return {
        'batch': import_batch,
        'filename': import_batch.filename,
        'created_at': import_batch.created_at,
        'total_records': import_batch.total_records,
        'records_imported': import_batch.records_imported,
        'warnings': import_batch.warnings,
        'critical_issues': import_batch.critical_issues,
        'integrity_score': import_batch.integrity_score,
        'grade': import_batch.grade,
        'actions_taken': import_batch.actions_taken,
        'anomaly_breakdown': breakdown,
        'top_anomaly_types': top_types_sorted[:5],
        'total_anomalies': anomalies.count(),
    }


def render_pdf(report_data: Dict[str, Any]) -> bytes:
    """Render the import report as a PDF using WeasyPrint."""
    try:
        from weasyprint import HTML, CSS

        html_content = render_to_string('reports/import_report.html', report_data)
        css_content = CSS(string="""
            body { font-family: 'Arial', sans-serif; color: #1a1a2e; margin: 40px; }
            h1 { color: #0066ff; font-size: 28px; border-bottom: 2px solid #00f0ff; padding-bottom: 10px; }
            h2 { color: #0044cc; font-size: 18px; margin-top: 30px; }
            .score-block { background: #0a0a1a; color: #00f0ff; padding: 20px;
                           border-radius: 8px; text-align: center; margin: 20px 0; }
            .score { font-size: 48px; font-weight: bold; }
            .grade { font-size: 24px; color: #9d4edd; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #0066ff; color: white; padding: 10px; text-align: left; }
            td { padding: 8px 10px; border-bottom: 1px solid #e0e0e0; }
            .critical { color: #ff4444; font-weight: bold; }
            .high     { color: #ff8800; font-weight: bold; }
            .medium   { color: #9d4edd; }
            .low      { color: #00aaff; }
            .action-item { background: #f0f4ff; padding: 8px 12px; margin: 4px 0;
                           border-left: 3px solid #0066ff; border-radius: 2px; }
        """)
        pdf_bytes = HTML(string=html_content).write_pdf(stylesheets=[css_content])
        return pdf_bytes

    except ImportError:
        # Fallback: return a plain text representation if WeasyPrint not installed
        lines = [
            "EXPENSE NEXUS — IMPORT REPORT",
            "=" * 40,
            f"File: {report_data['filename']}",
            f"Records Imported: {report_data['records_imported']} / {report_data['total_records']}",
            f"Integrity Score: {report_data['integrity_score']} / 100  (Grade: {report_data['grade']})",
            f"Critical Issues: {report_data['critical_issues']}",
            f"Warnings: {report_data['warnings']}",
            "",
            "ANOMALY BREAKDOWN:",
            f"  CRITICAL : {report_data['anomaly_breakdown'].get('CRITICAL', 0)}",
            f"  HIGH     : {report_data['anomaly_breakdown'].get('HIGH', 0)}",
            f"  MEDIUM   : {report_data['anomaly_breakdown'].get('MEDIUM', 0)}",
            f"  LOW      : {report_data['anomaly_breakdown'].get('LOW', 0)}",
            "",
            "ACTIONS TAKEN:",
        ]
        for action in report_data.get('actions_taken', []):
            lines.append(f"  - {action}")
        return "\n".join(lines).encode('utf-8')

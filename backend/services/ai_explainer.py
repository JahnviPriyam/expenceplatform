"""
AI Explainer Service — Gemini Integration

Constructs structured, context-rich prompts for anomaly explanations.
The prompt includes the full transaction context window so Gemini can
produce actionable, specific explanations rather than generic responses.
"""
import google.generativeai as genai
from django.conf import settings


def _build_context_summary(nearby_expenses) -> str:
    """Build a human-readable context block from surrounding transactions."""
    if not nearby_expenses:
        return "No surrounding transactions available."
    lines = []
    for e in nearby_expenses[:5]:
        lines.append(
            f"  - {e.description} | {e.currency} {e.amount} | {e.date} | Payer: {e.payer or 'unknown'}"
        )
    return "\n".join(lines)


def explain_anomaly(anomaly, nearby_expenses=None) -> str:
    """
    Calls Gemini API with a structured expense auditing prompt.
    Returns the AI-generated explanation string.
    """
    if not settings.GEMINI_API_KEY:
        return (
            "AI explanations are not available. "
            "Please configure the GEMINI_API_KEY environment variable."
        )

    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')

    expense = anomaly.expense
    context_block = _build_context_summary(nearby_expenses or [])

    anomaly_type_labels = {
        'DUPLICATE_EXPENSE':  'Duplicate Expense',
        'MISSING_CURRENCY':   'Missing Currency',
        'MISSING_PAYER':      'Missing Payer',
        'INVALID_SPLIT':      'Invalid Expense Split',
        'UNUSUAL_AMOUNT':     'Unusually Large Amount',
        'FUTURE_DATE':        'Future-Dated Expense',
        'AMBIGUOUS_DATE':     'Ambiguous Date',
        'SINGLE_PARTICIPANT': 'Single Participant Expense',
        'SETTLEMENT_MIXED':   'Settlement Mixed with Expenses',
    }
    readable_type = anomaly_type_labels.get(anomaly.anomaly_type, anomaly.anomaly_type)

    prompt = f"""You are an AI expense auditor for enterprise financial software called Expense Nexus.

A data quality anomaly has been detected in an expense record. Analyse it and produce a clear, professional explanation for a finance team member.

ANOMALY DETAILS:
- Type: {readable_type}
- Severity: {anomaly.severity}
- System Detection Note: {anomaly.description}

FLAGGED TRANSACTION:
- Description: {expense.description}
- Amount: {expense.currency} {expense.amount}
- Date: {expense.date}
- Payer: {expense.payer or 'NOT PROVIDED'}
- Category: {expense.category or 'uncategorised'}
- Split Type: {expense.split_type}
- Participants: {expense.participants}
- Currency was inferred: {expense.currency_inferred}

SURROUNDING TRANSACTIONS (context window):
{context_block}

YOUR TASK:
Write a concise explanation (3–5 sentences) that:
1. States clearly WHY this was flagged
2. Identifies the most likely CAUSE based on the transaction data
3. Gives a specific, actionable RECOMMENDATION

Be specific — reference the actual amounts, dates, names, and currency codes from the data above. Do not be generic. Do not use markdown or bullet points in your response."""

    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"AI explanation unavailable: {str(e)}"

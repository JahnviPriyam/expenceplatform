"""
Anomaly Detection Engine

Rule-based detection with a defined integrity scoring formula.
Every rule maps directly to the assignment requirements.
"""
from decimal import Decimal
from datetime import date
from collections import defaultdict
from typing import List, Dict, Any


# ─────────────────────────────────────────────────────────────────────────────
# Integrity Score Penalty Table
# ─────────────────────────────────────────────────────────────────────────────
PENALTIES = {
    'DUPLICATE_EXPENSE':   {'points': 10, 'max': 30, 'severity': 'CRITICAL'},
    'MISSING_PAYER':       {'points': 15, 'max': 25, 'severity': 'HIGH'},
    'INVALID_SPLIT':       {'points': 20, 'max': 30, 'severity': 'HIGH'},
    'MISSING_CURRENCY':    {'points': 5,  'max': 20, 'severity': 'HIGH'},
    'AMBIGUOUS_DATE':      {'points': 10, 'max': 15, 'severity': 'MEDIUM'},
    'UNUSUAL_AMOUNT':      {'points': 3,  'max': 15, 'severity': 'MEDIUM'},
    'FUTURE_DATE':         {'points': 10, 'max': 10, 'severity': 'MEDIUM'},
    'SINGLE_PARTICIPANT':  {'points': 2,  'max': 10, 'severity': 'LOW'},
    'SETTLEMENT_MIXED':    {'points': 5,  'max': 10, 'severity': 'LOW'},
}

GRADE_TABLE = [
    (90, 'A'),
    (80, 'B+'),
    (70, 'B'),
    (60, 'C'),
    (50, 'D'),
    (0,  'F'),
]


def compute_grade(score: float) -> str:
    for threshold, grade in GRADE_TABLE:
        if score >= threshold:
            return grade
    return 'F'


def detect_anomalies(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Accepts a list of normalised expense dicts (post-CSV-parse).
    Returns detected anomalies + integrity score metadata.
    """
    anomalies = []
    penalty_totals: Dict[str, float] = defaultdict(float)

    # Build lookup structures
    seen_signatures = {}   # (amount, date, payer) → first row index
    amounts_by_category = defaultdict(list)

    for row in rows:
        cat = row.get('category', 'uncategorised').lower()
        try:
            amounts_by_category[cat].append(float(row.get('amount', 0)))
        except (ValueError, TypeError):
            pass

    category_averages = {
        cat: sum(vals) / len(vals)
        for cat, vals in amounts_by_category.items()
        if vals
    }

    for idx, row in enumerate(rows):
        row_anomalies = _check_row(idx, row, seen_signatures, category_averages)
        for a in row_anomalies:
            atype = a['anomaly_type']
            pen = PENALTIES[atype]
            cap = pen['max']
            current = penalty_totals[atype]
            deduct = min(pen['points'], cap - current)
            if deduct > 0:
                penalty_totals[atype] += deduct
            anomalies.append(a)

    total_penalty = sum(penalty_totals.values())
    integrity_score = max(0.0, round(100.0 - total_penalty, 1))
    grade = compute_grade(integrity_score)

    return {
        'anomalies': anomalies,
        'integrity_score': integrity_score,
        'grade': grade,
        'penalty_breakdown': dict(penalty_totals),
    }


def _check_row(idx, row, seen_signatures, category_averages):
    found = []
    desc = row.get('description', f'Row {idx + 1}')

    # ── DUPLICATE_EXPENSE ──────────────────────────────────────────────────
    currency_val = str(row.get('currency', '')).upper().strip()
    sig = (
        str(row.get('amount', '')),
        str(row.get('date', '')),
        str(row.get('payer', '')).lower().strip(),
        currency_val,
    )
    if sig in seen_signatures and sig[0] != '':
        found.append({
            'anomaly_type': 'DUPLICATE_EXPENSE',
            'severity': 'CRITICAL',
            'description': (
                f"'{desc}' appears to be a duplicate of row "
                f"{seen_signatures[sig] + 1}. Same amount ({row.get('currency', '')} "
                f"{row.get('amount', '')}), date ({row.get('date', '')}), "
                f"and payer ({row.get('payer', 'unknown')}). "
                f"Flag for manual review — high-confidence duplicates may still be false positives."
            ),
            'row_index': idx,
        })
    else:
        seen_signatures[sig] = idx

    # ── MISSING_CURRENCY ──────────────────────────────────────────────────
    currency = str(row.get('currency', '')).strip()
    is_inferred = row.get('currency_inferred', False)
    if not currency or currency.upper() in ('', 'UNKNOWN', 'N/A', 'NONE', 'NAN', 'NULL') or is_inferred:
        found.append({
            'anomaly_type': 'MISSING_CURRENCY',
            'severity': 'HIGH',
            'description': (
                f"'{desc}' has no currency value. "
                + (f"The system automatically inferred '{currency}' from surrounding transactions. " if is_inferred else "The system will attempt to infer the currency. ")
                + "Manual verification is recommended before processing."
            ),
            'row_index': idx,
        })

    # ── MISSING_PAYER ──────────────────────────────────────────────────────
    payer = str(row.get('payer', '')).strip()
    if not payer or payer.lower() in ('', 'unknown', 'n/a', 'none', 'nan', 'null'):
        found.append({
            'anomaly_type': 'MISSING_PAYER',
            'severity': 'HIGH',
            'description': (
                f"'{desc}' has no payer identified. "
                f"Settlement calculations will be inaccurate without a payer. "
                f"This record should be reviewed and assigned to the correct person."
            ),
            'row_index': idx,
        })

    # ── INVALID_SPLIT ──────────────────────────────────────────────────────
    participants = row.get('participants', [])
    if isinstance(participants, list) and len(participants) > 0:
        try:
            total_amount = float(row.get('amount', 0))
            split_type = str(row.get('split_type', 'equal')).lower()

            if split_type == 'percentage':
                total_pct = sum(float(p.get('share_pct') or 0) for p in participants)
                if abs(total_pct - 100.0) > 0.5:
                    over = round(total_pct - 100.0, 2)
                    over_amount = round((over / 100.0) * total_amount, 2)
                    found.append({
                        'anomaly_type': 'INVALID_SPLIT',
                        'severity': 'HIGH',
                        'description': (
                            f"'{desc}' uses percentage splits totalling {total_pct:.1f}%. "
                            f"Expected total is 100%. "
                            f"This {'over-allocates' if over > 0 else 'under-allocates'} "
                            f"{row.get('currency', '')} {abs(over_amount)} to participants."
                        ),
                        'row_index': idx,
                    })

            elif split_type == 'exact':
                total_shares = sum(float(p.get('share_amount') or 0) for p in participants)
                if abs(total_shares - total_amount) > 0.01:
                    diff = round(total_shares - total_amount, 2)
                    found.append({
                        'anomaly_type': 'INVALID_SPLIT',
                        'severity': 'HIGH',
                        'description': (
                            f"'{desc}' has exact splits summing to {row.get('currency', '')} {total_shares:.2f}, "
                            f"but the expense total is {row.get('currency', '')} {total_amount:.2f}. "
                            f"Discrepancy of {row.get('currency', '')} {abs(diff):.2f}."
                        ),
                        'row_index': idx,
                    })
        except (TypeError, ValueError):
            pass

    # ── UNUSUAL_AMOUNT ─────────────────────────────────────────────────────
    cat = str(row.get('category', 'uncategorised')).lower()
    try:
        amount = float(row.get('amount', 0))
        avg = category_averages.get(cat, 0)
        if avg > 0 and amount > avg * 3:
            found.append({
                'anomaly_type': 'UNUSUAL_AMOUNT',
                'severity': 'MEDIUM',
                'description': (
                    f"'{desc}' ({row.get('currency', '')} {amount:.2f}) is "
                    f"{amount / avg:.1f}× the average for category '{cat}' "
                    f"(avg: {row.get('currency', '')} {avg:.2f}). "
                    f"Verify this is not a data entry error."
                ),
                'row_index': idx,
            })
    except (TypeError, ValueError, ZeroDivisionError):
        pass

    # ── FUTURE_DATE ────────────────────────────────────────────────────────
    try:
        from datetime import datetime
        raw_date = row.get('date', '')
        if isinstance(raw_date, str):
            parsed = datetime.strptime(raw_date, '%Y-%m-%d').date()
        else:
            parsed = raw_date
        if parsed > date.today():
            found.append({
                'anomaly_type': 'FUTURE_DATE',
                'severity': 'MEDIUM',
                'description': (
                    f"'{desc}' is dated {parsed} which is in the future. "
                    f"This may be a pre-authorization, forecasted expense, or data entry error."
                ),
                'row_index': idx,
            })
    except (ValueError, TypeError):
        found.append({
            'anomaly_type': 'AMBIGUOUS_DATE',
            'severity': 'MEDIUM',
            'description': (
                f"'{desc}' has an ambiguous or unparseable date: '{row.get('date', '')}'. "
                f"The system could not determine whether this expense is past or future."
            ),
            'row_index': idx,
        })

    # ── SINGLE_PARTICIPANT ─────────────────────────────────────────────────
    participants = row.get('participants', [])
    if isinstance(participants, list) and len(participants) == 1:
        found.append({
            'anomaly_type': 'SINGLE_PARTICIPANT',
            'severity': 'LOW',
            'description': (
                f"'{desc}' has only one participant. "
                f"Most shared expenses involve multiple people. "
                f"Confirm this was not intended to be split."
            ),
            'row_index': idx,
        })

    return found

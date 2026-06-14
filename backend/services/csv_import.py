"""
CSV Import Service

Parses uploaded CSV files using Pandas, normalises fields,
infers missing values where possible, and separates settlements
from expense rows.
"""
import io
import re
from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Dict, List, Any, Tuple

import pandas as pd


# Known currency symbols → ISO code
CURRENCY_MAP = {
    '₹': 'INR', 'rs': 'INR', 'rs.': 'INR', 'inr': 'INR',
    '$': 'USD', 'usd': 'USD',
    '€': 'EUR', 'eur': 'EUR',
    '£': 'GBP', 'gbp': 'GBP',
    '¥': 'JPY', 'jpy': 'JPY',
}

def _clean_val(val) -> str:
    """Normalize NaN, None, and empty fields to empty string."""
    if pd.isna(val) or val is None:
        return ''
    s = str(val).strip()
    if s.lower() in ('nan', 'none', 'null', 'n/a'):
        return ''
    return s

# Column aliases the CSV might use
COLUMN_ALIASES = {
    'description': ['description', 'desc', 'name', 'expense', 'item', 'title', 'details'],
    'amount':      ['amount', 'cost', 'total', 'price', 'value', 'sum'],
    'currency':    ['currency', 'cur', 'curr', 'ccy'],
    'date':        ['date', 'expense_date', 'transaction_date', 'txn_date', 'when'],
    'payer':       ['payer', 'paid_by', 'paid by', 'who_paid', 'owner'],
    'category':    ['category', 'cat', 'type', 'group', 'tag'],
    'participants':['participants', 'split_with', 'shared_with', 'members'],
    'split_type':  ['split_type', 'split type', 'division', 'split_method'],
    'notes':       ['notes', 'note', 'remarks', 'comment', 'comments'],
}

SETTLEMENT_KEYWORDS = ['settlement', 'settle', 'reimburse', 'reimbursement', 'payback', 'pay back']


def _resolve_column(df_columns: List[str], field: str) -> str | None:
    """Find which CSV column maps to a canonical field name."""
    aliases = COLUMN_ALIASES.get(field, [field])
    lower_cols = {c.lower().strip(): c for c in df_columns}
    for alias in aliases:
        if alias.lower() in lower_cols:
            return lower_cols[alias.lower()]
    return None


def _parse_amount(raw) -> Tuple[Decimal | None, str | None]:
    """Extract numeric amount and optional embedded currency symbol."""
    s = _clean_val(raw)
    if not s:
        return None, None
    found_currency = None
    for sym, code in CURRENCY_MAP.items():
        if sym in s.lower():
            found_currency = code
            s = s.replace(sym, '').replace(sym.upper(), '')
            break
    s = re.sub(r'[^\d.\-]', '', s)
    try:
        return Decimal(s), found_currency
    except InvalidOperation:
        return None, found_currency


def _infer_currency(rows: List[Dict], idx: int) -> Tuple[str, bool]:
    """Look at surrounding rows (±3) to infer a missing currency."""
    window = rows[max(0, idx - 3): idx] + rows[idx + 1: idx + 4]
    currencies = [r.get('currency', '') for r in window if r.get('currency') not in ('', 'UNKNOWN', None)]
    if currencies:
        from collections import Counter
        most_common = Counter(currencies).most_common(1)[0][0]
        return most_common, True  # (currency, was_inferred)
    return 'UNKNOWN', False


def _is_settlement(description: str) -> bool:
    if not description:
        return False
    return any(kw in description.lower() for kw in SETTLEMENT_KEYWORDS)


def parse_csv(file_content: bytes) -> Dict[str, Any]:
    """
    Main entry point.
    Returns a dict with:
      - expenses: list of normalised expense dicts
      - settlements: list of settlement dicts
      - actions_taken: list of human-readable actions for the import report
      - parse_errors: list of rows that could not be parsed
    """
    actions_taken = []
    parse_errors = []

    # ── Read CSV ──────────────────────────────────────────────────────────
    try:
        df = pd.read_csv(io.BytesIO(file_content))
    except Exception as e:
        return {'error': f'Could not parse CSV: {str(e)}'}

    df.columns = df.columns.str.strip()
    total_rows = len(df)

    # ── Map columns ───────────────────────────────────────────────────────
    col_map = {}
    for field in COLUMN_ALIASES:
        resolved = _resolve_column(list(df.columns), field)
        if resolved:
            col_map[field] = resolved

    expenses = []
    settlements = []

    for idx, row in df.iterrows():
        try:
            desc = _clean_val(row.get(col_map.get('description', 'description'), f'Row {idx + 1}'))
            if not desc:
                desc = f'Row {idx + 1}'

            # Amount + embedded currency
            raw_amount = row.get(col_map.get('amount', 'amount'), None)
            amount, embedded_currency = _parse_amount(raw_amount)
            if amount is None:
                parse_errors.append({'row': idx + 1, 'reason': 'Could not parse amount', 'raw': str(raw_amount)})
                continue

            # Currency
            raw_currency = _clean_val(row.get(col_map.get('currency', 'currency'), ''))
            currency_code = CURRENCY_MAP.get(raw_currency.lower(), raw_currency.upper() if raw_currency else '')
            if not currency_code or currency_code == 'UNKNOWN':
                if embedded_currency:
                    currency_code = embedded_currency
                # Infer later (two-pass needed; mark as blank for now)

            # Date — try multiple formats, always emit YYYY-MM-DD or empty
            raw_date = row.get(col_map.get('date', 'date'), None)
            parsed_date = ''
            try:
                raw_date_str = str(raw_date).strip() if raw_date is not None else ''
                if not raw_date_str or raw_date_str.lower() in ('nan', 'none', 'null', 'n/a', ''):
                    parsed_date = ''
                else:
                    # Try pandas with dayfirst=False first, then dayfirst=True
                    # Also handles formats like "Mar-14", "14-Mar-2023", "2023/03/14", etc.
                    for dayfirst in (False, True):
                        try:
                            parsed_date = pd.to_datetime(raw_date_str, dayfirst=dayfirst, infer_datetime_format=True).strftime('%Y-%m-%d')
                            break
                        except Exception:
                            continue
                    # If still empty, try explicit common formats
                    if not parsed_date:
                        for fmt in ('%d-%b-%y', '%b-%d', '%b-%Y', '%d/%m/%Y', '%m/%d/%Y',
                                    '%d-%m-%Y', '%Y/%m/%d', '%B %d, %Y', '%d %b %Y'):
                            try:
                                import datetime as _dt
                                dt = _dt.datetime.strptime(raw_date_str, fmt)
                                # If year is only 2-digit style (like "Mar-14" → year 14 → assume 2014)
                                if dt.year < 100:
                                    dt = dt.replace(year=dt.year + 2000)
                                parsed_date = dt.strftime('%Y-%m-%d')
                                break
                            except Exception:
                                continue
            except Exception:
                parsed_date = ''

            # Payer
            payer = _clean_val(row.get(col_map.get('payer', 'payer'), ''))

            # Category
            category = _clean_val(row.get(col_map.get('category', 'category'), ''))

            # Notes
            notes = _clean_val(row.get(col_map.get('notes', 'notes'), ''))

            # Participants (best-effort JSON parse)
            raw_participants = _clean_val(row.get(col_map.get('participants', 'participants'), ''))
            participants = []
            if raw_participants:
                parts = raw_participants.split(';')
                for p in parts:
                    p = p.strip()
                    if p:
                        participants.append({'name': p, 'share_amount': None, 'share_pct': None})

            # Split type
            split_type = _clean_val(row.get(col_map.get('split_type', 'split_type'), 'equal')).lower()
            if split_type not in ('equal', 'percentage', 'exact'):
                split_type = 'equal'

            record = {
                'description': desc,
                'amount': str(amount),
                'currency': currency_code,
                'currency_inferred': False,
                'date': parsed_date,
                'payer': payer,
                'category': category,
                'participants': participants,
                'split_type': split_type,
                'notes': notes,
                'is_settlement': _is_settlement(desc),
                'raw_row': {str(k): str(v) for k, v in row.items()},
            }

            if record['is_settlement']:
                settlements.append(record)
            else:
                expenses.append(record)

        except Exception as e:
            parse_errors.append({'row': idx + 1, 'reason': str(e), 'raw': str(row.to_dict())})

    # ── Two-pass: infer missing currencies ────────────────────────────────
    all_rows = expenses + settlements
    inferred_count = 0
    for i, r in enumerate(all_rows):
        if not r['currency'] or r['currency'] == 'UNKNOWN':
            inferred, was_inferred = _infer_currency(all_rows, i)
            r['currency'] = inferred
            r['currency_inferred'] = was_inferred
            if was_inferred:
                inferred_count += 1

    if inferred_count:
        actions_taken.append(f"Currency inferred from surrounding transactions for {inferred_count} record(s)")

    if settlements:
        actions_taken.append(f"{len(settlements)} settlement row(s) separated from expenses")

    if parse_errors:
        actions_taken.append(f"{len(parse_errors)} row(s) skipped due to parse errors")

    return {
        'expenses': expenses,
        'settlements': settlements,
        'total_rows': total_rows,
        'actions_taken': actions_taken,
        'parse_errors': parse_errors,
    }

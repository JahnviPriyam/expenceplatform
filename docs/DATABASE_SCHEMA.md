# Database Schema

## Tables

### `auth_user` (Django built-in)
Standard Django user model — `id`, `username`, `email`, `password`, `is_staff`

---

### `api_importbatch`
One record per CSV upload.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT PK | Auto-increment |
| `user_id` | FK → auth_user | Owning user |
| `filename` | VARCHAR(255) | Original file name |
| `total_records` | INT | Rows in the CSV |
| `records_imported` | INT | Successfully imported rows |
| `warnings` | INT | HIGH + MEDIUM anomaly count |
| `critical_issues` | INT | CRITICAL anomaly count |
| `integrity_score` | FLOAT | 0–100 computed score |
| `grade` | VARCHAR(4) | A / B+ / B / C / D / F |
| `actions_taken` | JSONB | Array of human-readable action strings |
| `created_at` | TIMESTAMPTZ | |

---

### `api_expense`
One row per expense from a CSV.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT PK | |
| `user_id` | FK → auth_user | |
| `import_batch_id` | FK → api_importbatch | |
| `description` | VARCHAR(500) | |
| `amount` | DECIMAL(12,2) | |
| `currency` | VARCHAR(10) | INR / USD / EUR / UNKNOWN |
| `currency_inferred` | BOOLEAN | True if currency was inferred from context |
| `date` | DATE | |
| `category` | VARCHAR(100) | |
| `payer` | VARCHAR(255) | |
| `participants` | JSONB | `[{name, share_amount, share_pct}]` |
| `split_type` | VARCHAR(50) | equal / percentage / exact |
| `notes` | TEXT | |
| `is_settlement` | BOOLEAN | Separated from normal expenses |
| `raw_row` | JSONB | Original CSV row for audit trail |
| `created_at` | TIMESTAMPTZ | |

---

### `api_anomaly`
Detected issues linked to expense rows.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT PK | |
| `expense_id` | FK → api_expense | |
| `import_batch_id` | FK → api_importbatch | |
| `anomaly_type` | VARCHAR(50) | See types below |
| `severity` | VARCHAR(10) | CRITICAL / HIGH / MEDIUM / LOW |
| `description` | TEXT | System-generated description with specifics |
| `ai_explanation` | TEXT | Cached Gemini response (generated on demand) |
| `resolved` | BOOLEAN | Manual resolution flag |
| `created_at` | TIMESTAMPTZ | |

**Anomaly Types:**
`DUPLICATE_EXPENSE`, `MISSING_CURRENCY`, `MISSING_PAYER`, `INVALID_SPLIT`,
`UNUSUAL_AMOUNT`, `FUTURE_DATE`, `AMBIGUOUS_DATE`, `SINGLE_PARTICIPANT`, `SETTLEMENT_MIXED`

---

### `api_settlement`
Reimbursement rows separated from expenses.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT PK | |
| `user_id` | FK → auth_user | |
| `import_batch_id` | FK → api_importbatch | |
| `from_participant` | VARCHAR(255) | Person paying |
| `to_participant` | VARCHAR(255) | Person receiving |
| `amount` | DECIMAL(12,2) | |
| `currency` | VARCHAR(10) | |
| `date` | DATE | |
| `notes` | TEXT | |
| `created_at` | TIMESTAMPTZ | |

---

### `api_participant`
Named participants across all expenses.

| Column | Type | Description |
|---|---|---|
| `id` | BIGINT PK | |
| `user_id` | FK → auth_user | |
| `name` | VARCHAR(255) | |
| `email` | VARCHAR | Optional |
| `total_owed` | DECIMAL(12,2) | Computed balance |
| `total_paid` | DECIMAL(12,2) | Computed balance |
| `created_at` | TIMESTAMPTZ | |

---

## Key Relationships

```
auth_user ──< api_importbatch ──< api_expense ──< api_anomaly
                              ──< api_settlement
auth_user ──< api_participant
```

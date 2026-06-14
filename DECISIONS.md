# DECISIONS.md — Key Engineering Decisions

## 1. Django REST Framework over FastAPI

**Decision:** Use Django + DRF for the backend.

**Rationale:**
- Django's ORM handles the relational data model (Expense → Anomaly → ImportBatch) with minimal boilerplate.
- DRF's `ModelViewSet` and serializer pattern lets the API be built and extended fast.
- Django Admin gives a free data inspection UI — useful for debugging during development.
- FastAPI would have required manual schema setup and migration tooling.

---

## 2. Pandas for CSV Parsing (not stdlib `csv`)

**Decision:** Use `pandas.read_csv()` with a custom column alias resolver.

**Rationale:**
- Real-world CSVs use inconsistent column names (`paid_by`, `payer`, `who_paid`). Pandas makes column normalization easy.
- Pandas handles BOM markers, mixed encodings, quoted commas (e.g. `"1,200"`), and trailing whitespace automatically.
- The two-pass currency inference (infer missing currencies from surrounding rows) is natural as a vectorized pass over a DataFrame.
- Alternative (stdlib csv): would require manually writing all of the above.

---

## 3. Rule-Based Anomaly Detection (not ML)

**Decision:** Implement 9 deterministic rule-based detectors instead of a trained ML model.

**Rationale:**
- The dataset size (42 rows) is too small to train a reliable ML anomaly detector.
- Rules are transparent: the description field in each anomaly directly explains what triggered it.
- Rules are fast — the entire detection pass runs in <50ms on the provided dataset.
- AI (Gemini) is used for *explanation* of flagged anomalies, not for detection — this is a better separation of concerns.

**Detectors implemented:**
1. `DUPLICATE_EXPENSE` — exact match on description + amount + date
2. `MISSING_CURRENCY` — no currency field and cannot be inferred
3. `MISSING_PAYER` — payer field blank
4. `INVALID_SPLIT` — percentage splits don't sum to 100%
5. `UNUSUAL_AMOUNT` — amount > 3× standard deviation from group mean
6. `FUTURE_DATE` — date is after today
7. `AMBIGUOUS_DATE` — date format cannot be reliably parsed to a calendar day
8. `SINGLE_PARTICIPANT` — only one person in a "shared" expense
9. `SETTLEMENT_MIXED` — settlement row mixed in with regular expenses

---

## 4. Integrity Score Formula

**Decision:** Penalty-based scoring from 100, with graduated deductions per severity.

```
base = 100
deduct CRITICAL:  -15 per anomaly
deduct HIGH:      -8  per anomaly
deduct MEDIUM:    -3  per anomaly
deduct LOW:       -1  per anomaly
floor at 0
```

**Rationale:**
- Simple to understand and audit — a single critical issue shouldn't fail the entire dataset.
- Graduated so a dataset with 5 low-severity issues still scores higher than one with 1 critical issue.
- Maps naturally to A–F letter grades: A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 60, F < 60.

---

## 5. Gemini Flash (not GPT-4 / Claude)

**Decision:** Use `gemini-1.5-flash` for anomaly explanations.

**Rationale:**
- Free tier available via Google AI Studio with no credit card required.
- Low latency (< 1s per explanation) — acceptable for an on-demand explain button.
- Context window is passed as a 5-transaction window around the anomaly — this keeps the prompt focused and avoids hallucinations from unrelated data.
- Graceful degradation: if no API key is set, the endpoint returns a static fallback message.

---

## 6. Multi-Stage Docker Build

**Decision:** Separate builder and runtime stages for the frontend.

**Rationale:**
- The Node.js build toolchain (Vite, TypeScript, ~400MB) is not needed at runtime.
- Final nginx image is ~25MB, making it fast to pull/deploy.
- `gunicorn --reload` on the backend means Python file changes are picked up without a full rebuild during development — only the frontend image needs to be rebuilt when source changes.

---

## 7. PostgreSQL over SQLite

**Decision:** Use PostgreSQL (via Docker) even for development.

**Rationale:**
- SQLite doesn't support `JSONField` with full query capabilities in older Django versions.
- Participants and raw CSV rows are stored as JSON — PostgreSQL's JSONB is reliable and indexable.
- Avoids "works on my machine" issues between dev and production.

---

## 8. JWT Authentication with Auto-Refresh

**Decision:** `djangorestframework-simplejwt` with a 60-minute access token and 7-day refresh token.

**Rationale:**
- Standard, stateless auth that pairs naturally with a React SPA.
- The Axios interceptor in `api.ts` transparently refreshes the access token on 401, so the user is never unexpectedly logged out mid-session.
- No third-party auth service dependency.

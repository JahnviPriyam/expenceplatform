# SCOPE.md — Project Scope

## Assignment Alignment

This project was built for the **Spreetail take-home assessment**: an AI-powered expense intelligence platform that imports, analyzes, and explains shared expense data.

---

## What Was Built

### Core Requirements ✅

| Requirement | Implementation |
|---|---|
| Import expense CSV | Drag-and-drop upload, Pandas parsing, 9-column alias resolution |
| Detect anomalies | 9 rule-based detectors (duplicates, missing fields, invalid splits, unusual amounts, future dates, ambiguous dates) |
| Display anomaly report | Filterable anomaly ledger with severity badges, AI explanation modal |
| Data integrity score | Penalty-based 0–100 score with A–F letter grade |
| Store to database | PostgreSQL via Django ORM — expenses, anomalies, import batches |

### Extended Features ✅

| Feature | Why Added |
|---|---|
| Gemini AI anomaly explanations | Demonstrates AI integration; produces human-readable context per anomaly |
| PDF report download | Makes import summaries exportable for review |
| JWT authentication | Realistic multi-user access control |
| Quantum Core 3D visualization | Data integrity state rendered as animated sphere — makes score immediately visible |
| Dashboard stats aggregation | Single-screen summary of portfolio health |
| Collapsible sidebar navigation | Clean navigation UX: Expenses, AI Insights, Settings pages |

---

## What Was Intentionally Left Out

| Omission | Reason |
|---|---|
| Real-time WebSocket updates | Not required; polling on page load is sufficient for batch CSV analysis |
| Multi-user permission tiers | Single authenticated user per session is enough for this scope |
| OAuth / SSO | Out of scope; demo credentials (admin/admin) sufficient |
| Full test suite | Unit tests exist for anomaly engine; full E2E coverage deprioritized for speed |

---

## Dataset Assumptions

The provided `Expenses Export.csv` contains:
- 42 expense rows spanning Feb–Apr 2026
- Mixed currencies (INR, USD)
- Deliberate data quality issues: duplicate entries, missing payers, invalid split types, ambiguous date formats (`Mar-14`), negative refunds, zero-amount entries

The system handles all of these without crashing and flags them appropriately.

---

## Time Allocation (estimated)

| Area | Time |
|---|---|
| Backend (Django, CSV parser, anomaly engine, AI) | ~8 hours |
| Frontend (React, dashboard, import flow, UX) | ~10 hours |
| Infrastructure (Docker, nginx, PostgreSQL) | ~2 hours |
| Documentation | ~1 hour |

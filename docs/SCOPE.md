# Expense Nexus — Project Scope

## Assignment Alignment

| Assignment Requirement | Implementation |
|---|---|
| Parse CSV expense data | `services/csv_import.py` — Pandas parser with column alias resolution and two-pass currency inference |
| Detect anomalies | `services/anomaly_engine.py` — 9 rule-based detectors covering duplicates, missing fields, invalid splits, unusual amounts, and date issues |
| Generate import report | `services/report_generator.py` — Structured JSON report + PDF export via WeasyPrint |
| Data persistence | PostgreSQL via Django ORM — expenses, anomalies, settlements, participants, and import reports all persisted |
| AI integration | `services/ai_explainer.py` — Gemini 1.5 Flash with structured prompts and 5-transaction context window |
| Premium UI | React Three Fiber data core, glassmorphism panels, Framer Motion animations, severity glow effects |

## Pages Built (Phase 1)

- `/login` — JWT authentication with floating 3D orb
- `/dashboard` — Data-reactive Quantum Core, financial overview, anomaly radar
- `/import` — Energy chamber drag-and-drop, multi-step upload animation
- `/anomalies` — Full anomaly ledger with AI explanation console
- `/reports` — Import summaries with PDF export and integrity score formula

## Pages Planned (Phase 2)

- `/expenses` — Full sortable, filterable expense table
- `/ai-insights` — Dedicated AI command center page

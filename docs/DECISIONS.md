# Engineering Decisions

This document captures the key architectural and product decisions made during
the development of Expense Nexus, and the reasoning behind each choice.

---

| Feature | Decision | Reason |
|---|---|---|
| CSV Upload | Pandas-based parsing with column alias resolution | Column names vary across export tools (Splitwise, Tricount, manual). Alias resolution handles common variants without user friction. |
| Anomaly Detection | Rule-based engine (not ML) | Rule-based detection is auditable, explainable, and deterministic. ML models would be a black box and require training data we don't have. |
| Duplicate Detection | Flag for manual review, not auto-delete | High-confidence duplicate detection (same amount + date + payer) can still produce false positives. Recurring expenses and shared vendor payments on the same day are valid. Automated deletion causes data loss. |
| Currency Inference | Two-pass inference from context window | Rather than rejecting records with missing currency, the system infers from surrounding transactions. This is documented in the import report as a transparent action taken. |
| Integrity Score | Penalty-based formula with capped maximums | Prevents a single type of anomaly from dominating the score. A dataset with 50 low-severity issues should score differently from one with 3 critical issues. |
| AI Explanations | On-demand (user click), not automatic | Generating explanations for every anomaly at import time would make imports slow and incur unnecessary API costs. Users often resolve issues from the rule description alone. |
| AI Model | Gemini 1.5 Flash | Fast enough for interactive use, strong instruction following, cost-effective per-anomaly pricing. |
| AI Prompt | Structured with context window | A generic prompt ("explain this anomaly") produces vague output. Providing the actual amounts, dates, and surrounding transactions forces specific, actionable responses. |
| Authentication | JWT only (no signup/OAuth) | The assignment focuses on expense analysis, not user management. Signup flows would consume development time without adding evaluation-relevant functionality. |
| Database | PostgreSQL over SQLite | SQLite is fine for demos but signals a prototype. PostgreSQL is what production expense platforms use, and it directly aligns with the role description. |
| PDF Generation | Server-side (WeasyPrint) | Client-side PDF (jsPDF) produces basic output. Server-side rendering allows full-fidelity, styled reports that reflect the platform's premium positioning. |
| Monorepo | Single repository | Recruiters open one link. One README, one `docker compose up`, one deployment story. The trade-off (less separation of concerns) is acceptable for an assignment. |
| Frontend Framework | React + TypeScript + Vite | Standard production stack, fast dev experience, strict typing catches bugs early. |
| 3D Core | React Three Fiber | Data-driven visualization: the core's colour, distortion, and particle behaviour are computed from the integrity score, not hardcoded. This makes the animation meaningful. |

---

## What Was Deliberately Excluded

| Feature | Reason |
|---|---|
| User signup / forgot password | Not relevant to anomaly detection assignment |
| ML-based anomaly detection | No training data; rules are more auditable |
| Real-time websocket updates | Import is fast enough for polling |
| Multi-tenancy | Out of scope for assignment |
| 2000+ particle engine | Decorative, not functional — kept at ~120 particles |
| Web Audio API spacecraft hum | Adds complexity without informational value |

---

## Integrity Score Design

Start Score: 100

Scoring is penalty-based: each anomaly type subtracts a fixed number of points from the start score. To avoid a single issue type dominating the score, each anomaly type has a maximum cumulative cap per import batch.

Penalty table (examples):
- Duplicate Expense: -10 pts, cap 30
- Missing Payer: -15 pts, cap 25
- Invalid Split: -20 pts, cap 30
- Missing Currency: -5 pts, cap 20
- Ambiguous Date: -10 pts, cap 15
- Unusual Amount: -3 pts, cap 15
- Future Date: -10 pts, cap 10
- Single Participant: -2 pts, cap 10
- Settlement Mixed: -5 pts, cap 10

Final integrity score = max(0, round(100 - total_penalty, 1)).

Grade mapping:
- A: 90+
- B+: 80+
- B: 70+
- C: 60+
- D: 50+
- F: else

Design rationale: using an absolute penalty model focuses on the impact of specific issues rather than anomaly density. A single critical missing payer is considered a high-impact data-quality problem and should meaningfully reduce the dataset's integrity score regardless of dataset size.

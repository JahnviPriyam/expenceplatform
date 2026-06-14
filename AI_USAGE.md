# AI_USAGE.md — AI Tools Usage

## Overview

AI was used in two distinct ways in this project:

1. **As a development assistant** — to help write boilerplate, debug errors, and accelerate implementation
2. **As a runtime feature** — Gemini API integrated into the product to generate anomaly explanations

---

## 1. AI Used During Development

### Tool: Gemini / Antigravity IDE

**Where it helped:**

| Area | How AI was used |
|---|---|
| Django model design | Generated initial `Expense`, `Anomaly`, `ImportBatch` model structure |
| CSV parser | Suggested the two-pass currency inference pattern and column alias resolver |
| Anomaly engine | Drafted the 9-rule detector loop; anomaly type/severity mapping |
| React components | Scaffolded `QuantumCore`, `HolographicPanel`, `NavBar` component structure |
| Docker setup | Generated `docker-compose.yml` and nginx reverse proxy config |
| TypeScript fixes | Debugged `React.ElementType` → `React.ComponentType` TS errors during build |
| Date parsing | Suggested multi-format fallback parser for ambiguous dates like `Mar-14` |

**What was written manually / reviewed critically:**

- All anomaly detection business logic was reviewed and adjusted for the actual dataset
- The integrity scoring formula and penalty weights were decided manually
- All API endpoint signatures and URL routing
- Database migration decisions (JSONField for participants, raw_row)
- Final prompt engineering for the Gemini explanation feature

---

## 2. Gemini API — Runtime Feature

### Purpose
When a user clicks "Get AI Explanation" on an anomaly, the system calls Gemini to generate a human-readable explanation of why that transaction is flagged.

### Implementation

**File:** `backend/services/ai_explainer.py`

**Prompt structure:**
```
You are an AI financial analyst assistant. An anomaly has been flagged in a shared expense dataset.

Anomaly Type: {anomaly_type}
Severity: {severity}
Expense: {description} — {amount} {currency} on {date}
Payer: {payer}
Detected Issue: {anomaly_description}

Nearby transactions for context:
{nearby_expenses_list}

Provide a concise, specific explanation (2-4 sentences) of:
1. Why this expense was flagged
2. What the financial risk or data quality issue is
3. What action the team should take to resolve it
```

**Model used:** `gemini-1.5-flash`  
**Context window:** 5 surrounding transactions (±2 before, ±2 after) passed to the model for local context  
**Caching:** Explanation is saved to `Anomaly.ai_explanation` field after first generation — repeated clicks don't re-call the API  
**Fallback:** If `GEMINI_API_KEY` is not set or the API call fails, a static message is returned: `"AI explanation unavailable. Please check your API key configuration."`

---

## 3. What AI Did NOT Do

- Did not design the database schema (done manually to match the CSV structure)
- Did not choose the tech stack (Django + React + PostgreSQL was a deliberate choice)
- Did not write the final README, SCOPE, or DECISIONS documents (written manually based on actual implementation)
- Did not determine what counts as an anomaly (business logic decisions made by the developer)

---

## 4. Prompt Engineering Notes

The key design decision in the AI explanation prompt is the **context window**:

> Including 5 surrounding transactions prevents the model from giving generic answers like "this expense may be a duplicate." Instead it can say "this ₹2400 Thalassa dinner on Mar-11 appears within 10 minutes of another ₹2450 Thalassa dinner entry by a different payer — likely a double-logging error."

Without context, Gemini outputs boilerplate. With context, it outputs actionable, dataset-specific explanations.

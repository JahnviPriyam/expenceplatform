# AI Usage Documentation

## Overview

Expense Nexus integrates Google Gemini 1.5 Flash for generating contextual anomaly explanations.
The AI is not used as decoration — it augments the rule-based anomaly engine by providing
human-readable, actionable explanations grounded in the actual transaction data.

---

## Integration Architecture

```
User clicks "Explain AI" on an anomaly
            │
            ▼
POST /api/ai/explain/{anomaly_id}/
            │
            ▼
services/ai_explainer.py
  ├── Fetch anomaly + expense from DB
  ├── Build 5-transaction context window (3 before + 1 after)
  ├── Construct structured prompt
  └── Call Gemini 1.5 Flash
            │
            ▼
Response displayed with typewriter animation in AIConsole
```

---

## Prompt Design

The prompt is structured in four sections:

1. **Role assignment** — "You are an AI expense auditor for enterprise financial software."
2. **Anomaly context** — Type, severity, system detection note
3. **Transaction data** — Description, amount, currency, date, payer, participants, split type
4. **Context window** — Up to 5 surrounding transactions to enable inference

### Full Prompt Template

```
You are an AI expense auditor for enterprise financial software called Expense Nexus.

A data quality anomaly has been detected in an expense record. Analyse it and produce 
a clear, professional explanation for a finance team member.

ANOMALY DETAILS:
- Type: {readable_type}
- Severity: {severity}
- System Detection Note: {system_description}

FLAGGED TRANSACTION:
- Description: {expense.description}
- Amount: {expense.currency} {expense.amount}
- Date: {expense.date}
- Payer: {expense.payer or 'NOT PROVIDED'}
- Category: {expense.category}
- Split Type: {expense.split_type}
- Participants: {expense.participants}
- Currency was inferred: {expense.currency_inferred}

SURROUNDING TRANSACTIONS (context window):
  - {nearby[0]}
  - {nearby[1]}
  ...

YOUR TASK:
Write a concise explanation (3–5 sentences) that:
1. States clearly WHY this was flagged
2. Identifies the most likely CAUSE based on the transaction data
3. Gives a specific, actionable RECOMMENDATION

Be specific — reference the actual amounts, dates, names, and currency codes from the data above.
Do not be generic. Do not use markdown or bullet points in your response.
```

---

## Example: Missing Currency

**Input anomaly:**
- Type: MISSING_CURRENCY
- Expense: "Grocery DMart", ₹ 2105, 2024-06-03, Payer: Alice

**Context window:**
- Pizza Friday | INR 1200 | 2024-06-01
- Cab to Airport | INR 850 | 2024-06-01
- Conference Lunch | INR 3400 | 2024-06-04

**Gemini response:**
> The expense "Grocery DMart" on 2024-06-03 was flagged because no currency value was provided in the original CSV. Based on the surrounding transactions — all denominated in INR — the system has inferred the currency as INR with moderate confidence. The ₹2,105 amount appears reasonable for a grocery purchase. Recommendation: verify with Alice that this transaction is indeed in INR and update the source record to prevent ambiguity in future imports.

---

## Example: Invalid Split

**Input anomaly:**
- Type: INVALID_SPLIT  
- Expense: "Laptop Charger", ₹2200, split by percentage

**Gemini response:**
> The expense "Laptop Charger" (₹2,200) uses percentage-based splitting that totals 110%, not the required 100%. This over-allocates ₹220 across participants. The most likely cause is a data entry error where one participant's share was entered as a percentage of the subtotal rather than the total. Recommendation: recalculate participant shares to ensure they sum to exactly 100% before processing reimbursements.

---

## Engineering Decisions

### Why Gemini 1.5 Flash?
- Fast response times suitable for interactive UI
- Strong instruction following for structured prompts
- Cost-effective for per-anomaly API calls

### Why a context window?
Without surrounding transactions, the AI cannot determine:
- Whether a missing currency is genuinely unknown or just omitted
- Whether an amount is unusual relative to the user's spending patterns
- Whether a duplicate might be a recurring expense

The 5-transaction window (3 before, 1 after) provides enough signal for these inferences.

### Why not auto-generate explanations?
AI explanations are generated on demand (user click) rather than on import because:
- API costs scale with dataset size
- Users may not need explanations for every anomaly
- On-demand generation keeps the import pipeline fast

### Caching
Once generated, explanations are stored in `anomaly.ai_explanation` to avoid redundant API calls.

---

## Model Used
`gemini-1.5-flash` via `google-generativeai` Python SDK

# Expense Nexus

> **AI-Powered Expense Intelligence Platform**  
> Built with React · TypeScript · Django · PostgreSQL · Gemini AI

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)
[![Django](https://img.shields.io/badge/Django-5-092E20?logo=django)](https://djangoproject.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://postgresql.org)

---

## Architecture

```
React (Vite + TypeScript)
        │
        ▼
Django REST Framework API
        │
   ┌────┴────┐
   │         │
PostgreSQL  Gemini AI
```

## Features

| Feature | Description |
|---|---|
| **CSV Import** | Drag-and-drop upload with Pandas parsing, column alias resolution, settlement separation |
| **Anomaly Detection** | 9 rule-based detectors: duplicates, missing fields, invalid splits, unusual amounts, future dates |
| **Data Integrity Score** | Penalty-based 0–100 score with letter grades (A–F), drives the Quantum Core visual state |
| **AI Explanations** | Gemini 1.5 Flash generates contextual, specific anomaly explanations using a 5-transaction context window |
| **PDF Reports** | Server-side rendered import summaries exportable as PDF |
| **3D Quantum Core** | React Three Fiber data core that changes color and behavior based on your dataset's health |
| **JWT Auth** | Simple token-based authentication with auto-refresh |

---

## Quick Start — Docker (Recommended)

```bash
# 1. Clone the repo
git clone <repo-url>
cd expense-nexus

# 2. Set your Gemini API key (optional, AI features won't work without it)
echo "GEMINI_API_KEY=your_key_here" > .env

# 3. Start everything
docker compose up

# App is running at:
#   Frontend  → http://localhost:3000
#   Backend   → http://localhost:8000
#   Django Admin → http://localhost:8000/admin

# Demo login: admin / admin
```

---

## Local Development (No Docker)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials and Gemini API key

# Run migrations and create demo user
python manage.py migrate
python manage.py create_demo_user

# Start server
python manage.py runserver
```

### Frontend

```bash
cd frontend

npm install
npm run dev

# Opens at http://localhost:5173
```

---

## Sample Data

Import `docs/sample_expenses.csv` to immediately see the platform working.  
It contains 47 records with deliberate anomalies:

- 2 duplicate expenses
- 2 missing currency values
- 2 missing payers
- 1 invalid percentage split (110%)
- 1 future-dated expense
- 1 unusually large amount

Expected result: **Integrity Score ~68 / Grade C**

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/token/` | Login, get JWT tokens |
| `POST` | `/api/import/` | Upload CSV file |
| `GET` | `/api/dashboard/stats/` | Aggregate statistics |
| `GET` | `/api/anomalies/` | List anomalies (filter: `?severity=CRITICAL`) |
| `POST` | `/api/ai/explain/{id}/` | Gemini AI explanation for anomaly |
| `GET` | `/api/reports/` | List import reports |
| `GET` | `/api/reports/{id}/pdf/` | Download report as PDF |
| `GET` | `/api/expenses/` | List all expenses |

---

## Deployment

| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | Neon (serverless PostgreSQL) |

Set `GEMINI_API_KEY`, `DATABASE_URL`, `SECRET_KEY`, and `DEBUG=False` in your deployment environment.

---

## Documentation

| Doc | Description |
|---|---|
| [SCOPE.md](SCOPE.md) | Project scope and assignment alignment |
| [DECISIONS.md](DECISIONS.md) | Key engineering decisions and rationale |
| [AI_USAGE.md](AI_USAGE.md) | AI tools used during development + Gemini API integration |

---

## Demo Credentials

```
URL:      http://localhost:3000
Username: admin
Password: admin
```


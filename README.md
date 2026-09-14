# GTM Decision Engine

A GTM Engineering / RevOps portfolio project that turns CRM account data into a prioritized sales action queue.

> Don’t give sales more leads. Tell them which accounts to work now, why, and what to do next.

## Live Demo

**Web app:** https://gtm-decision-engine.vercel.app
**GitHub:** https://github.com/Vizbase/gtm-decision-engine

## What It Does

GTM Decision Engine analyzes account-level CRM data and recommends the next best action for each account.

It combines:

- CRM context
- current buying and timing signals
- optional ICP fit
- data confidence
- duplicate and data-quality checks

Supported actions:

- Work Now
- Research First
- Nurture
- Deprioritize
- Follow Up Existing
- Expansion
- Continue Opportunity
- Pause Outreach

## How It Works

```text
CRM / CSV
   ↓
Column Mapping
   ↓
Normalization
   ↓
CRM Context
   ↓
Signal Enrichment
   ↓
Optional ICP Scoring
   ↓
Data Confidence
   ↓
Account Score
   ↓
Decision Engine
   ↓
CRM-Aware Action Queue
```

## CRM-Aware Decisions

The engine preserves existing CRM context instead of treating every company as a new prospect.

Examples:

```text
Open opportunity       → Continue Opportunity
Existing customer      → Expansion
Recently contacted     → Pause Outreach
Existing high-fit lead → Follow Up Existing
```

CRM context also affects queue ranking, so Account Score and Queue Rank are intentionally different concepts.

## Account Scoring

Without an ICP profile, current signals are the main prioritization input and data confidence provides supporting context.

With an ICP configured, fit and current signals are combined.

Missing enrichment is treated as uncertainty rather than negative evidence.

For example, if website enrichment cannot verify current signals, the UI displays:

```text
Signals: Unavailable
Action: Research First
```

rather than incorrectly treating unavailable enrichment as a verified signal score of zero.

## Optional ICP

Users can optionally define:

- target countries
- target industries
- minimum employee count
- maximum employee count

ICP influences prioritization but never removes accounts from the analysis.

## Signal Enrichment

Visitor-uploaded CSV files use live website enrichment.

The engine can detect signals such as:

- hiring activity
- selected technologies
- growth-related keywords
- expansion-related keywords

Built-in demos use deterministic synthetic signal inputs so the portfolio demonstration remains stable and reproducible.

The synthetic signals are only input data. Account Score, ranking, CRM precedence, duplicate detection, and recommended actions are calculated by the real decision engine.

## CRM Duplicate Detection

Potential duplicate CRM accounts are flagged without automatically deleting or merging records.

This surfaces data-quality issues while keeping the original CRM records intact.

## CSV Import

The importer supports common CRM-style exports, including HubSpot and Salesforce-style columns.

It includes:

- automatic column detection
- manual column mapping
- CRM lifecycle/status detection
- company normalization
- delimiter handling
- duplicate detection

## Demo Datasets

### GTM Sample

30 accounts demonstrating the core decision engine.

### HubSpot Sample

61 synthetic HubSpot-style company records with CRM lifecycle context.

### Salesforce Sample

121 synthetic Salesforce-style account records including prospects, customers, CRM context, duplicate cases, and multiple recommended actions.

No real customer CRM data is included in the repository.

## Public Portfolio Privacy

The public deployment runs in portfolio mode.

Visitor-uploaded analyses are temporary and are not persisted to shared history.

Production safeguards include:

- CSV upload-size limits
- account-count limits
- restricted CORS
- URL validation
- private/local network blocking
- redirect limits
- enrichment response-size limits

## Decision Policy Validation

The decision policy is validated against a deterministic golden evaluation suite.

```text
Signal scoring: 8/8 passed
Decision policy: 27/27 passed
Overall policy conformance: 35/35 (100%)
```

All eight supported recommended actions are covered.

This means the implementation conforms to the defined decision policy across the tested scenarios.

It does **not** claim 100% predictive accuracy for real-world sales outcomes.

The complete backend test suite currently passes:

```text
34 passed
```

## Tech Stack

**Backend**

Python, FastAPI, Pydantic, SQLAlchemy, PostgreSQL, Supabase, httpx, pytest

**Frontend**

Next.js, TypeScript, React, Tailwind CSS

**Deployment**

Vercel, Render, Supabase

## Project Structure

```text
GTM Decision Engine/
├── apps/
│   └── web/
├── services/
│   └── api/
│       ├── app/
│       │   ├── api/
│       │   ├── core/
│       │   ├── integrations/
│       │   ├── models/
│       │   ├── repositories/
│       │   ├── schemas/
│       │   └── services/
│       └── tests/
├── data/
│   ├── evaluation/
│   └── sample/
├── infra/
│   └── supabase/
├── scripts/
├── workflows/
│   └── n8n/
└── README.md
```

## Local Development

Backend:

```bash
python -m uvicorn services.api.app.main:app --reload
```

Frontend:

```bash
cd apps/web
npm install
npm run dev
```

Run the backend tests from the project root:

```bash
pytest -q
```

Run the golden policy evaluation:

```bash
python scripts/evaluate_golden_set.py
```

## Environment Variables

Use `.env.example` as the reference configuration.

Never commit database passwords, API keys, tokens, private `.env` files, or private/generated CRM data.

## Why I Built This

This project explores a practical GTM Engineering problem: converting fragmented CRM and account data into clear operational decisions.

Rather than creating another lead list or dashboard, the goal is to answer the question a sales team actually needs answered:

**Which account should we work next, why, and what action should we take?**

# BRAHMO India Clinical AI — Option C
## Diabetes + Cardiovascular Decision Support for Apollo Chennai

> **Assessment submission for Astroum AI — Full-Stack Developer role**
> Built for Indian doctors using RSSDI + CSI guidelines, Indian drug brands, and ₹ MRP pricing.

---

## What This System Does

Generic AI cites ADA guidelines, uses US drug names, and has no awareness of Indian pharmacy prices. This system fixes that by **injecting Indian-specific clinical context before the LLM sees any query**:

- **RSSDI 2022 guidelines** for diabetes (not ADA)
- **CSI guidelines** for cardiovascular (not ACC/AHA)
- **Indian drug brands** with verified ₹ MRP from 1mg.com / PharmEasy
- **NLEM 2022 status** — flags the cheapest price-controlled drugs
- **Safety engine** — pre-computes eGFR, DDI checks, HF contraindications, CHA₂DS₂-VASc
- **Apollo Chennai contacts** — department extensions injected into every response
- **One unified schema** — diabetes AND cardiovascular share the same tables

---

## Quick Start (5 minutes)

### Prerequisites
- Node.js v18+
- Git
- Supabase account (free)
- Anthropic API key (free credits at console.anthropic.com)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd brahmo-india-clinical
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → Create project: `brahmo-india-clinical`
2. Go to **SQL Editor** → paste and run `supabase/schema.sql`
3. Then run `supabase/seed.sql` (loads all Indian drugs, guidelines, patients)
4. Go to **Settings → API** → copy your Project URL and anon key

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
LLM_API_KEY=your-anthropic-api-key-here
```

### 4. Run

```bash
npm run dev
# → http://localhost:3000
```

---

## Demo Guide (20-25 minutes)

### Suggested demo flow:

| Time | What to show |
|------|-------------|
| 0-2 min | Architecture diagram — one set of tables for both conditions |
| 2-4 min | `data_sources.md` highlights — real RSSDI/CSI, verified ₹ prices |
| 4-7 min | **P1 (Failing Metformin)** — Teneligliptin vs generic Sitagliptin, sulfonamide allergy block |
| 7-10 min | **P4 (Acute STEMI)** — time-stamped protocol, penicillin ANAPHYLAXIS hard block |
| 10-15 min | **P6 (DM + HF)** ⭐ — Pioglitazone blocked, SGLT2i recommended, K+ 5.1 hyperkalemia alert |
| 15-18 min | Scalability: "Adding respiratory = new rows in existing tables, zero code changes" |
| 18-25 min | Surprise test from evaluators + Q&A |

### Scalability answer (memorize this):
> "I'd research Indian Chest Society guidelines. Source inhaler brands + ₹ from 1mg.com.
> Add drug rows + guideline rows + interaction rows to EXISTING tables.
> Zero code changes. 3-4 hours of research + data loading."

---

## Architecture

```
Doctor types query
       ↓
  Safety Engine (runs FIRST)
  - eGFR computation (CKD-EPI 2021)
  - DDI check (cross-condition)
  - HF contraindication flags
  - CHA₂DS₂-VASc for AF
  - Hyperkalemia risk
       ↓
  Prompt Composer (injects context)
  - RSSDI/CSI guidelines from Supabase
  - Indian drugs + ₹ MRP
  - NLEM status
  - Hospital contacts
  - Insurance/cost context
       ↓
  Claude API (with enriched system prompt)
       ↓
  Side-by-side: Generic AI vs Option C
```

### Database (ONE schema for ALL conditions)

```sql
drugs            -- ALL drugs (diabetes + cardiac) tagged by condition
drug_interactions -- cross-condition pairs (diabetes drug ↔ cardiac drug)
indian_guidelines -- RSSDI + CSI + IHRS (filtered by condition tag)
hospital_formulary -- Apollo Chennai stock + pricing
patients          -- 6 demo profiles + extensible
hospital_contacts  -- All Apollo department contacts
```

---

## Project Structure

```
brahmo-india-clinical/
├── README.md
├── .env.local.example
├── package.json
├── supabase/
│   ├── schema.sql          ← ONE unified schema
│   └── seed.sql            ← Real Indian data (verified)
├── docs/
│   ├── data_sources.md     ← Where every piece of data came from
│   └── architecture.md     ← Scalability design notes
├── src/
│   ├── app/
│   │   ├── page.tsx        ← Main demo UI
│   │   └── api/
│   │       ├── safety-check/route.ts
│   │       ├── compose-prompt/route.ts
│   │       └── claude/route.ts      ← Parallel generic + Option C calls
│   ├── lib/
│   │   ├── types.ts        ← All TypeScript types
│   │   ├── supabase.ts     ← Supabase client
│   │   ├── calculators.ts  ← eGFR, CHA2DS2-VASc, K+ risk
│   │   ├── safety-engine.ts ← DDI, renal, HF, allergy checks
│   │   └── prompt-composer.ts ← India context injector
│   └── components/
│       ├── PatientCard.tsx
│       ├── SafetyAlerts.tsx
│       ├── ResponseComparison.tsx
│       └── GuidelineSources.tsx
└── research/               ← Source screenshots/PDFs
```

---

## Key India-Specific Decisions

| Topic | Generic AI | BRAHMO Option C |
|-------|-----------|-----------------|
| Diabetes guidelines | ADA | RSSDI 2022 |
| Cardiac guidelines | ACC/AHA | CSI + IHRS |
| DPP4 inhibitor | Sitagliptin (₹500+) | **Teneligliptin** (₹199, NLEM 2022) |
| Thrombolytic choice | tPA (alteplase) | **Streptokinase ₹5,500 vs Tenecteplase ₹28,000** |
| HbA1c target elderly | 7.0% strict | **7.5-8.0% relaxed** (RSSDI) |
| Drug prices | USD estimates | **Verified ₹ MRP from 1mg.com** |
| HF drug choice | Generic SGLT2i | **SGLT2i dual benefit** + Pioglitazone BLOCKED |

---

## Tech Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Safety Engine**: Custom TypeScript
- **Deployment**: Vercel (zero config with Next.js)

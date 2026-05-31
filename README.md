# BRAHMO India Clinical AI — Option C
## Diabetes + Cardiovascular Decision Support for Apollo Chennai
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
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)/Groq API key (free)
- **Safety Engine**: Custom TypeScript
- **Deployment**: Vercel (zero config with Next.js)

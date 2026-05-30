# Architecture Notes
## BRAHMO India Clinical AI — Option C

---

## The Core Design Principle: One Schema, Infinite Conditions

The assessment asks: *"If adding condition #3 requires new tables or code changes, your architecture doesn't scale."*

**Here is exactly how we avoided that:**

### ❌ What We Did NOT Build
```sql
-- WRONG: Condition-specific tables
diabetes_drugs
cardiology_drugs
diabetes_guidelines
cardiology_guidelines
```

### ✅ What We Built
```sql
-- RIGHT: Unified tables tagged by condition
drugs              -- ALL drugs, tagged: condition_tags: ["diabetes", "cardiovascular"]
indian_guidelines  -- ALL guidelines, tagged by condition
drug_interactions  -- ALL DDI pairs, including cross-condition
hospital_formulary -- ALL formulary data
patients           -- ALL patients, tagged by condition(s)
```

The `condition_tags` JSONB column on every table is the key. A drug like Empagliflozin carries `["diabetes", "cardiovascular", "heart_failure"]` — it appears in results for any of those conditions automatically.

---

## Adding Condition #3: Respiratory (Asthma + COPD)

If asked at the demo: *"Walk me through adding respiratory medicine tomorrow."*

**Answer:**

```
1. Research: Indian Chest Society (ICS) guidelines for asthma + COPD
   Time: 1-2 hours

2. Drug data: Source inhaler brands + ₹ MRP from 1mg.com
   (e.g., Budecort, Foracort, Seroflo — Indian brands not in US guidelines)
   Time: 1 hour

3. Database:
   INSERT INTO drugs WHERE condition_tags includes "respiratory"
   INSERT INTO indian_guidelines WHERE source_id = 'ICS'
   INSERT INTO drug_interactions (e.g., beta-agonist + beta-blocker = contraindication)
   Time: 1-2 hours

4. Code changes: ZERO
   - Safety engine: already works with any condition tags
   - Prompt composer: already fetches guidelines by tag
   - UI: add patient with condition_tags: ["respiratory"]
   
Total: ~3-4 hours research + data loading. No new tables, no code changes.
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    REACT FRONTEND                       │
│  Patient Selector → Query Input → Side-by-side Output  │
└────────────────────────┬────────────────────────────────┘
                         │ POST /api/claude
┌────────────────────────▼────────────────────────────────┐
│                  NEXT.JS API LAYER                      │
│                                                         │
│  ┌─────────────────┐    ┌──────────────────────────┐   │
│  │  Safety Engine  │    │    Prompt Composer        │   │
│  │                 │    │                           │   │
│  │ • eGFR calc     │───▶│ • Fetch RSSDI/CSI rules  │   │
│  │ • DDI check     │    │ • Inject Indian drugs ₹   │   │
│  │ • HF flags      │    │ • Add safety flags        │   │
│  │ • CHA2DS2-VASc  │    │ • Apollo contacts         │   │
│  │ • Hyperkalemia  │    │ • Insurance context       │   │
│  └─────────────────┘    └──────────────┬─────────────┘  │
│                                        │                │
│  ┌─────────────────────────────────────▼─────────────┐  │
│  │              Claude API (Parallel calls)          │  │
│  │                                                   │  │
│  │  Generic prompt ─────────────── Generic response  │  │
│  │  Option C prompt (enriched) ──── India response   │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ Supabase queries
┌────────────────────────▼────────────────────────────────┐
│                   SUPABASE (PostgreSQL)                 │
│                                                         │
│  drugs ──────────────── condition_tags: JSONB array     │
│  indian_guidelines ───── source_id: RSSDI/CSI/IHRS     │
│  drug_interactions ───── cross-condition pairs          │
│  hospital_formulary ──── Apollo Chennai stock           │
│  patients ─────────────── 6 demo profiles               │
│  hospital_contacts ────── department extensions         │
└─────────────────────────────────────────────────────────┘
```

---

## Safety Engine — How It Works

The safety engine runs BEFORE the LLM is called. This means:

1. **No hallucinated drug prices** — prices come from verified Supabase rows
2. **No missed interactions** — DDI check is systematic across all medications
3. **No wrong renal dosing** — eGFR is computed fresh from creatinine
4. **Hard blocks enforced** — allergy contraindications are rule-based, not LLM-based

### Alert Priority System
```
CRITICAL → LLM told: "You MUST address this in your first paragraph"
HIGH     → LLM told: "This is a priority safety concern"
MODERATE → Included in context, LLM uses judgment
LOW      → Background context
```

### Cross-condition DDI example (Patient 6)
Patient 6 is on: Glimepiride (diabetes) + Carvedilol (cardiac HF)
The interaction pair `Glimepiride ↔ Carvedilol` is tagged `["diabetes", "cardiovascular", "heart_failure"]`
The safety engine catches this automatically — no condition-specific code needed.

---

## Prompt Composer — Context Injection

The prompt composer assembles a system prompt structured as:

```
1. ROLE + RULES (cite RSSDI not ADA, use ₹ prices)
2. PATIENT SUMMARY (labs, meds, allergies, computed eGFR)
3. SAFETY FLAGS (pre-computed — MUST address these)
4. INDIAN GUIDELINES (fetched from Supabase by condition tag)
5. DRUG DATABASE (₹ prices, NLEM status, HF safety)
6. HOSPITAL CONTACTS (Apollo Chennai extensions)
7. RESPONSE FORMAT (India-specific requirements)
```

The LLM then sees a complete Indian clinical picture BEFORE it processes the doctor's question. This is what makes Option C dramatically better than generic AI — not prompt engineering alone, but structured data injection.

---

## Why This Matters for Indian Doctors

| Generic AI problem | BRAHMO solution |
|-------------------|-----------------|
| Cites ADA (US guidelines) | RSSDI 2022 enforced by system |
| Recommends Sitagliptin | Teneligliptin (NLEM, 4x cheaper) recommended |
| No ₹ prices | Every drug shows ₹ MRP |
| Misses sulfonamide allergy + glimepiride | Safety engine hard blocks it |
| No hospital context | Apollo Chennai contacts in every response |
| Suggests Pioglitazone for DM+HF patient | CONTRAINDICATION flagged before LLM sees query |

---

*BRAHMO Version 1.0 — Assessment submission, May 2025*

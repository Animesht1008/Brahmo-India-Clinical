# Architecture Notes
## BRAHMO India Clinical AI — Option C

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

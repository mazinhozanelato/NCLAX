# Data Files Rules

## Seed Data
These JSON files are loaded by `db.js` on first app launch via `fetch()` and stored into `localStorage`. After initial seed, the app reads from localStorage exclusively.

**Important:** `fetch()` requires HTTP server — these files won't load from `file://` protocol.

## categories-config.json
NCLEX-RN exam structure. Do not change IDs — they are referenced throughout the codebase.

| Category ID | Weight |
|-------------|--------|
| `safe-effective-care` | 26% |
| `health-promotion` | 9% |
| `psychosocial-integrity` | 9% |
| `physiological-integrity` | 56% |

Subcategory IDs: `management-of-care`, `safety-infection-control`, `health-promotion-prevention`, `aging-process`, `coping-adaptation`, `psychosocial-wellbeing`, `basic-care-comfort`, `pharmacological-therapies`, `reduction-of-risk`, `physiological-adaptation`

Passing threshold: **65%**

## question-bank.json
Array of question objects. Required fields per type:

### All types
`id`, `type`, `difficulty` (easy|medium|hard), `category`, `subcategory`, `stem`, `rationale`, `tags[]`

### Source tracking fields (optional but recommended)
- `sources[]` — array of `{ name, url }` objects identifying where the question was found
- `verified` — boolean, `true` if the question was confirmed in 2+ independent sources

### Verification levels
| Level | Criteria | UI Badge |
|-------|----------|----------|
| Verified | 2+ sources | Green "Verified" |
| Single Source | 1 source | Yellow "1 Source" |
| Sample | 0 sources | Gray "Sample" |

### multiple-choice / select-all-that-apply
`options[]` with `{ id, text, isCorrect }` — MC has exactly 1 correct, SATA has 1+

### ordered-response
`options[]` with `{ id, text }` (no `isCorrect`) + `correctOrder: ["B","A","C","D"]`

### fill-in-the-blank
`correctAnswer`, `acceptableAnswers[]`, `unit` — no `options` array needed

## Validation
`models.js` validates all questions via `validateQuestion()`. Import flows use this for partial import support (skip invalid, import valid). Sources and verified fields are not validated (optional).

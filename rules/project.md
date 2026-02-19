# Project Overview

Adaptive NCLEX-RN exam simulator. Single-page vanilla JS app, no frameworks, no build step. Runs locally with `npm start` (live-server).

## Architecture
```
UI Layer (HTML/CSS/JS) → Engine Layer (Core JS Modules) → Data Layer (localStorage + JSON seeds)
```

## Tech Stack
- Vanilla HTML/CSS/JS — no frameworks, no TypeScript, no build step
- `live-server` via npm for local dev
- `localStorage` persistence, seeded from JSON on first load
- Hash routing (`#dashboard`, `#test`, etc.)
- CSS-only charts + Canvas API for trend lines
- Zero external runtime dependencies

## File Map

| File | Purpose |
|------|---------|
| `index.html` | Single page: 8 screen sections, nav, toast, modal |
| `css/styles.css` | Full theme, responsive, dark mode, print |
| `js/utils.js` | UUID, dates, formatters, shuffle, debounce |
| `js/models.js` | Schemas, validation, factory functions |
| `js/db.js` | DataStore — localStorage CRUD + in-memory cache |
| `js/question-manager.js` | QuestionBankManager — filter, search, CRUD |
| `js/test-generator.js` | TestGenerator — 4 modes |
| `js/test-session.js` | TestSession — timer, flags, crash recovery |
| `js/scoring-engine.js` | ScoringEngine — evaluation, reports |
| `js/adaptive-engine.js` | AdaptiveLearningEngine — intelligence layer |
| `js/app.js` | Router, event bus, toast/modal, 8 screen renderers |
| `data/question-bank.json` | 191 NCLEX questions with sources |
| `data/categories-config.json` | NCLEX-RN exam structure + weights |

## Script Load Order (strict)
```
utils → models → db → question-manager → test-generator
→ test-session → scoring-engine → adaptive-engine → app
```

## Screens (8)
Dashboard | Test Config | Test Taking | Results | Answer Review | Question Bank | Analytics | Settings

## Key Design Decisions
- localStorage + JSON seeds: no server needed, portable
- Hash routing: works without server config, browser back/forward
- Rolling window of 3 tests for adaptive analysis
- All-or-nothing SATA scoring (NCLEX standard)
- Wall-clock timer via `Date.now()` (no setInterval drift)
- `correctOrder` array for ordered-response questions
- 65% passing threshold

## Question Verification System
Each question has `sources[]` ({name, url}) and `verified` (boolean).
- **Verified** (green): found in 2+ independent sources
- **Single Source** (yellow): 1 source, needs cross-verification
- **Sample** (gray): original built-in, no external source

## Current State: v1.6
All features complete. 191 questions with source tracking. GitHub: mazinhozanelato/NCLAX

### Question Bank Coverage (v1.6 — 191 questions)
| Subcategory | Count | Target % |
|-------------|-------|----------|
| management-of-care | 18 | 17-23% |
| safety-infection-control | 15 | 9-15% |
| health-promotion-prevention | 15 | 6-12% |
| aging-process | 10 | part of 9% |
| coping-adaptation | 11 | part of 9% |
| psychosocial-wellbeing | 10 | part of 9% |
| basic-care-comfort | 9 | 6-12% |
| pharmacological-therapies | 33 | 12-18% |
| reduction-of-risk | 37 | 9-15% |
| physiological-adaptation | 33 | 11-17% |

### Verification Stats
- Verified (2+ sources): 122
- Single source: 59
- Sample (no source): 10

## Next Step
**v1.7.0 — Management of Care expansion (19 questions)**
- 59 single-source questions still need cross-verification
- Reduction of Risk (37), Physiological Adaptation (33), Pharmacological (33) at target
- Next: Management of Care (18 → 37), then Basic Care/Safety
- Goal: 226 total questions aligned with NCLEX weights

## TODO (future)
- Cross-verify single-source questions (59 remaining)
- Add more questions (goal: 200+)
- Server-side storage / multi-user
- Spaced repetition algorithm
- NGN question formats

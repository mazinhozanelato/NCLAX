# NCLEX-RN Prep Simulator

## Project Overview
Adaptive NCLEX-RN exam simulator. Single-page vanilla JS app, no frameworks, no build step. Runs locally with `npm start` (live-server).

## Architecture
```
UI Layer (HTML/CSS/JS) → Engine Layer (Core JS Modules) → Data Layer (localStorage + JSON seeds)
```

All modules use IIFE + `window.NCLEX` namespace. Inter-module communication via `NCLEX.Events` event bus.

## Tech Stack
- Vanilla HTML/CSS/JS (no frameworks, no TypeScript)
- `live-server` for local dev (`npm start`)
- `localStorage` for persistence, seeded from JSON on first load
- Hash routing (`#dashboard`, `#test`, etc.)
- CSS-only charts + Canvas API for trend lines (zero external libraries)

## File Structure
```
index.html                 Single page, 8 screen containers, nav, toast, modal
css/styles.css             Full theme, responsive, dark mode, print CSS
js/utils.js                UUID, dates, formatters, shuffle, debounce
js/models.js               Schemas, validation, factory functions (includes sources/verified fields)
js/db.js                   DataStore - localStorage CRUD with in-memory cache
js/question-manager.js     QuestionBankManager - filter, search, CRUD
js/test-generator.js       TestGenerator - 4 modes (standard, adaptive, focused, random)
js/test-session.js         TestSession - timer, flags, crash recovery
js/scoring-engine.js       ScoringEngine - evaluation, reports
js/adaptive-engine.js      AdaptiveLearningEngine - intelligence layer
js/app.js                  Router, event bus, toast/modal, all screen renderers
data/question-bank.json    60 NCLEX questions with sources and verification status
data/categories-config.json  NCLEX-RN exam structure + weights
```

**Script load order:** utils → models → db → question-manager → test-generator → test-session → scoring-engine → adaptive-engine → app

## Key Design Decisions
- **localStorage + JSON seeds**: simplest persistence, no server needed, portable
- **Hash routing**: works without server config, browser back/forward works
- **Rolling window of 3 tests** for adaptive: balances recency with sufficient data
- **All-or-nothing SATA scoring**: matches NCLEX standard
- **Wall-clock timer**: `Date.now()` reference, no drift from `setInterval`
- **Ordered-response** uses `correctOrder: ["B","A","C","D"]` array field
- **65% passing threshold**

## Question Verification System
Questions have `sources` (array of `{name, url}`) and `verified` (boolean) fields.
- **Verified** (green badge): found in 2+ independent sources
- **Single Source** (yellow badge): found in 1 source, needs cross-verification
- **Sample** (gray badge): original built-in questions, no external source
Sources include: Nurseslabs, RegisteredNurseRN.com, RNpedia, Kaplan, Quizlet, GoTestPrep, GoodNurse, Hurst Review, Nexus Nursing Institute, Serrari Group.

## Screens (8 total)
Dashboard | Test Config | Test Taking | Results | Answer Review | Question Bank | Analytics | Settings

## Current State (v1.1 - source verification)
All 8 phases implemented + question source tracking:
- 4 test modes working (standard, adaptive, focused, random)
- 4 question types (MC, SATA, ordered-response, fill-in-blank)
- Adaptive learning with weak area detection, study plans, readiness scoring
- Full analytics with Canvas trend charts, category mastery, pattern detection
- Crash recovery (auto-save state, resume prompt)
- Dark mode, responsive (375px-1440px), print CSS, accessibility (ARIA, skip-link, keyboard nav)
- Question verification badges (Verified/Single Source/Sample) in Question Bank UI
- Source tracking with URLs for transparency

## TODO / Future Enhancements
- Cross-verify single-source questions with additional research
- Add more questions (goal: 200+ for realistic test generation)
- Server-side storage with sync across devices
- Multi-user support
- Spaced repetition algorithm
- NGN (Next Generation) question formats (audio/video)
- PDF progress reports for instructors

## Conventions
- BEM naming for CSS classes
- `var` declarations (ES5-compatible style, but uses ES2017 features like `Object.entries`)
- Browser support: Chrome 54+, Firefox 47+, Safari 10.1+, Edge 14+
- All DataStore operations return Promises
- Event delegation on screen containers for listener cleanup

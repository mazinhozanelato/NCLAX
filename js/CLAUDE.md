# JS Module Rules

## Module Pattern
Every file uses an IIFE attaching to `window.NCLEX` namespace:
```js
(function() {
  'use strict';
  window.NCLEX = window.NCLEX || {};
  // ... module code ...
  window.NCLEX.ModuleName = { ... };
})();
```

## Load Order (strict dependency chain)
```
utils.js → models.js → db.js → question-manager.js → test-generator.js
→ test-session.js → scoring-engine.js → adaptive-engine.js → app.js
```
Never reference a module that loads after your file in this chain.

## Module Responsibilities

| Module | Namespace | Role |
|--------|-----------|------|
| `utils.js` | `NCLEX.Utils` | Pure utilities: UUID, formatDate, formatTime, formatPercent, debounce, deepClone, shuffleArray, escapeHTML, clamp, average, groupBy |
| `models.js` | `NCLEX.Models` | Schemas + validation: QUESTION_TYPES, DIFFICULTIES, SESSION_STATUSES, validateQuestion(), createQuestion/Session/Answer/UserProfile(). Questions include `sources[]` and `verified` fields for source tracking. |
| `db.js` | `NCLEX.DataStore` | localStorage CRUD with in-memory cache. All methods return Promises. Handles QuotaExceededError. Seeds from JSON on first load. |
| `question-manager.js` | `NCLEX.QuestionBankManager` | Higher-level question ops: filter, search, stats, add/remove, bulk import, export |
| `test-generator.js` | `NCLEX.TestGenerator` | 4 modes: standard (NCLEX-weighted), adaptive (weak area targeting), focused (user-selected categories), random. Graceful fallback if not enough questions. |
| `test-session.js` | `NCLEX.TestSession` | Constructor function. Timer (wall-clock via Date.now + rAF), crash recovery, answer evaluation per type, flag, pause/resume. |
| `scoring-engine.js` | `NCLEX.ScoringEngine` | evaluateTest (full breakdown), compareWithPrevious, generateReport (narrative), calculateCumulativeStats |
| `adaptive-engine.js` | `NCLEX.AdaptiveLearningEngine` | analyzePerformance (rolling window), calculateCategoryPriority, generateStudyPlan, getNextTestRecommendation, detectPatterns, getReadinessScore |
| `app.js` | `NCLEX.App`, `NCLEX.Events`, `NCLEX.Toast`, `NCLEX.Modal` | Router, event bus, toast/modal systems, all 8 screen renderers, theme management |

## Conventions
- Use `var` (not let/const) for consistency with existing code
- All async operations via Promises (not async/await)
- ES2017 features allowed: `Object.entries()`, `Object.values()`, `Array.from()`, `.find()`
- Event delegation on screen container elements, not individual elements
- Screen renderers named `renderScreenName()` in app.js
- Test session instance stored as `activeTestSession` local var in app.js

## Question Type Evaluation Rules
- **MC**: single option, compare against `isCorrect: true` option
- **SATA**: all-or-nothing, must match exact set of correct options
- **Ordered Response**: compare `orderedAnswer` array against `correctOrder` array position-by-position
- **Fill-in-blank**: case-insensitive match against `correctAnswer` + `acceptableAnswers` array

## Adaptive Algorithm
- Tests 1-4: cumulative analysis of all tests
- Tests 5+: rolling window, analyze only last 3
- Weak < 70%, Critical < 50%
- Adaptive distribution: 50% weak/critical, 30% standard, 20% untested
- Priority = (100 - accuracy) * nclexWeight * recencyFactor, 2x for critical

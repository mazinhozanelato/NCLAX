# NCLEX-RN Prep Simulator

Adaptive NCLEX-RN exam simulator. Vanilla JS SPA, no frameworks. `npm start` to run.

## Quick Reference
- **Modules**: IIFE + `window.NCLEX` namespace, `var` only, Promises only
- **Load order**: utils → models → db → question-manager → test-generator → test-session → scoring-engine → adaptive-engine → app
- **Routing**: hash-based (`#dashboard`, `#test`, etc.)
- **Data**: localStorage, seeded from `data/*.json` on first load
- **CSS**: BEM naming, CSS custom properties, dark mode via `data-theme`
- **Questions**: 146 with `sources[]` and `verified` fields for double-check tracking

## Rules (detailed)
- `rules/project.md` — architecture, file map, design decisions, state
- `rules/javascript.md` — module pattern, conventions, evaluation rules, adaptive algorithm
- `rules/data.md` — JSON formats, category IDs, validation
- `rules/styles.md` — theme tokens, BEM classes, breakpoints, components
- `rules/update-workflow.md` — **question research update process** (read this first when user asks to update questions)

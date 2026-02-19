# NCLEX-RN Prep Simulator

An adaptive NCLEX-RN exam simulator designed to help nursing students prepare for the real exam using verified practice questions sourced from authoritative nursing education platforms.

## Educational Proposal

This program was built with one clear objective: **provide nursing students with a realistic, high-quality study tool that mirrors the actual NCLEX-RN exam experience.**

The NCLEX-RN (National Council Licensure Examination for Registered Nurses) is the standardized exam that every nursing graduate must pass to obtain their nursing license. Preparing for this exam requires extensive practice with questions that reflect real clinical scenarios, proper nursing prioritization frameworks (ABCs, Maslow's hierarchy), and evidence-based nursing practice.

### What makes this simulator effective:

- **Real exam question formats** - Multiple Choice, Select All That Apply (SATA), Ordered Response, and Fill-in-the-Blank, matching the actual NCLEX-RN format
- **Adaptive learning** - The system analyzes your performance patterns and targets your weak areas, just like the real CAT (Computerized Adaptive Testing) approach
- **NCLEX-weighted categories** - Questions are distributed according to the official NCLEX-RN test plan: Physiological Integrity (56%), Safe and Effective Care (26%), Health Promotion (9%), and Psychosocial Integrity (9%)
- **Immediate feedback with rationale** - Every question includes a detailed rationale explaining why the correct answer is right and why the other options are wrong
- **Performance tracking** - Track your progress across categories, identify trends, and receive a readiness score

## Question Verification System

All practice questions in this simulator are sourced from established nursing education platforms through deep research. To ensure quality, we implemented a **double-check verification system**:

### Verification Levels

| Badge | Meaning | Description |
|-------|---------|-------------|
| **Verified** (green) | Double-checked | Question and answer were found and confirmed across 2 or more independent sources |
| **1 Source** (yellow) | Single source | Question was sourced from one authoritative platform and needs cross-verification |
| **Sample** (gray) | Built-in sample | Original sample question based on standard NCLEX nursing knowledge |

### How it works

1. Questions are researched from multiple authoritative nursing education websites
2. Each question stores its source(s) with the original URL for transparency
3. When the same question (or its core clinical concept and correct answer) appears in 2+ independent sources, it receives the **Verified** badge
4. Single-source questions are flagged for future cross-verification

### Sources used

Questions were researched from the following platforms:
- RegisteredNurseRN.com
- Nurseslabs.com
- RNpedia.com
- Kaplan Test Prep
- Hurst Review
- Quizlet (NCLEX study sets)
- GoodNurse.com
- GoTestPrep.com
- Nexus Nursing Institute
- Serrari Group

### Important Disclaimer

While we implement a rigorous double-check verification process to ensure question accuracy, **we cannot guarantee the total veracity of every question** found through deep research. Nursing guidelines and best practices evolve, and exam content may change. This tool is meant to **supplement** your NCLEX preparation, not replace official study materials, nursing textbooks, or guidance from your nursing program instructors.

**Always cross-reference with your nursing textbooks and the latest NCSBN (National Council of State Boards of Nursing) test plan.**

## How to Run

```bash
npm install
npm start
```

Then open http://localhost:3000 in your browser.

**Note:** The app uses `fetch()` to load seed data on first run, so it must be served via HTTP (not opened as a `file://` URL).

## Features

- **4 Test Modes:** Standard (NCLEX-weighted), Adaptive (targets weak areas), Focused (category-specific), Random
- **4 Question Types:** Multiple Choice, Select All That Apply, Ordered Response, Fill in the Blank
- **Adaptive Learning:** Analyzes performance patterns, recommends study areas, tracks readiness
- **Performance Analytics:** Score trends, category mastery, difficulty breakdown, pattern detection
- **Question Bank:** Add, edit, delete, bulk import/export questions via JSON with source verification badges
- **Crash Recovery:** Auto-saves test state, resumes after browser crash
- **Timer:** Wall-clock based (no drift), configurable time limits with warnings
- **Dark Mode:** Toggle in Settings
- **Responsive:** Works on mobile (375px+), tablet, and desktop
- **Print CSS:** Print-friendly results pages

## Adding Questions

Questions are stored in `data/question-bank.json`. You can also add them through the UI (Question Bank > Add Question or Import JSON).

### JSON Format

```json
{
  "id": "q100",
  "type": "multiple-choice",
  "difficulty": "medium",
  "category": "physiological-integrity",
  "subcategory": "pharmacological-therapies",
  "stem": "Your question text here?",
  "options": [
    { "id": "A", "text": "Option A text", "isCorrect": false },
    { "id": "B", "text": "Option B text", "isCorrect": true },
    { "id": "C", "text": "Option C text", "isCorrect": false },
    { "id": "D", "text": "Option D text", "isCorrect": false }
  ],
  "rationale": "Explanation of the correct answer.",
  "tags": ["pharmacology", "cardiac"],
  "sources": [
    { "name": "Source Name - Page Title", "url": "https://example.com" }
  ],
  "verified": false
}
```

### Question Types

| Type | Format |
|------|--------|
| `multiple-choice` | Single correct option (`isCorrect: true`) |
| `select-all-that-apply` | Multiple correct options |
| `ordered-response` | Add `correctOrder: ["B","A","C","D"]` array |
| `fill-in-the-blank` | Add `correctAnswer`, `acceptableAnswers`, `unit` fields |

### Categories (NCLEX-RN Test Plan)

| ID | Name | Weight |
|----|------|--------|
| `safe-effective-care` | Safe and Effective Care Environment | 26% |
| `health-promotion` | Health Promotion and Maintenance | 9% |
| `psychosocial-integrity` | Psychosocial Integrity | 9% |
| `physiological-integrity` | Physiological Integrity | 56% |

## Architecture

```
index.html          Single page with 8 screen containers
css/styles.css      Full theme with CSS custom properties
js/utils.js         UUID, formatters, shuffle, debounce
js/models.js        Data schemas and validation
js/db.js            localStorage CRUD with in-memory cache
js/question-manager.js  Question filtering, search, CRUD
js/test-generator.js    4 test generation modes
js/test-session.js      Timer, crash recovery, answer evaluation
js/scoring-engine.js    Test evaluation and reports
js/adaptive-engine.js   Performance analysis and recommendations
js/app.js           Router, event bus, screen renderers
data/               JSON seed files (questions + categories)
```

All modules use the Revealing Module Pattern (IIFE) attached to `window.NCLEX`. No frameworks, no build step, no external dependencies.

## Data Storage

All data is stored in `localStorage`. First launch seeds from JSON files. Use Settings > Export to back up your data.

## Browser Support

Modern browsers: Chrome 54+, Firefox 47+, Safari 10.1+, Edge 14+.

## License

Educational use. Questions are sourced from public nursing education resources for study purposes.

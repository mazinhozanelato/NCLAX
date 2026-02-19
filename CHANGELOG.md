# Question Bank Changelog

Track of all question research updates, including sources, verification, and coverage.

---

## [v1.3.0] - 2026-02-19

### Summary
Targeted research update focusing on Health Promotion and Psychosocial Integrity coverage gaps identified in v1.2.0. Aging Process and Psychosocial Well-being subcategories were more than doubled, while Coping/Adaptation and Health Promotion/Prevention received significant expansion.

### Questions Added: 24 (q095–q118)
| Category | Count |
|----------|-------|
| Health Promotion — Prevention | 7 |
| Health Promotion — Aging/Development | 7 |
| Psychosocial Integrity — Coping/Adaptation | 5 |
| Psychosocial Integrity — Psychosocial Well-being | 5 |

### Question Types Added
- Multiple Choice: 19
- Select All That Apply (SATA): 4
- Ordered Response: 1

### Verification
- Verified (2+ independent sources): 20
- Single source: 4 (q107, q108, q111, q116)
- Total sources used: 6

### Sources Used
- Nurseslabs.com
- RegisteredNurseRN.com
- RNpedia.com
- Naxlex.com
- Quizlet (NCLEX study sets)
- NCBI/NLM (ncbi.nlm.nih.gov)

### Coverage Improvements (before → after)
| Subcategory | Before | After | Target % |
|-------------|--------|-------|----------|
| Health Promotion/Prevention | 8 | 15 | 6-12% |
| Aging/Development | 3 | 10 | part of 9% |
| Coping/Adaptation | 6 | 11 | part of 9% |
| Psychosocial Well-being | 5 | 10 | part of 9% |

### Remaining Coverage Notes
- All subcategories now have 9+ questions
- Health Promotion and Psychosocial categories now well-represented
- Next priority: cross-verify single-source questions and continue expanding toward 200+ total

### Notes
- Fixed q095–q101 verified flags (agent had set all to false; corrected based on independent source domains)
- Verified flag set based on independent source domains (same site, different pages = 1 source)

---

## [v1.2.0] - 2026-02-18

### Summary
Focused research update targeting Physiological Integrity coverage gaps identified in v1.1.0. All four Physiological Integrity subcategories were significantly expanded.

### Questions Added: 34 (q061–q094)
| Category | Count |
|----------|-------|
| Physiological Integrity — Pharmacological Therapies | 10 |
| Physiological Integrity — Basic Care & Comfort | 8 |
| Physiological Integrity — Reduction of Risk | 8 |
| Physiological Integrity — Physiological Adaptation | 8 |

### Question Types Added
- Multiple Choice: 24
- Select All That Apply (SATA): 7
- Ordered Response: 1
- Fill-in-the-Blank: 1

### Verification
- Verified (2+ independent sources): 26
- Single source: 8 (q062, q063, q064, q065, q069, q090, q092, q094)
- Total sources used: 6

### Sources Used
- RegisteredNurseRN.com
- RNpedia.com
- Nurseslabs.com
- Naxlex.com
- Quizlet (NCLEX study sets)

### Coverage Improvements (before → after)
| Subcategory | Before | After | Target % |
|-------------|--------|-------|----------|
| Pharmacological Therapies | 2 | 12 | 12-18% |
| Basic Care & Comfort | 1 | 9 | 6-12% |
| Reduction of Risk | 1 | 9 | 9-15% |
| Physiological Adaptation | 1 | 9 | 11-17% |

### Remaining Coverage Notes
- Physiological Integrity now well-represented across all subcategories
- Safe & Effective Care and Psychosocial categories remain stable from v1.1.0
- Health Promotion categories could benefit from future expansion

### Notes
- Fixed q077 type from multiple-choice to select-all-that-apply (stem asks "Select all that apply")
- Fixed q092 to use proper fill-in-the-blank format (correctAnswer/acceptableAnswers/unit)
- Verified flag set based on independent source domains (same site, different pages = 1 source)

---

## [v1.1.0] - 2026-02-18

### Summary
Initial question research and source verification system implementation.

### Questions Added: 50 (q011–q060)
| Category | Count |
|----------|-------|
| Safe and Effective Care — Management of Care | 18 |
| Safe and Effective Care — Safety/Infection Control | 15 |
| Psychosocial Integrity — Coping/Adaptation | 6 |
| Psychosocial Integrity — Psychosocial Well-being | 5 |
| Health Promotion — Prevention | 8 |
| Health Promotion — Aging/Development | 3 |

### Question Types Added
- Multiple Choice: 43
- Select All That Apply (SATA): 4
- Ordered Response: 2
- Fill-in-the-Blank: 1

### Verification
- Verified (2+ sources): 3 (q031, q034, q050)
- Single source: 47
- Total sources used: 10

### Sources Used
- Nurseslabs.com
- RegisteredNurseRN.com
- RNpedia.com
- Kaplan Test Prep
- Hurst Review
- Quizlet (NCLEX study sets)
- GoodNurse.com
- GoTestPrep.com
- Nexus Nursing Institute
- Serrari Group

### Coverage Gaps Identified
- Physiological Integrity — Basic Care & Comfort: 1 question only
- Physiological Integrity — Pharmacological Therapies: 1 question only
- Physiological Integrity — Reduction of Risk: 1 question only
- Physiological Integrity — Physiological Adaptation: 1 question only

### Notes
- Original 10 sample questions (q001–q010) have no external source (marked as "Sample")
- Source verification system added: `sources[]` and `verified` fields on every question
- UI badges added to Question Bank screen (Verified / 1 Source / Sample)

---

## [v1.0.0] - 2026-02-18

### Summary
Initial release with 10 sample questions covering all 4 NCLEX categories.

### Questions: 10 (q001–q010)
- Multiple Choice: 6
- SATA: 2
- Ordered Response: 1
- Fill-in-the-Blank: 1

### Notes
- Sample questions written from standard NCLEX nursing knowledge
- No external source tracking (pre-verification system)

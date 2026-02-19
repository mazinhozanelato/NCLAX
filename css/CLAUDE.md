# CSS Rules

## Theme System
All colors, spacing, and sizing use CSS custom properties defined in `:root` / `[data-theme="light"]`. Dark mode overrides in `[data-theme="dark"]`.

Key tokens:
- `--color-primary`: #1a73e8 (blue, medical theme)
- `--color-success/warning/error`: semantic colors
- `--color-bg/surface/border/text`: layout colors
- `--space-xs/sm/md/lg/xl/2xl`: spacing scale (4px-48px)
- `--radius-sm/md/lg/xl/full`: border radius scale
- `--font-size-xs` through `--font-size-3xl`

## Naming Convention
**BEM**: `.block__element--modifier`
- `.nav__link--active`, `.option-card--selected`, `.btn--primary`
- `.bar-chart__fill--green`, `.toast--success`

## Responsive Breakpoints
- Mobile: `< 768px` — bottom nav, single column, smaller text
- Tablet: `768px - 1024px`
- Desktop: `> 1024px` — top nav, multi-column layouts
- Large: `> 1440px` — wider content area
- Touch targets: minimum 44x44px

## Key Component Classes
- `.screen` / `.screen--active`: page containers, show/hide with fade animation
- `.card`, `.card--clickable`, `.card--info/success/warning/error`: content cards
- `.btn--primary/secondary/danger/ghost`, `.btn--sm/lg/full`: buttons
- `.stat-card`: numeric stat display
- `.bar-chart__item/label/track/fill/value`: CSS-only horizontal bar charts
- `.progress-ring`: conic-gradient circular gauge
- `.option-card / .ordered-option`: test question option UI
- `.question-nav__item`: color-coded question navigator grid
- `.toast-container / .toast--type`: notification toasts (slide-in from right)
- `.modal-overlay / .modal`: dialog system

## Dark Mode
Toggle via `data-theme="dark"` on `<html>`. Controlled in Settings, persisted in localStorage.

## Print
`@media print` hides nav, toasts, modals, buttons. Forces white background, black text.

## No External Libraries
All charts are CSS (bar charts with flexbox) or Canvas API (score trend line in analytics). Zero dependencies.

# UI Overhaul Plan (Liquid Glass)

## Skills Reviewed
- **frontend-design**: Commit to a bold Liquid Glass aesthetic, distinct typography, and intentional visual detail.
- **web-design-guidelines**: Preserve accessibility (contrast, focus, motion safety, touch targets).
- **vercel-react-best-practices**: Keep changes performant and avoid bundle bloat.

## Goals
- Deliver a cohesive Liquid Glass system across all surfaces.
- Preserve existing behavior and state management (keep `darkMode` branching).
- Remove `BedtimeDial` while keeping bedtime control in the header popover.
- Ship in reviewable phases with TDD and manual QA breaks.

---

## Phase 1 — Foundations + Modal
**TDD (tests first)**
- `src/components/modals/Modal.test.js`: renders title/content, overlay click closes, Escape closes.

**Implementation**
- Add design tokens to `tailwind.config.js`.
- Create `src/styles/glass.css` with glass utilities and glows.
- Import glass styles in `src/index.css` and set base backgrounds.
- Update `src/components/modals/Modal.jsx` to 20px radius + glass backdrop.

**Manual Break**
- You run the app and confirm modal/backdrop look and behavior.

---

## Phase 2 — Navigation Overhaul
**TDD (tests first)**
- `src/components/FloatingNavPill.test.js`: Home/History/Stats handlers fire; Add opens modal.

**Implementation**
- Add `src/components/FloatingNavPill.jsx`.
- Update `src/components/NavButton.jsx` for pill layout + active states.
- Remove FAB + old bottom nav from `src/components/CaffeineCalculator.jsx`.

**Manual Break**
- You verify nav layout, add button, and spacing above the toast area.

---

## Phase 3 — Core Cards & Surfaces
**TDD (tests first)**
- `src/components/CaffeineStatusIndicator.test.js`: renders status + caffeine value.
- `src/components/SleepReadinessIndicator.test.js`: readiness state label renders.
- `src/components/IntakeItem.test.js`: remove action fires.
- `src/components/RangeSelector.test.js`: active selection updates UI.

**Implementation**
- Apply glass + radius tokens to the components above.

**Manual Break**
- You validate card styles, list items, and range selector feel.

---

## Phase 3.5 — Sleep Readiness Simplification (Home)
**TDD (tests first)**
- `src/components/SleepReadinessIndicator.test.js`: remove status icon/label; projected caffeine tile remains.

**Implementation**
- Remove green/yellow/red readiness indicator in the header area on the Home card.
- Remove the “Caffeine still active” / “Ready for sleep” status line.
- Keep the projected caffeine tile color as the single readiness cue.
- Refine spacing/typography so the Home card reads as a professional status summary.

**Manual Break**
- You verify sleep readiness reads cleanly without status color chips.

---

## Phase 4 — Modals + Time Selection
**TDD (tests first)**
- `src/components/modals/AddIntakeForm.test.js`: switch time modes, custom date/time set.
- `src/components/BedtimePopover.test.js`: open/close and custom time update.

**Implementation**
- Redesign `AddIntakeForm` time picker per segmented control layout.
- Apply glass styles to `SettingsModal`, `InfoModal`, and `BedtimePopover`.
- Remove `src/components/BedtimeDial.jsx` and any unused imports.

**Manual Break**
- You test time selection flows and bedtime popover in the header.

---

## Phase 5 — Chart + Polish
**TDD (tests first)**
- `src/components/CaffeineChart.test.js`: legend labels and limit input behavior.

**Implementation**
- Update chart accent colors and glass tooltip.
- Final polish pass: focus rings, motion safety, OLED background consistency.
- Optional: run web-interface-guidelines review for accessibility.

**Manual Break**
- You confirm final visuals and interactions before merge.

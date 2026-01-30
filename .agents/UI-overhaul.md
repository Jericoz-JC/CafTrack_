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

## Phase 2.1 — Add Button Layout
**TDD (tests first)**
- `src/components/CaffeineCalculator.test.js`: FAB remains reachable above bottom nav and opens add modal.

**Implementation**
- Keep the existing bottom nav and right-side FAB.
- Keep the FAB aligned to the screen edge on mobile and desktop.
- Ensure spacing above the bottom nav and undo toast remains consistent.

**Manual Break**
- You confirm the FAB alignment on mobile/desktop and that it clears the undo toast.

---

## Phase 2.2 — Universal Glass Materials (iOS-style)
**Design Input**
- Reference Apple Materials/HIG translucency patterns (subtle, low-contrast glow, consistent blur). Add Caffeine Intake modal is the quality bar.

**TDD (tests first)**
- No new functional tests; visual-only changes (snapshot tests optional if desired).

**Implementation**
- Rework `src/styles/glass.css` to a single, universal material:
  - Reduce the top-left light source; avoid prismatic streaks.
  - Use consistent blur + light edge stroke across all surfaces.
  - Keep glow minimal and even; remove heavy shadow stacking.
- Normalize usage: replace mixed `glass-surface`/`glass-surface-strong` with a single `glass-surface` across cards, popovers, and modals.
- Tune `glass-backdrop` for a softer dim without heavy tint.
- Align modal/popover and card backgrounds to a polished, understated look.

**Manual Break**
- You run the app and verify the material feels consistent across stacked cards and the Add Intake modal.

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
- Normalize modal interior surfaces (inputs, list rows, callouts) to the new glass material.

**Manual Break**
- You test time selection flows and bedtime popover in the header.

---

## Phase 5 — Color System + Chart + Polish
**TDD (tests first)**
- `src/components/CaffeineChart.test.js`: legend labels and limit input behavior.

**Implementation**
- Update accent palette to align with the softened glass material.
- Unify status colors (reduce harsh green/yellow/red) across cards and chips.
- Update chart accent colors and glass tooltip.
- Final polish pass: focus rings, motion safety, OLED background consistency.
- Optional: run web-interface-guidelines review for accessibility.

**Manual Break**
- You confirm final visuals and interactions before merge.

---

## Phase 5.1 — Consistency Sweep (Surfaces)
**Targets**
- `AddIntakeForm` inner panels, inputs, list rows, and buttons.
- `SettingsModal` form fields and callout blocks.
- `InfoModal` footnote callout.
- Header controls, bottom nav buttons, and undo toast.
- History empty states.
- `BedtimePopover` trigger + preset buttons.
- `CaffeineChart` inputs/legend panels.

**Manual Break**
- You confirm all high-traffic UI surfaces feel unified and professional.

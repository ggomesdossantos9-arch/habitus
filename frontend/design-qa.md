# Design QA — Habitus Fase 2

- Source visual truth: `frontend/design-reference-journey-guided.png`
- Implementation URL: `http://127.0.0.1:4173/qa/dashboard.html`
- Implementation screenshot: unavailable
- Intended viewport: 1440 × 1024
- State: authenticated, light theme, empty first-use dashboard

## Full-view comparison evidence

The source visual was opened and inspected at original resolution. The Vite server is running, but the implementation could not be captured: `agent-browser` is not installed, and downloading/executing it through npm was denied by the environment's security reviewer.

Without a rendered implementation screenshot, a side-by-side comparison cannot be produced. Code inspection is not a substitute for visible evidence.

## Focused region comparison evidence

Blocked for the same reason. The intended focused regions are:

- sidebar/logo/active navigation;
- header/theme control/user identity;
- guided three-step journey and primary CTA;
- empty KPI row;
- 320 px mobile drawer and 768 px layout;
- dark theme.

## Findings

- [P0] Rendered evidence is unavailable.
  - Location: complete implementation.
  - Evidence: source visual exists; implementation screenshot does not.
  - Impact: typography, spacing, color, icon scale, responsive behavior and polish cannot receive a truthful visual pass.
  - Fix: explicitly authorize installing/running `agent-browser`, then capture the same state at 1440 × 1024 and mobile breakpoints.

## Patches made before this QA pass

- Routes aligned under `/app`.
- Password validation aligned with bcrypt's 72-byte limit.
- Password visibility controls added.
- Pre-paint dark theme initialization added.
- Mobile drawer gained Escape handling, scroll lock, focus entry and inert closed state.
- Sidebar preference persistence and skip link added.
- Profile invalid-date fallback added and out-of-scope identifier removed.
- Selected visual reference copied into the project.

## Required fidelity surfaces

- Fonts and typography: blocked pending implementation capture.
- Spacing and layout rhythm: blocked pending implementation capture.
- Colors and visual tokens: token mapping reviewed statically; visible result blocked.
- Image quality and asset fidelity: source contains no raster content required by runtime; icons use Phosphor. Visible result blocked.
- Copy/content: reviewed statically and aligned with the selected direction.

## Implementation checklist

- Capture desktop authenticated empty dashboard at 1440 × 1024.
- Capture login, registration, profile, mobile drawer and dark mode.
- Compare source and implementation in one combined visual.
- Fix all P0/P1/P2 differences and repeat.

final result: blocked

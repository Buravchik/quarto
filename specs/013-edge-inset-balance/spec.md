# Feature Specification: Edge inset balance

**Feature Branch**: `cursor/edge-inset-balance-3515` (feature id `013-edge-inset-balance`)

**Created**: 2026-11-20

**Status**: Clarified (ready for plan)

**Input**: On phone and tablet in the Telegram Mini App, the left content edge looks fine but the right edge has content almost flush against the screen.

## Clarifications (encoded 2026-11-20)

- **Q1 — Scope**: Horizontal inset balance for the Mini App shell (`.ex-app`), all screens (lobby + play), not only waiting chrome.
- **Q2 — Cause class**: Treat as missing Telegram/content safe-area + insufficient trailing gutter (and possible overflow), not a one-off component bug.
- **Q3 — Symmetry**: Target equal *comfortable* inset from content to the visible left/right edges (safe-area aware), not literally identical CSS numbers ignoring insets.
- **Q4 — Behavior**: Presentation-only; no engine/API/DB.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Balanced side gutters (Priority: P1)

On phone/tablet Mini App, content keeps a clear gap from both left and right screen edges.

**Why this priority**: User-reported live UX defect on real devices.

**Independent Test**: Open lobby and waiting play on phone-width; right edge of surfaces/buttons not flush.

**Acceptance Scenarios**:

1. **Given** Mini App on phone or tablet, **When** viewing lobby, **Then** left and right gutters both look comfortable (right not flush).
2. **Given** waiting/play chrome, **When** viewing, **Then** status/actions and board respect the same shell gutters.

### Edge Cases

- Devices with non-zero `safe-area-inset-*` / Telegram content safe area.
- Scrollable content: scrollbar must not make the right side appear flush by eating the only gutter.

## Requirements *(mandatory)*

- **FR-001**: Shell MUST pad with base horizontal gutter plus Telegram/content and env safe-area insets on both sides.
- **FR-002**: Viewport MUST use `viewport-fit=cover` so safe-area env vars apply in expanded Mini App.
- **FR-003**: Shell MUST avoid horizontal overflow that clips or steals the trailing gutter.
- **FR-004**: No rule/engine/API changes.

## Success Criteria *(mandatory)*

- **SC-001**: On phone/tablet, right-edge content is no longer flush; gutter reads similar to the left.
- **SC-002**: Spec Kit artifacts complete; constitution VIII presentation-only.

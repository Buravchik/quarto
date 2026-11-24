# Feature Specification: Less chrome (rules + declare)

**Feature Branch**: `cursor/020-less-chrome-3515` (feature id `020-less-chrome`)

**Created**: 2026-11-24

**Status**: Clarified

## Clarifications

- **Session rules in ? panel = B**: If Miss=Persistent and Pie off and declare hints off → omit entire «Session rules» block. Otherwise list only non-defaults / enabled items (no «off» rows). Void Miss always listed when active; Pie/hints only when on.
- **Declare banner**: Collapsed by default. When declare is legal, show a single **Declare Quarto** control; tapping it expands selection chrome (line prompt, 0/4, confirm). Collapsing clears selection. Board declare taps / hints only while expanded.

## Requirements

- **FR-001**: RulesPanel session section per B above.
- **FR-002**: Declare UI collapsed until the special button; expand reveals existing banner + selection.
- **FR-003**: No engine/API changes.

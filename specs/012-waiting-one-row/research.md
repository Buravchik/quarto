# Research: Waiting one-row chrome

## R1 — Same surface vs stacked rows

- **Decision**: Put actions inside the waiting status surface (`.ex-waiting-head`), one flex row with headline.
- **Rationale**: User asked for one line; a second `ex-actions-row` under the pill still reads as two bands.
- **Alternatives**: Keep two rows with smaller gap — rejected (fails “одна строка”).

## R2 — Join path

- **Decision**: Mirror seat0 wait with Join + Replay in the same surface row.
- **Rationale**: Spec 007 consistency; avoids join-only stacking.

## R3 — Narrow width

- **Decision**: Headline `min-width: 0` + ellipsis; icons stay fixed size on the trailing edge.
- **Rationale**: Prefer truncating status text over wrapping actions under the headline.

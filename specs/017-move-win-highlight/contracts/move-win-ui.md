# Contract: move + win UI

## Snapshot additions

```json
{
  "lastPlacedCell": 14,
  "lastPlacerSeat": 1,
  "outcome": {
    "type": "win",
    "winnerSeat": 1,
    "declaredSet": [12, 13, 14, 15]
  }
}
```

- `lastPlacerSeat`: `0 | 1 | null` (null when never placed).
- Win chrome requires `outcome.type === "win"` and non-empty `declaredSet`.

## Shared traits (client/pure)

Input: board, declaredSet, modules → ordered list of i18n label keys (all shared traits). Empty list only if set is not a Quarto (should not happen for validated declare).

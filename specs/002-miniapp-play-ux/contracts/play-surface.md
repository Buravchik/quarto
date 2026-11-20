# Contract: Play surface state (UI)

**Scope**: Client-derived viewer prompts. HTTP session/intent contracts remain [001 miniapp-api](../../001-classic-telegram-1v1/contracts/miniapp-api.md).

## derivePlaySurfaceState(input) → PlaySurfaceState

### Input

| Field | Source |
|-------|--------|
| `status`, `phase`, `turnSeat`, `pieceInHand`, `seat0`, `seat1`, `outcome`, `pieRule` | Session snapshot |
| `viewerTelegramUserId` | Telegram WebApp user id |
| `lang` | `ru` \| `en` |

### Output (normative fields)

| Field | Values |
|-------|--------|
| `expectedAction` | `give` \| `place` \| `wait` \| `pie_choice` \| `finished` \| `join` \| `none` |
| `isMyTurn` | boolean |
| `headlineKey` | i18n key for plain-language prompt |
| `primaryCta` | `{ key, enabled, intentHint }` or null |
| `showGiveControls` | boolean |
| `showPlaceControls` | boolean |
| `showPieControls` | boolean |
| `showDeclareControls` | boolean |
| `handEmphasis` | boolean — true when viewer must place and hand is set |

### Normative mapping (classic phases)

| Condition | expectedAction | Primary controls |
|-----------|----------------|------------------|
| `status=finished` | `finished` | Rematch (as today); moves off |
| `status=waiting`, viewer seated, opponent missing | `wait` | Share / copy link |
| `status=waiting`, viewer not seated | `join` | Join |
| Pie awaiting choice, viewer is chooser | `pie_choice` | Take / Pass only |
| Pie awaiting choice, other | `wait` | none primary |
| `phase=select_give`, viewer == turnSeat | `give` | Pool select + Give |
| `phase=place_received`, viewer == turnSeat | `place` | Empty cells + hand highlight |
| Otherwise during active | `wait` | Declare secondary if legal UI allows |

### Invariants

1. MUST NOT enable Give and Place as primary at the same time.
2. MUST NOT present Join to an already-seated creator.
3. Headline MUST be localized plain language (no raw `select_give` as sole copy).
4. Derivation MUST NOT call the engine to invent new phases — snapshot only.

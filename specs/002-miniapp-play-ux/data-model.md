# Data Model: 002-miniapp-play-ux

Presentation-layer entities only. **No database schema changes.** Session/engine entities from [001 data-model](../001-classic-telegram-1v1/data-model.md) remain authoritative.

## Entities

### TraitChannel

Named visual encoding slot used by the piece renderer.

| Field | Notes |
|-------|--------|
| `id` | Stable id: `tone` \| `stature` \| `plan` \| `aperture` (classic4); future packs may add ids |
| `bitIndex` | Index into module `pieceSet.traits` bitmask (0..traitCount-1) |
| `falseLabel` / `trueLabel` | Human labels for a11y / tests (RU/EN via i18n keys) |
| `encode(value: 0\|1)` | Maps bit → channel params (height scale, outline kind, aperture on/off, tone light/dark) |

**Validation**: Each bit index used at most once per module map; all classic4 bits 0..3 must be mapped.

### ModuleChannelMap

| Field | Notes |
|-------|--------|
| `moduleId` | e.g. `classic4` |
| `channels` | Ordered `TraitChannel[]` (length = traitCount for that module) |

classic4 default map (see [research R3](./research.md)):

| bitIndex | channel | false | true |
|----------|---------|-------|------|
| 0 | tone | dark | light |
| 1 | stature | short | tall |
| 2 | plan | square | round |
| 3 | aperture | solid | hollow |

*(Bit polarity follows existing `classic4` bitmask in engine; renderer must match engine bits, not invent a second numbering.)*

### PieceAppearance

Runtime view of one piece for pool/hand/board.

| Field | Notes |
|-------|--------|
| `pieceId` | Opaque id from engine (`p0`…`pf`) |
| `moduleId` | Active module |
| `channels` | Resolved channel params from bitmask |
| `size` | `sm` \| `md` \| `lg` (pool / board / hand) |
| `emphasis` | `none` \| `selected` \| `inHand` |

**Validation**: Missing pieceId or unknown module → do not invent traits; show safe fallback + log in tests.

### PlaySurfaceState

Derived (not stored) viewer summary from session snapshot + viewer telegram user id.

| Field | Notes |
|-------|--------|
| `sessionStatus` | `waiting` \| `pie` \| `active` \| `finished` (from snapshot) |
| `viewerSeat` | `0` \| `1` \| `null` (spectator / not seated) |
| `expectedAction` | `give` \| `place` \| `wait` \| `pie_choice` \| `declare_available` \| `finished` \| `join` \| `none` |
| `isMyTurn` | boolean |
| `pieceInHandId` | string \| null |
| `primaryCta` | i18n key + enabled flag for Expressive emphasis |
| `headlineKey` | Plain-language prompt key (RU/EN) |

**Derivation rules (summary)**:

- Finished → `finished`
- Waiting, viewer is seat0, seat1 empty → `wait` (share); stranger → `join`
- Pie phase, viewer is chooser → `pie_choice`; else `wait`
- `select_give` + my turn → `give`; else `wait`
- `place_received` + my turn → `place`; else `wait`
- Declare is always available as secondary when rules allow; does not replace give/place as primary

### ExpressiveTheme

| Field | Notes |
|-------|--------|
| `scheme` | `light` \| `dark` (default from Telegram `colorScheme`, fallback dark) |
| `colorRoles` | CSS vars: surface, on-surface, primary, secondary/amber, outline, danger |
| `shapeRoles` | corner tokens: none, sm, md, lg, xl, emphasized (asymmetric allowed) |
| `motionRoles` | spring presets: emphasized, standard, fade; reduced-motion = short fade / none |

## State transitions

None at persistence layer. PlaySurfaceState recomputes on every session snapshot refresh. PieceAppearance recomputes when pool/board/hand ids change.

## Relationships

```text
GameModule.pieceSet.traits ──► ModuleChannelMap ──► PieceAppearance ──► PieceToken (UI)
MatchSession snapshot + viewerId ──► PlaySurfaceState ──► GamePanel copy / CTA
ExpressiveTheme ──► app shell, lobby, board chrome
```

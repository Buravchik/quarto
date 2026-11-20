# Contract: Piece visual encoding (UI)

**Scope**: Presentation only. Does not change HTTP OpenAPI from 001.

## PieceToken

| Input | Type | Notes |
|-------|------|--------|
| `pieceId` | string | Engine opaque id |
| `moduleId` | string | Default `classic4` when session modules empty |
| `size` | `sm` \| `md` \| `lg` | Pool / board / hand |
| `emphasis` | `none` \| `selected` \| `inHand` | Selection & hand highlight |
| `decorative` | boolean | If true, omit interactive button semantics (lobby preview) |

**Output**: SVG (or SVG-in-button) that encodes all mapped channels for that piece. MUST expose testable attributes, e.g.:

- `data-piece-id`
- `data-channel-tone` = `light` \| `dark`
- `data-channel-stature` = `tall` \| `short`
- `data-channel-plan` = `round` \| `square`
- `data-channel-aperture` = `hollow` \| `solid`

**Invariants**:

1. Same `pieceId` + `moduleId` → same channel attributes in pool, hand, and board.
2. Empty board cell MUST NOT render a PieceToken (distinct empty affordance).
3. Color/tone MUST NOT be the sole cue for stature, plan, or aperture.
4. Unknown `pieceId` → fallback glyph + `data-piece-fallback="true"` (tests assert this path).

## ModuleChannelMap registration

```text
getChannelMap(moduleId) → ModuleChannelMap
decodeChannels(moduleId, pieceId, traitsBitmask) → channel attribute bag
```

classic4 MUST register before Mini App play surfaces render pieces. Future modules add maps without changing Board/Pool props beyond `moduleId`.

## Accessibility

- Interactive tokens: `aria-label` from i18n listing four trait labels (not raw `p0`).
- Decorative preview: `aria-hidden` or empty alt pattern as appropriate.

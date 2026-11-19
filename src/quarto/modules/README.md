# GameModule plug-in stub (FR-019)

v1 registers only **`classic4`**. Later rule packs plug in here without rewriting Telegram shell or session persistence.

## Contract

A module implements `GameModule` (`types.ts`):

- `id` — stable string stored in `MatchSession.modules`
- `conflictGroup` — at most one active module per group (catalog / later specs)
- `pieceSet` — `traitCount`, `pieceIds`, `traits` bitmasks
- `boardLayout` — `cellCount`, `cellIds`, `winSets` (cell id lists)

Session DB stores **opaque** occupancy (`board` cell → piece id) and `pool`. Geometry and win masks live only in the module.

## Register a stub

1. Add `src/quarto/modules/myPack.ts` exporting a `GameModule`.
2. Register it in `registry.ts` (`resolveModules`).
3. Do **not** hard-code 4×4 / 16 pieces outside `classic4`.

```ts
import type { GameModule } from "./types";

export const myPack: GameModule = {
  id: "myPack",
  conflictGroup: "board",
  pieceSet: { traitCount: 4, pieceIds: [], traits: {} },
  boardLayout: { id: "custom", cellCount: 0, cellIds: [], winSets: [] },
};
```

Engine intents (`give` / `place` / `declare` / …) stay in `src/quarto/engine.ts`; modules supply pieces and win sets only.

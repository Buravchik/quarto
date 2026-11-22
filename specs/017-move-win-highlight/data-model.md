# Data model: 017

No schema migration.

| Field | Source | Client use |
| --- | --- | --- |
| `lastPlacedCell` | sessions / engine (existing) | Last-move cell |
| `lastPlacerSeat` | engine (existing); **newly on snapshot** | Gate last-move to computer |
| `outcome.declaredSet` | engine win (existing) | Win cell highlight |
| `outcome.winnerSeat` | engine (existing) | You / Computer / Opponent copy |
| `opponentKind` | snapshot (existing) | Vs-computer gate for last-move |

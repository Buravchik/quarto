# Data Model: Post-Start play chrome

No new persisted entities. Presentation surfaces only:

| Surface | Condition | Session rules | Achievements |
|---------|-----------|---------------|--------------|
| Home lobby | No `sessionId` | Shown (editable) | Shown (may collapse) |
| Play surface | `sessionId` present | Hidden | Hidden |

Miss/Pie values continue to live on the session snapshot as today; this feature does not add fields.

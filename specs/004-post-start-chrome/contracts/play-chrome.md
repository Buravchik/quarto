# Contract: Play chrome visibility

## Invariants

1. **Home**: `sessionId` absent → may render Session rules + achievements.
2. **Play**: `sessionId` present → MUST NOT render Session rules editor.
3. **Play**: `sessionId` present → MUST NOT render achievements panel.
4. **Leave**: Clearing `sessionId` restores home chrome.
5. **Labels**: Session rules copy uses RU/EN tables shared with Mini App language.

## Non-goals

- Changing Miss/Pie lock-on-join API.
- Restoring mid-wait settings editing UI.

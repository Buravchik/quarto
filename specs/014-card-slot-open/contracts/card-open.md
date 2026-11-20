# Contract: Card Open retarget

1. `preferredOpenSessionId(slots)` → waiting → active|pie → first.
2. Card edit includes `reply_markup` with `web_app` Open for that id + Drop.
3. Transport `editMessageText` / `editInlineMessageText` accept optional markup.

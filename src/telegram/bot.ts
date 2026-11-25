import { createServer } from "node:http";
import { Telegraf } from "telegraf";
import { t } from "../i18n";
import { handleApi, registerOpenApiStubs } from "./api/router";
import { cardView, createCard, formatCardMessage, getCard, setCardInlineMessage, setCardMessage } from "./cards";
import { loadEnvFile } from "./http";
import {
  REFRESH_PREFIX,
  RESULT_PREFIX,
  cardKeyboard,
  isSessionRef,
  miniAppConfigWarnings,
  parseSessionRef,
} from "./liveCard";
import { openMiniAppButton, setBotUsername } from "./miniAppUrl";
import { buildInviteResult, refreshCardMessage, setNotifyTransport } from "./notify";
import { displayNameFromTelegram } from "./players";
import { getSession, listWaitingSessionsForOwner } from "./sessions";

loadEnvFile();
registerOpenApiStubs();

for (const warning of miniAppConfigWarnings(process.env)) {
  console.warn(`[config] ${warning}`);
}

const token = process.env.BOT_TOKEN;
const port = Number(process.env.PORT ?? 8080);

const bot = token ? new Telegraf(token) : null;

const ALLOWED_UPDATES = [
  "message",
  "callback_query",
  "inline_query",
  "chosen_inline_result",
] as const;

type AnyExtra = Record<string, unknown>;

/** 021: bind an inline message (shareMessage / inline mode) to the session's card and refresh it. */
async function bindInlineMessage(sessionId: string, inlineMessageId: string) {
  const row = await getSession(sessionId);
  if (!row) return false;
  const card = await getCard(row.cardId);
  if (!card) return false;
  if (card.inlineMessageId !== inlineMessageId) {
    await setCardInlineMessage(row.cardId, inlineMessageId);
  }
  await refreshCardMessage(row.cardId);
  return true;
}

if (bot) {
  setNotifyTransport({
    editMessageText: async (chatId, messageId, text, extra) => {
      await bot.telegram.editMessageText(
        chatId,
        messageId,
        undefined,
        text,
        extra as Parameters<typeof bot.telegram.editMessageText>[4],
      );
    },
    editInlineMessageText: async (inlineMessageId, text, extra) => {
      await bot.telegram.editMessageText(
        undefined,
        undefined,
        inlineMessageId,
        text,
        extra as Parameters<typeof bot.telegram.editMessageText>[4],
      );
    },
    sendMessage: async (chatId, text, extra) => {
      const msg = await bot.telegram.sendMessage(
        chatId,
        text,
        extra as Parameters<typeof bot.telegram.sendMessage>[2],
      );
      return { message_id: msg.message_id };
    },
    deleteMessage: async (chatId, messageId) => {
      await bot.telegram.deleteMessage(chatId, messageId);
    },
    // Bot API 8.0 — not typed in telegraf 4.16, so go through callApi.
    savePreparedInlineMessage: async (userId, result) => {
      const call = bot.telegram.callApi.bind(bot.telegram) as unknown as (
        method: string,
        payload: AnyExtra,
      ) => Promise<{ id: string; expiration_date?: number }>;
      return call("savePreparedInlineMessage", {
        user_id: Number(userId),
        result,
        allow_user_chats: true,
        allow_group_chats: true,
        allow_bot_chats: false,
        allow_channel_chats: false,
      });
    },
  });

  bot.start(async (ctx) => {
    const copy = t(ctx.from?.language_code);
    const kb = cardKeyboard({ lang: ctx.from?.language_code, mode: "web_app", waiting: false, includeDrop: true });
    // Generic "open" row for /start (no session yet).
    const open = openMiniAppButton(copy.openMiniAppStart, undefined, "web_app");
    if (open) kb.inline_keyboard.unshift([open]);
    await ctx.reply(copy.startBlurb, { reply_markup: kb } as unknown as Parameters<typeof ctx.reply>[1]);
  });

  bot.command("new", async (ctx) => {
    const chat = ctx.chat;
    if (!chat || !ctx.from) return;
    const surface = chat.type === "private" ? "dm" : "group";
    const chatTitle = "title" in chat ? chat.title : undefined;
    const created = await createCard({
      ownerTelegramUserId: String(ctx.from.id),
      surface,
      chatId: String(chat.id),
      chatTitle,
      displayName: displayNameFromTelegram(ctx.from),
      language: ctx.from.language_code,
    });
    const view = await cardView(created.cardId);
    const text = view
      ? formatCardMessage(view, ctx.from.language_code)
      : t(ctx.from.language_code).cardTitle;
    // web_app only works in private chats with the bot; groups need t.me deep links
    const kb = cardKeyboard({
      sessionId: created.sessionId,
      waiting: true,
      lang: ctx.from.language_code,
      mode: surface === "dm" ? "web_app" : "url",
      includeDrop: surface === "dm",
    });
    const msg = await ctx.reply(text, { reply_markup: kb } as unknown as Parameters<typeof ctx.reply>[1]);
    await setCardMessage(created.cardId, String(chat.id), msg.message_id);
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(t(ctx.from?.language_code).helpGivePlace);
  });

  /**
   * 021 inline mode — every result is a real session card (id `s:<sessionId>`), never a
   * placeholder. Query `<sessionId>` (from WebApp.switchInlineQuery fallback) → that game.
   * Empty query → the user's open invites; if none, one fresh PvP card is created.
   */
  bot.on("inline_query", async (ctx) => {
    const copy = t(ctx.from.language_code);
    const uid = String(ctx.from.id);
    const query = ctx.inlineQuery.query.trim();
    const sessionIds: string[] = [];
    try {
      if (isSessionRef(query)) {
        sessionIds.push(query);
      } else {
        const open = await listWaitingSessionsForOwner(uid, 5);
        sessionIds.push(...open.map((r) => r.sessionId));
        if (sessionIds.length === 0) {
          const created = await createCard({
            ownerTelegramUserId: uid,
            surface: "inline",
            displayName: displayNameFromTelegram(ctx.from),
            language: ctx.from.language_code,
          });
          sessionIds.push(created.sessionId);
        }
      }
      const results = [];
      for (const id of sessionIds) {
        const built = await buildInviteResult(id);
        if (!built || built.row.difficulty) continue;
        if (sessionIds.length > 1) built.article.title = `${copy.shareInviteTitle} · ${results.length + 1}`;
        results.push(built.article);
      }
      await ctx.answerInlineQuery(results as unknown as Parameters<typeof ctx.answerInlineQuery>[0], {
        cache_time: 0,
        is_personal: true,
      });
    } catch (err) {
      console.error("inline_query failed", err);
      await ctx.answerInlineQuery([], { cache_time: 0, is_personal: true }).catch(() => undefined);
    }
  });

  /** Best effort (needs /setinlinefeedback): bind the sent inline message to its card. */
  bot.on("chosen_inline_result", async (ctx) => {
    const inlineMessageId = ctx.chosenInlineResult.inline_message_id;
    const sessionId = parseSessionRef(RESULT_PREFIX, ctx.chosenInlineResult.result_id);
    if (!inlineMessageId || !sessionId) return;
    try {
      await bindInlineMessage(sessionId, inlineMessageId);
    } catch (err) {
      console.error("chosen_inline_result failed", err);
    }
  });

  /** Fallback when chosen_inline_result is not delivered: 🔄 on the card binds + refreshes it. */
  bot.on("callback_query", async (ctx) => {
    const cq = ctx.callbackQuery;
    const data = "data" in cq ? cq.data : undefined;
    const sessionId = parseSessionRef(REFRESH_PREFIX, data);
    const copy = t(ctx.from?.language_code);
    if (!sessionId) {
      await ctx.answerCbQuery().catch(() => undefined);
      return;
    }
    try {
      if (cq.inline_message_id) {
        await bindInlineMessage(sessionId, cq.inline_message_id);
      } else {
        const row = await getSession(sessionId);
        if (row) await refreshCardMessage(row.cardId);
      }
      await ctx.answerCbQuery(copy.cardRefreshed).catch(() => undefined);
    } catch (err) {
      console.error("callback refresh failed", err);
      await ctx.answerCbQuery().catch(() => undefined);
    }
  });
}

const server = createServer(async (req, res) => {
  if (await handleApi(req, res)) return;

  const path = new URL(req.url ?? "/", "http://localhost").pathname;

  if (req.method === "POST" && path === "/telegram" && bot) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    await bot.handleUpdate(body);
    res.statusCode = 200;
    res.end("ok");
    return;
  }

  if (path === "/health" || path === "/healthz" || path === "/") {
    res.statusCode = 200;
    res.setHeader("content-type", "text/plain");
    res.end("ok");
    return;
  }

  res.statusCode = 404;
  res.end("not found");
});

server.listen(port, () => {
  console.log(`Quarto listening on :${port}`);
});

async function rememberBotUsername() {
  if (!bot) return;
  try {
    const me = await bot.telegram.getMe();
    setBotUsername(me.username);
    console.log("bot username", me.username);
  } catch (err) {
    console.warn("getMe failed", err);
  }
}

const webhook = process.env.WEBHOOK_URL;
if (bot && !webhook) {
  rememberBotUsername()
    .then(() => bot.launch({ allowedUpdates: [...ALLOWED_UPDATES] }))
    .then(() => console.log("Telegraf long polling (incl. inline)"))
    .catch((err) => console.error("bot.launch failed", err));
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
} else if (bot && webhook) {
  rememberBotUsername()
    .then(() =>
      bot.telegram.setWebhook(webhook, { allowed_updates: [...ALLOWED_UPDATES] }),
    )
    .then((ok) => console.log("setWebhook", ok, "→", webhook))
    .catch((err) => console.error("setWebhook failed", err));
} else {
  console.log("BOT_TOKEN missing — API only");
}

import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { Telegraf } from "telegraf";
import { t } from "../i18n";
import { handleApi, registerOpenApiStubs } from "./api/router";
import {
  cardView,
  createCard,
  formatCardMessage,
  setCardInlineMessage,
  setCardMessage,
} from "./cards";
import { loadEnvFile } from "./http";
import { miniAppTgLink, openMiniAppButton, setBotUsername } from "./miniAppUrl";
import { setNotifyTransport } from "./notify";
import { displayNameFromTelegram } from "./players";

loadEnvFile();
registerOpenApiStubs();

const token = process.env.BOT_TOKEN;
const port = Number(process.env.PORT ?? 8080);

const bot = token ? new Telegraf(token) : null;

const ALLOWED_UPDATES = [
  "message",
  "callback_query",
  "inline_query",
  "chosen_inline_result",
] as const;

/** Group/inline cards need a t.me url button; DM with the bot can use web_app. */
function playKeyboard(
  sessionId: string,
  langCode?: string,
  mode: "web_app" | "url" = "web_app",
) {
  const copy = t(langCode);
  const open = openMiniAppButton(copy.openMiniApp, sessionId, mode);
  if (!open) return undefined;
  return {
    reply_markup: {
      inline_keyboard: [
        [open],
        [{ text: copy.dropInChat, switch_inline_query: "" }],
      ],
    },
  };
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
      await bot.telegram.sendMessage(
        chatId,
        text,
        extra as Parameters<typeof bot.telegram.sendMessage>[2],
      );
    },
  });

  bot.start(async (ctx) => {
    const copy = t(ctx.from?.language_code);
    const open = openMiniAppButton(copy.openMiniAppStart, undefined, "web_app");
    const rows: Record<string, unknown>[][] = [];
    if (open) rows.push([open]);
    rows.push([{ text: copy.dropInChat, switch_inline_query: "" }]);
    await ctx.reply(
      copy.startBlurb,
      { reply_markup: { inline_keyboard: rows } } as unknown as Parameters<
        typeof ctx.reply
      >[1],
    );
  });

  bot.command("new", async (ctx) => {
    const chat = ctx.chat;
    if (!chat || !ctx.from) return;
    const surface = chat.type === "private" ? "dm" : "group";
    const created = await createCard({
      ownerTelegramUserId: String(ctx.from.id),
      surface,
      chatId: String(chat.id),
      displayName: displayNameFromTelegram(ctx.from),
      language: ctx.from.language_code,
    });
    const view = await cardView(created.cardId);
    const text = view
      ? formatCardMessage(view, ctx.from.language_code)
      : t(ctx.from.language_code).cardTitle;
    // web_app only works in private chats with the bot; groups need t.me deep links
    const mode = surface === "dm" ? "web_app" : "url";
    const msg = await ctx.reply(
      text,
      playKeyboard(created.sessionId, ctx.from.language_code, mode) as unknown as Parameters<
        typeof ctx.reply
      >[1],
    );
    await setCardMessage(created.cardId, String(chat.id), msg.message_id);
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(t(ctx.from?.language_code).helpGivePlace);
  });

  bot.on("inline_query", async (ctx) => {
    const copy = t(ctx.from.language_code);
    // Placeholder keyboard must be a url (not web_app) so Telegram issues inline_message_id
    // and the result works when shared into another person's chat.
    const open =
      openMiniAppButton(copy.openMiniApp, undefined, "url") ??
      (miniAppTgLink() ? { text: copy.openMiniApp, url: miniAppTgLink()! } : null);
    await ctx.answerInlineQuery(
      [
        {
          type: "article" as const,
          id: randomUUID(),
          title: copy.inlineTitle,
          description: copy.inlineDescription,
          input_message_content: {
            message_text: copy.inlinePlaceholder,
          },
          reply_markup: {
            inline_keyboard: [
              [
                open ?? { text: copy.openMiniApp, url: "https://t.me" },
              ],
            ],
          },
        },
      ] as unknown as Parameters<typeof ctx.answerInlineQuery>[0],
      { cache_time: 0, is_personal: true },
    );
  });

  bot.on("chosen_inline_result", async (ctx) => {
    const inlineMessageId = ctx.chosenInlineResult.inline_message_id;
    if (!inlineMessageId || !ctx.from) return;
    const copy = t(ctx.from.language_code);
    try {
      const created = await createCard({
        ownerTelegramUserId: String(ctx.from.id),
        surface: "inline",
        displayName: displayNameFromTelegram(ctx.from),
        language: ctx.from.language_code,
      });
      await setCardInlineMessage(created.cardId, inlineMessageId);
      const view = await cardView(created.cardId);
      const text = view
        ? formatCardMessage(view, ctx.from.language_code)
        : copy.cardTitle;
      const open = openMiniAppButton(copy.openMiniApp, created.sessionId, "url");
      const extra = open
        ? ({ reply_markup: { inline_keyboard: [[open]] } } as unknown as Parameters<
            typeof bot.telegram.editMessageText
          >[4])
        : undefined;
      await bot.telegram.editMessageText(undefined, undefined, inlineMessageId, text, extra);
    } catch (err) {
      console.error("chosen_inline_result failed", err);
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

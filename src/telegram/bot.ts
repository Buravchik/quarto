import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { Markup, Telegraf } from "telegraf";
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
import { setNotifyTransport } from "./notify";

loadEnvFile();
registerOpenApiStubs();

const token = process.env.BOT_TOKEN;
const port = Number(process.env.PORT ?? 8080);
const webapp = process.env.TELEGRAM_WEBAPP_URL;

const bot = token ? new Telegraf(token) : null;

/** Mini App origin with trailing slash; query params attach after /quarto/. */
function miniAppUrl(sessionId?: string): string | undefined {
  if (!webapp) return undefined;
  const base = webapp.replace(/\/?$/, "/");
  if (!sessionId) return base;
  return `${base}?sessionId=${encodeURIComponent(sessionId)}`;
}

function playKeyboard(sessionId: string, langCode?: string) {
  const copy = t(langCode);
  const url = miniAppUrl(sessionId);
  if (!url) return undefined;
  return Markup.inlineKeyboard([
    // webApp opens inside Telegram; url would open an external browser (↗)
    [Markup.button.webApp(copy.openMiniApp, url)],
    [Markup.button.switchToChat(copy.dropInChat, "")],
  ]);
}

if (bot) {
  setNotifyTransport({
    editMessageText: async (chatId, messageId, text) => {
      await bot.telegram.editMessageText(chatId, messageId, undefined, text);
    },
    editInlineMessageText: async (inlineMessageId, text) => {
      await bot.telegram.editMessageText(undefined, undefined, inlineMessageId, text);
    },
    sendMessage: async (chatId, text) => {
      await bot.telegram.sendMessage(chatId, text);
    },
  });

  bot.start(async (ctx) => {
    const copy = t(ctx.from?.language_code);
    await ctx.reply(
      copy.startBlurb,
      Markup.inlineKeyboard([[Markup.button.switchToChat(copy.dropInChat, "")]]),
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
    });
    const view = await cardView(created.cardId);
    const text = view ? formatCardMessage(view) : `Card ${created.cardId}`;
    const msg = await ctx.reply(text, playKeyboard(created.sessionId, ctx.from.language_code));
    await setCardMessage(created.cardId, String(chat.id), msg.message_id);
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(t(ctx.from?.language_code).helpGivePlace);
  });

  // Inline mode: @tgquarto_bot in any chat → drop a challenge card
  bot.on("inline_query", async (ctx) => {
    const copy = t(ctx.from.language_code);
    await ctx.answerInlineQuery(
      [
        {
          type: "article",
          id: randomUUID(),
          title: copy.inlineTitle,
          description: copy.inlineDescription,
          input_message_content: {
            message_text: copy.inlinePlaceholder,
          },
          // reply_markup required so Telegram gives us inline_message_id on choose
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: copy.openMiniApp,
                  web_app: { url: miniAppUrl() ?? "https://t.me" },
                },
              ],
            ],
          },
        },
      ],
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
      });
      await setCardInlineMessage(created.cardId, inlineMessageId);
      const view = await cardView(created.cardId);
      const text = view ? formatCardMessage(view) : `Card ${created.cardId}`;
      const openUrl = miniAppUrl(created.sessionId);
      const extra =
        openUrl != null
          ? {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: copy.openMiniApp,
                      web_app: { url: openUrl },
                    },
                  ],
                ],
              },
            }
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

  // Prefer /health — /healthz is sometimes intercepted by Google Frontend on Cloud Run
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

const webhook = process.env.WEBHOOK_URL;
if (bot && !webhook) {
  bot
    .launch({
      allowedUpdates: [
        "message",
        "callback_query",
        "inline_query",
        "chosen_inline_result",
      ],
    })
    .then(() => console.log("Telegraf long polling (incl. inline)"))
    .catch((err) => console.error("bot.launch failed", err));
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
} else if (bot && webhook) {
  console.log("Webhook mode: POST /telegram →", webhook);
} else {
  console.log("BOT_TOKEN missing — API only");
}

import { createServer } from "node:http";
import { Markup, Telegraf } from "telegraf";
import { t } from "../i18n";
import { handleApi, registerOpenApiStubs } from "./api/router";
import { cardView, createCard, formatCardMessage, setCardMessage } from "./cards";
import { loadEnvFile } from "./http";
import { setNotifyTransport } from "./notify";

loadEnvFile();
registerOpenApiStubs();

const token = process.env.BOT_TOKEN;
const port = Number(process.env.PORT ?? 8080);
const webapp = process.env.TELEGRAM_WEBAPP_URL;

const bot = token ? new Telegraf(token) : null;

if (bot) {
  setNotifyTransport({
    editMessageText: async (chatId, messageId, text) => {
      await bot.telegram.editMessageText(chatId, messageId, undefined, text);
    },
    sendMessage: async (chatId, text) => {
      await bot.telegram.sendMessage(chatId, text);
    },
  });

  bot.start(async (ctx) => {
    const copy = t(ctx.from?.language_code);
    await ctx.reply(copy.startBlurb);
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
    const keyboard =
      webapp != null
        ? Markup.inlineKeyboard([
            Markup.button.url("Open Mini App", `${webapp}?sessionId=${created.sessionId}`),
          ])
        : undefined;
    const msg = await ctx.reply(text, keyboard);
    await setCardMessage(created.cardId, String(chat.id), msg.message_id);
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(t(ctx.from?.language_code).helpGivePlace);
  });
}

const server = createServer(async (req, res) => {
  if (await handleApi(req, res)) return;

  if (req.method === "POST" && req.url === "/telegram" && bot) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    await bot.handleUpdate(body);
    res.statusCode = 200;
    res.end("ok");
    return;
  }

  if (req.url === "/healthz") {
    res.statusCode = 200;
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
    .launch()
    .then(() => console.log("Telegraf long polling"))
    .catch((err) => console.error("bot.launch failed", err));
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
} else if (bot && webhook) {
  console.log("Webhook mode: POST /telegram →", webhook);
} else {
  console.log("BOT_TOKEN missing — API only");
}

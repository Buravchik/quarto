import { createServer } from "node:http";
import { Telegraf } from "telegraf";
import { handleApi, registerOpenApiStubs } from "./api/router";

registerOpenApiStubs();

const token = process.env.BOT_TOKEN;
const port = Number(process.env.PORT ?? 8080);

const bot = token ? new Telegraf(token) : null;

if (bot) {
  bot.start(async (ctx) => {
    await ctx.reply("Quarto bot online (scaffold). Mini App + cards come next.");
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
  bot.launch().then(() => console.log("Telegraf long polling")).catch((err) => {
    console.error("bot.launch failed", err);
  });
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
} else if (bot && webhook) {
  console.log("Webhook mode: POST /telegram (set webhook externally to", webhook, ")");
} else {
  console.log("BOT_TOKEN missing — API only");
}

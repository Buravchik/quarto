# Bot + /api/v1 (+ optional webhook POST /telegram when WEBHOOK_URL set)
FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

ENV PORT=8080
EXPOSE 8080

# Long-poll if WEBHOOK_URL unset; webhook mode: set WEBHOOK_URL and point Telegram to https://host/telegram
CMD ["npx", "tsx", "src/telegram/bot.ts"]

FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build || true

ENV PORT=8080
EXPOSE 8080

CMD ["npx", "tsx", "src/telegram/bot.ts"]

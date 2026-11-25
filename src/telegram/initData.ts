import { createHmac, timingSafeEqual } from "node:crypto";

export type TelegramWebAppUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

export type ValidatedInitData = {
  user: TelegramWebAppUser;
  authDate: number;
  raw: Record<string, string>;
};

function parseInitData(initData: string): Record<string, string> {
  const params = new URLSearchParams(initData);
  const out: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    out[key] = value;
  }
  return out;
}

/** 021: initData older than this is rejected (Telegram recommends checking auth_date). */
export const INIT_DATA_MAX_AGE_SEC = 24 * 60 * 60;

function maxAgeFromEnv(): number {
  const raw = Number(process.env.INIT_DATA_MAX_AGE_SEC);
  return Number.isFinite(raw) && raw > 0 ? raw : INIT_DATA_MAX_AGE_SEC;
}

/** Validate Telegram WebApp initData HMAC-SHA-256 per Bot API (+ auth_date freshness). */
export function validateInitData(
  initData: string,
  botToken: string,
  opts: { maxAgeSec?: number; nowSec?: number } = {},
): ValidatedInitData {
  if (!initData || !botToken) {
    throw new Error("invalid_init_data");
  }
  const data = parseInitData(initData);
  const hash = data.hash;
  if (!hash) {
    throw new Error("invalid_init_data");
  }

  const pairs = Object.keys(data)
    .filter((k) => k !== "hash")
    .sort()
    .map((k) => `${k}=${data[k]}`);
  const dataCheckString = pairs.join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculated = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  const a = Buffer.from(calculated, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("invalid_init_data");
  }

  if (!data.user) {
    throw new Error("invalid_init_data");
  }
  const user = JSON.parse(data.user) as TelegramWebAppUser;
  if (!user?.id) {
    throw new Error("invalid_init_data");
  }

  const authDate = Number(data.auth_date ?? 0);
  const nowSec = opts.nowSec ?? Math.floor(Date.now() / 1000);
  const maxAge = opts.maxAgeSec ?? maxAgeFromEnv();
  if (!Number.isFinite(authDate) || authDate <= 0 || nowSec - authDate > maxAge) {
    throw new Error("expired_init_data");
  }

  return {
    user,
    authDate,
    raw: data,
  };
}

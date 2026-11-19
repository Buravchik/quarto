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

/** Validate Telegram WebApp initData HMAC-SHA-256 per Bot API. */
export function validateInitData(initData: string, botToken: string): ValidatedInitData {
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

  return {
    user,
    authDate: Number(data.auth_date ?? 0),
    raw: data,
  };
}

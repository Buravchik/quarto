import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { validateInitData } from "../../../src/telegram/initData";

function makeInitData(botToken: string, userId = 42, authDateSec = Math.floor(Date.now() / 1000)) {
  const user = JSON.stringify({ id: userId, first_name: "Test" });
  const auth_date = String(authDateSec);
  const fields: Record<string, string> = { user, auth_date };
  const dataCheckString = Object.keys(fields)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  const params = new URLSearchParams({ ...fields, hash });
  return params.toString();
}

describe("initData auth", () => {
  const token = "123456:ABC-DEF";

  it("accepts valid HMAC", () => {
    const initData = makeInitData(token);
    const v = validateInitData(initData, token);
    expect(v.user.id).toBe(42);
  });

  it("rejects tampered data (401 path)", () => {
    const params = new URLSearchParams(makeInitData(token));
    params.set("hash", "0".repeat(64));
    expect(() => validateInitData(params.toString(), token)).toThrow(/invalid_init_data/);
  });

  it("seat isolation: different users map to different telegram ids", () => {
    const a = validateInitData(makeInitData(token, 1), token);
    const b = validateInitData(makeInitData(token, 2), token);
    expect(a.user.id).not.toBe(b.user.id);
  });

  it("021: rejects initData older than 24h (expired_init_data)", () => {
    const old = Math.floor(Date.now() / 1000) - 25 * 60 * 60;
    expect(() => validateInitData(makeInitData(token, 42, old), token)).toThrow(/expired_init_data/);
  });

  it("021: accepts initData just under 24h old", () => {
    const recent = Math.floor(Date.now() / 1000) - 23 * 60 * 60;
    expect(validateInitData(makeInitData(token, 42, recent), token).user.id).toBe(42);
  });

  it("021: maxAgeSec override", () => {
    const tenMinAgo = Math.floor(Date.now() / 1000) - 600;
    expect(() =>
      validateInitData(makeInitData(token, 42, tenMinAgo), token, { maxAgeSec: 60 }),
    ).toThrow(/expired_init_data/);
  });
});

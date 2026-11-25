import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  cardKeyboard,
  formatDmText,
  inviteArticle,
  isPresent,
  miniAppConfigWarnings,
  parseSessionRef,
  planDms,
  REFRESH_PREFIX,
  RESULT_PREFIX,
} from "../../../src/telegram/liveCard";
import { miniAppTgLink, setBotUsername } from "../../../src/telegram/miniAppUrl";

const SID = "11111111-2222-4333-8444-555555555555";
const env = { ...process.env };

beforeEach(() => {
  process.env.TELEGRAM_WEBAPP_URL = "https://buravchik.github.io/quarto";
  delete process.env.TELEGRAM_MINI_APP_SHORT_NAME;
  setBotUsername("tgquarto_bot");
});
afterEach(() => {
  process.env = { ...env };
  setBotUsername(undefined);
});

describe("session refs", () => {
  it("parses s:/r: refs and rejects junk", () => {
    expect(parseSessionRef(RESULT_PREFIX, `s:${SID}`)).toBe(SID);
    expect(parseSessionRef(REFRESH_PREFIX, `r:${SID}`)).toBe(SID);
    expect(parseSessionRef(RESULT_PREFIX, `r:${SID}`)).toBeNull();
    expect(parseSessionRef(RESULT_PREFIX, "s:../../etc")).toBeNull();
    expect(parseSessionRef(RESULT_PREFIX, undefined)).toBeNull();
  });

  it("result/callback ids fit Telegram's 64-byte limit", () => {
    expect(`${RESULT_PREFIX}${SID}`.length).toBeLessThanOrEqual(64);
    expect(`${REFRESH_PREFIX}${SID}`.length).toBeLessThanOrEqual(64);
  });
});

describe("cardKeyboard", () => {
  it("group/inline card: Join opens THIS session via Main Mini App t.me/<bot>?startapp=", () => {
    const kb = cardKeyboard({ sessionId: SID, waiting: true, lang: "ru", mode: "url", refresh: true });
    const join = kb.inline_keyboard[0]![0]!;
    expect(join.text).toBe("Присоединиться");
    expect(join.url).toBe(`https://t.me/tgquarto_bot?startapp=${SID}`);
    expect(kb.inline_keyboard[1]![0]!.callback_data).toBe(`r:${SID}`);
  });

  it("bot DM card uses web_app with ?sessionId and offers Drop in a chat", () => {
    const kb = cardKeyboard({ sessionId: SID, waiting: false, lang: "en", mode: "web_app", includeDrop: true });
    expect(kb.inline_keyboard[0]![0]!.text).toBe("Open game");
    expect((kb.inline_keyboard[0]![0]!.web_app as { url: string }).url).toContain(`sessionId=${SID}`);
    expect(kb.inline_keyboard.at(-1)![0]!.switch_inline_query).toBe("");
  });

  it("never emits a placeholder button (no https://t.me fallback) when no URL can be built", () => {
    delete process.env.TELEGRAM_WEBAPP_URL;
    setBotUsername(undefined);
    delete process.env.BOT_USERNAME;
    const kb = cardKeyboard({ sessionId: SID, waiting: true, mode: "url" });
    const urls = kb.inline_keyboard.flat().map((b) => b.url);
    expect(urls).not.toContain("https://t.me");
    expect(kb.inline_keyboard.flat().every((b) => b.url === undefined)).toBe(true);
  });
});

describe("miniAppTgLink (Main Mini App direct link)", () => {
  it("uses t.me/<bot>?startapp=<id> and ignores any legacy short name", () => {
    process.env.TELEGRAM_MINI_APP_SHORT_NAME = "play";
    expect(miniAppTgLink(SID)).toBe(`https://t.me/tgquarto_bot?startapp=${SID}`);
    expect(miniAppTgLink()).toBe("https://t.me/tgquarto_bot?startapp");
  });

  it("inline card always carries the 🔄 bind button (works without inline feedback)", () => {
    const kb = cardKeyboard({ sessionId: SID, waiting: true, mode: "url", refresh: true });
    const all = kb.inline_keyboard.flat();
    expect(all.some((b) => b.callback_data === `r:${SID}`)).toBe(true);
  });
});

describe("inviteArticle", () => {
  it("is a concrete session card with s:<id> result id", () => {
    const kb = cardKeyboard({ sessionId: SID, waiting: true, mode: "url" });
    const a = inviteArticle({ sessionId: SID, title: "T", description: "D", text: "Кварто · Sakvar зовёт сыграть", keyboard: kb });
    expect(a.id).toBe(`s:${SID}`);
    expect(a.input_message_content.message_text).not.toMatch(/preparing|готовим/i);
    expect(a.reply_markup.inline_keyboard[0]![0]!.url).toContain(SID);
  });
});

describe("planDms (021 DM policy)", () => {
  const now = Date.parse("2026-11-25T12:00:00Z");
  const base = {
    seat0Id: "A",
    seat1Id: "B",
    turnSeat: 1 as const,
    status: "active",
    vsComputer: false,
    nowMs: now,
  };

  it("vs computer → zero DMs whatever happens", () => {
    expect(
      planDms({ ...base, seat1Id: "computer", vsComputer: true, events: ["turn_changed", "match_ended"] }),
    ).toEqual([]);
  });

  it("PvP turn change pings only the absent player whose turn it is", () => {
    const plans = planDms({ ...base, events: ["turn_changed"], presence: {} });
    expect(plans).toEqual([
      { userId: "A", ping: false },
      { userId: "B", ping: true },
    ]);
  });

  it("no ping while the player has the Mini App open (present)", () => {
    const plans = planDms({
      ...base,
      events: ["turn_changed"],
      presence: { B: new Date(now - 5_000).toISOString() },
    });
    expect(plans.find((p) => p.userId === "B")?.ping).toBe(false);
  });

  it("match end pings both absent players; rematch offer pings only the other one", () => {
    expect(planDms({ ...base, status: "finished", turnSeat: null, events: ["match_ended"] }).map((p) => p.ping)).toEqual([
      true,
      true,
    ]);
    const r = planDms({ ...base, status: "finished", events: ["rematch_offered"], rematchOfferedBy: "A" });
    expect(r).toEqual([
      { userId: "A", ping: false },
      { userId: "B", ping: true },
    ]);
  });

  it("opponent joined pings the absent host", () => {
    const plans = planDms({ ...base, turnSeat: 1, events: ["opponent_joined", "turn_changed"] });
    expect(plans.find((p) => p.userId === "A")?.ping).toBe(true);
  });

  it("isPresent window", () => {
    expect(isPresent({ A: new Date(now - 10_000).toISOString() }, "A", now)).toBe(true);
    expect(isPresent({ A: new Date(now - 60_000).toISOString() }, "A", now)).toBe(false);
    expect(isPresent(null, "A", now)).toBe(false);
  });
});

describe("formatDmText", () => {
  it("names opponent + chat and whose turn (RU)", () => {
    const text = formatDmText({
      lang: "ru",
      opponentName: "Sakvar",
      chatTitle: "Настолки",
      status: "active",
      mySeat: 1,
      turnSeat: 1,
      outcome: null,
    });
    expect(text).toContain("против Sakvar");
    expect(text).toContain("«Настолки»");
    expect(text).toContain("Ваш ход");
  });

  it("finished: win / loss / draw", () => {
    const common = { lang: "en", opponentName: "B", status: "finished", mySeat: 0 as const, turnSeat: null };
    expect(formatDmText({ ...common, outcome: { type: "win", winnerSeat: 0 } })).toContain("You won");
    expect(formatDmText({ ...common, outcome: { type: "resign", winnerSeat: 1 } })).toContain("You lost");
    expect(formatDmText({ ...common, outcome: { type: "draw" } })).toContain("Draw");
  });
});

describe("miniAppConfigWarnings", () => {
  it("no short-name requirement: Main Mini App link needs only TELEGRAM_WEBAPP_URL", () => {
    expect(miniAppConfigWarnings({ TELEGRAM_WEBAPP_URL: "x" })).toEqual([]);
    expect(miniAppConfigWarnings({}).join(" ")).toMatch(/TELEGRAM_WEBAPP_URL/);
    expect(miniAppConfigWarnings({}).join(" ")).not.toMatch(/SHORT_NAME/);
  });
});

import type { IncomingMessage, ServerResponse } from "node:http";
import { applyIntent, type Intent } from "../../quarto/engine";
import { addSlot, cardView, createCard, SLOT_CAP } from "../cards";
import { loadEnvFile, readJson, sendJson } from "../http";
import { validateInitData } from "../initData";
import { dispatchSessionEvents } from "../notify";
import { getAchievements, grantAchievements, grantMatchUnlocks, pinAchievements } from "../players";
import {
  engineFromRow,
  getSession,
  joinSession,
  rematchAction,
  saveEngine,
  toSnapshot,
  updateSessionSettings,
  type Seat,
} from "../sessions";
import { getCard } from "../cards";
import { requireCreator, requireSeated } from "./seatAudit";

loadEnvFile();

function botToken() {
  const t = process.env.BOT_TOKEN;
  if (!t) throw new Error("BOT_TOKEN missing");
  return t;
}

function auth(initData: string | undefined) {
  if (!initData) throw new Error("invalid_init_data");
  return validateInitData(initData, botToken());
}

export async function getCardHandler(
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
) {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    auth(url.searchParams.get("initData") ?? undefined);
    const view = await cardView(params.cardId!);
    if (!view) return sendJson(res, 404, { error: "not_found" });
    return sendJson(res, 200, view);
  } catch {
    return sendJson(res, 401, { error: "invalid_init_data" });
  }
}

export async function postCardHandler(req: IncomingMessage, res: ServerResponse) {
  try {
    const body = await readJson<{
      initData?: string;
      missMode?: "persistent" | "void";
      pieRule?: boolean;
      surface?: "group" | "dm";
    }>(req);
    const user = auth(body.initData);
    const created = await createCard({
      ownerTelegramUserId: String(user.user.id),
      surface: body.surface ?? "dm",
      missMode: body.missMode,
      pieRule: body.pieRule,
    });
    // Mini App lobby start → Telegram-native card DM (not orphan session)
    const { sendChallengeCardDm } = await import("../notify");
    const lang = user.user.language_code;
    const dm = await sendChallengeCardDm({
      telegramUserId: String(user.user.id),
      cardId: created.cardId,
      sessionId: created.sessionId,
      lang,
    });
    return sendJson(res, 201, { ...created, cardDm: dm.ok });
  } catch {
    return sendJson(res, 401, { error: "invalid_init_data" });
  }
}

export async function postSlotHandler(
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
) {
  try {
    const body = await readJson<{
      initData?: string;
      missMode?: "persistent" | "void";
      pieRule?: boolean;
    }>(req);
    const user = auth(body.initData);
    const result = await addSlot({
      cardId: params.cardId!,
      ownerTelegramUserId: String(user.user.id),
      missMode: body.missMode,
      pieRule: body.pieRule,
    });
    if ("error" in result) {
      return sendJson(res, 409, { error: result.error, max: SLOT_CAP });
    }
    return sendJson(res, 201, result);
  } catch {
    return sendJson(res, 401, { error: "invalid_init_data" });
  }
}

export async function joinHandler(
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
) {
  try {
    const body = await readJson<{ initData?: string }>(req);
    const user = auth(body.initData);
    const result = await joinSession(params.sessionId!, String(user.user.id));
    if ("error" in result) {
      const code = result.error === "not_found" ? 404 : 409;
      return sendJson(res, code, { error: result.error });
    }
    await dispatchSessionEvents(params.sessionId!, ["opponent_joined", "turn_changed"]);
    const row = await getSession(params.sessionId!);
    return sendJson(res, 200, row ? toSnapshot(row) : { ok: true });
  } catch {
    return sendJson(res, 401, { error: "invalid_init_data" });
  }
}

export async function intentHandler(
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
) {
  try {
    const body = await readJson<{
      initData?: string;
      type?: Intent["type"];
      pieceId?: string;
      cellIndex?: number;
      setCells?: number[];
      pieTake?: boolean;
    }>(req);
    const user = auth(body.initData);
    const row = await getSession(params.sessionId!);
    if (!row) return sendJson(res, 404, { error: "not_found" });

    const uid = String(user.user.id);
    const seated = requireSeated(row.seat0 as Seat, row.seat1 as Seat, uid);
    if (!seated.ok) return sendJson(res, 403, { error: seated.error });

    if (!body.type) return sendJson(res, 400, { error: "illegal_move" });
    const intent = { type: body.type, ...body } as Intent;
    const engine = engineFromRow(row);
    const result = applyIntent(engine, seated.seat, intent);
    if (!result.ok) {
      if (result.error === "timeout_too_early") {
        return sendJson(res, 409, {
          error: "timeout_too_early",
          retryAfterSeconds: result.retryAfterSeconds ?? 0,
        });
      }
      const status =
        result.error === "illegal_declare" ||
        result.error === "illegal_move" ||
        result.error === "wrong_phase"
          ? 400
          : result.error === "not_your_turn" || result.error === "not_waiting_seat"
            ? 403
            : 409;
      return sendJson(res, status, { error: result.error });
    }
    await saveEngine(params.sessionId!, result.state);
    if (result.events.includes("match_ended")) {
      const card = await getCard(row.cardId);
      await grantMatchUnlocks({
        seat0UserId: (row.seat0 as Seat)?.telegramUserId,
        seat1UserId: (row.seat1 as Seat)?.telegramUserId,
        outcome: result.state.outcome,
        pieRule: result.state.pieRule,
        pieResolved: result.state.pieResolved,
        cardOwnerId: card?.ownerTelegramUserId,
      });
    }
    await dispatchSessionEvents(params.sessionId!, result.events);
    const updated = await getSession(params.sessionId!);
    return sendJson(res, 200, {
      session: updated ? toSnapshot(updated) : null,
      events: result.events,
    });
  } catch {
    return sendJson(res, 401, { error: "invalid_init_data" });
  }
}

export async function getSessionHandler(
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
) {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    auth(url.searchParams.get("initData") ?? undefined);
    const row = await getSession(params.sessionId!);
    if (!row) return sendJson(res, 404, { error: "not_found" });
    return sendJson(res, 200, toSnapshot(row));
  } catch {
    return sendJson(res, 401, { error: "invalid_init_data" });
  }
}

export async function settingsHandler(
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
) {
  try {
    const body = await readJson<{
      initData?: string;
      missMode?: "persistent" | "void";
      pieRule?: boolean;
    }>(req);
    const user = auth(body.initData);
    const rowCheck = await getSession(params.sessionId!);
    if (!rowCheck) return sendJson(res, 404, { error: "not_found" });
    const creator = requireCreator(rowCheck.seat0 as Seat, String(user.user.id));
    if (!creator.ok) return sendJson(res, 403, { error: creator.error });
    const result = await updateSessionSettings(params.sessionId!, String(user.user.id), {
      missMode: body.missMode,
      pieRule: body.pieRule,
    });
    if ("error" in result) {
      const code = result.error === "not_found" ? 404 : 403;
      return sendJson(res, code, { error: result.error });
    }
    const row = await getSession(params.sessionId!);
    return sendJson(res, 200, row ? toSnapshot(row) : { ok: true });
  } catch {
    return sendJson(res, 401, { error: "invalid_init_data" });
  }
}

export async function rematchHandler(
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
) {
  try {
    const body = await readJson<{ initData?: string; action?: "offer" | "accept" | "decline" }>(req);
    const user = auth(body.initData);
    if (!body.action) return sendJson(res, 400, { error: "illegal_move" });
    const result = await rematchAction(params.sessionId!, String(user.user.id), body.action);
    if ("error" in result) {
      const code = result.error === "not_found" ? 404 : 403;
      return sendJson(res, code, { error: result.error });
    }
    if (body.action === "offer") {
      await dispatchSessionEvents(params.sessionId!, ["rematch_offered"]);
    }
    if (body.action === "accept" && "newSessionId" in result && result.newSessionId) {
      await grantAchievements(String(user.user.id), ["rematch"]);
      const row = await getSession(params.sessionId!);
      const other =
        (row?.seat0 as Seat)?.telegramUserId === String(user.user.id)
          ? (row?.seat1 as Seat)?.telegramUserId
          : (row?.seat0 as Seat)?.telegramUserId;
      if (other) await grantAchievements(other, ["rematch"]);
    }
    return sendJson(res, 200, result);
  } catch {
    return sendJson(res, 401, { error: "invalid_init_data" });
  }
}

export async function getAchievementsHandler(req: IncomingMessage, res: ServerResponse) {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    const user = auth(url.searchParams.get("initData") ?? undefined);
    const view = await getAchievements(String(user.user.id));
    return sendJson(res, 200, view);
  } catch {
    return sendJson(res, 401, { error: "invalid_init_data" });
  }
}

export async function pinAchievementsHandler(req: IncomingMessage, res: ServerResponse) {
  try {
    const body = await readJson<{ initData?: string; pinned?: string[] }>(req);
    const user = auth(body.initData);
    const result = await pinAchievements(String(user.user.id), body.pinned ?? []);
    if ("error" in result) return sendJson(res, 400, { error: result.error });
    return sendJson(res, 200, result);
  } catch {
    return sendJson(res, 401, { error: "invalid_init_data" });
  }
}

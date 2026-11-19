import type { IncomingMessage, ServerResponse } from "node:http";
import { applyIntent, type Intent } from "../../quarto/engine";
import { addSlot, cardView, createCard, SLOT_CAP } from "../cards";
import { loadEnvFile, readJson, sendJson } from "../http";
import { validateInitData } from "../initData";
import { dispatchSessionEvents } from "../notify";
import {
  engineFromRow,
  getSession,
  joinSession,
  saveEngine,
  toSnapshot,
} from "../sessions";

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
    return sendJson(res, 201, created);
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
    const seat0 = row.seat0 as { telegramUserId: string } | null;
    const seat1 = row.seat1 as { telegramUserId: string } | null;
    let seat: 0 | 1 | null = null;
    if (seat0?.telegramUserId === uid) seat = 0;
    if (seat1?.telegramUserId === uid) seat = 1;
    if (seat === null) return sendJson(res, 403, { error: "not_seated" });

    if (!body.type) return sendJson(res, 400, { error: "illegal_move" });
    const intent = { type: body.type, ...body } as Intent;
    const engine = engineFromRow(row);
    const result = applyIntent(engine, seat, intent);
    if (!result.ok) {
      const status = result.error === "illegal_declare" || result.error === "illegal_move" || result.error === "wrong_phase" ? 400 : result.error === "not_your_turn" ? 403 : 409;
      return sendJson(res, status, { error: result.error });
    }
    await saveEngine(params.sessionId!, result.state);
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

export async function settingsStub(req: IncomingMessage, res: ServerResponse) {
  void req;
  sendJson(res, 501, { error: "not_implemented" });
}

export async function rematchStub(req: IncomingMessage, res: ServerResponse) {
  void req;
  sendJson(res, 501, { error: "not_implemented" });
}

export async function achievementsStub(req: IncomingMessage, res: ServerResponse) {
  void req;
  sendJson(res, 501, { error: "not_implemented" });
}

/**
 * 021 live card: coalesce Telegram edits per message and respect 429 retry_after.
 *
 * - First edit for a key runs immediately (caller may await it).
 * - Edits that arrive while one is in flight / inside `minIntervalMs` collapse into a
 *   single trailing edit with the latest content (latest task wins).
 * - 429 → the task is retried after `retry_after` seconds (unless a newer one replaced it).
 * - "message is not modified" is a no-op, never an error.
 */

type TelegramErrorLike = {
  code?: number;
  description?: string;
  message?: string;
  parameters?: { retry_after?: number };
  response?: {
    error_code?: number;
    description?: string;
    parameters?: { retry_after?: number };
  };
};

function asErr(err: unknown): TelegramErrorLike {
  return (err && typeof err === "object" ? err : {}) as TelegramErrorLike;
}

function describe(err: unknown): string {
  const e = asErr(err);
  return String(e.response?.description ?? e.description ?? e.message ?? err ?? "");
}

/** Seconds from a Telegram 429, or null when not rate limited. */
export function retryAfterSeconds(err: unknown): number | null {
  const e = asErr(err);
  const code = e.response?.error_code ?? e.code;
  const ra = e.response?.parameters?.retry_after ?? e.parameters?.retry_after;
  if (code === 429 || ra != null) return Math.max(1, Number(ra ?? 1));
  return null;
}

export function isNotModified(err: unknown): boolean {
  return /message is not modified/i.test(describe(err));
}

/** Message deleted / too old / never existed — caller should forget the stored id. */
export function isMessageGone(err: unknown): boolean {
  return /message to edit not found|message can't be edited|MESSAGE_ID_INVALID|message to delete not found|chat not found/i.test(
    describe(err),
  );
}

type Task = () => Promise<void>;

type KeyState = {
  running: boolean;
  pending: Task | null;
  lastAt: number;
  notBefore: number;
  timer: ReturnType<typeof setTimeout> | null;
};

export type Coalescer = {
  run: (key: string, task: Task) => Promise<void>;
  /** Test helper: pending trailing tasks. */
  pendingCount: () => number;
};

export function createCoalescer(opts: {
  minIntervalMs?: number;
  now?: () => number;
  onError?: (key: string, err: unknown) => void;
} = {}): Coalescer {
  const minInterval = opts.minIntervalMs ?? 1200;
  const now = opts.now ?? (() => Date.now());
  const onError =
    opts.onError ?? ((key: string, err: unknown) => console.warn("live edit failed", key, describe(err)));
  const states = new Map<string, KeyState>();

  const stateOf = (key: string): KeyState => {
    let s = states.get(key);
    if (!s) {
      s = { running: false, pending: null, lastAt: -Infinity, notBefore: 0, timer: null };
      states.set(key, s);
    }
    return s;
  };

  const schedule = (key: string, s: KeyState) => {
    if (s.timer || s.running || !s.pending) return;
    const at = Math.max(s.lastAt + minInterval, s.notBefore);
    const delay = Math.max(0, at - now());
    s.timer = setTimeout(() => {
      s.timer = null;
      const next = s.pending;
      s.pending = null;
      if (next) void start(key, s, next);
    }, delay);
  };

  const start = async (key: string, s: KeyState, task: Task) => {
    s.running = true;
    try {
      await task();
    } catch (err) {
      const ra = retryAfterSeconds(err);
      if (ra != null) {
        s.notBefore = now() + ra * 1000;
        if (!s.pending) s.pending = task;
      } else if (!isNotModified(err)) {
        onError(key, err);
      }
    } finally {
      s.running = false;
      s.lastAt = now();
      schedule(key, s);
    }
  };

  return {
    run(key, task) {
      const s = stateOf(key);
      const t = now();
      if (!s.running && !s.timer && t - s.lastAt >= minInterval && t >= s.notBefore) {
        return start(key, s, task);
      }
      s.pending = task;
      schedule(key, s);
      return Promise.resolve();
    },
    pendingCount() {
      let n = 0;
      for (const s of states.values()) if (s.pending) n++;
      return n;
    },
  };
}

/** Shared instance for card + DM edits (one per process). */
export const liveEdits = createCoalescer();

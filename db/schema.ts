import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const players = pgTable("players", {
  telegramUserId: varchar("telegram_user_id", { length: 32 }).primaryKey(),
  displayName: text("display_name").notNull().default(""),
  language: varchar("language", { length: 8 }).notNull().default("en"),
  achievementIds: jsonb("achievement_ids").$type<string[]>().notNull().default([]),
  pinnedAchievementIds: jsonb("pinned_achievement_ids").$type<string[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cards = pgTable("cards", {
  cardId: varchar("card_id", { length: 64 }).primaryKey(),
  ownerTelegramUserId: varchar("owner_telegram_user_id", { length: 32 }).notNull(),
  surface: varchar("surface", { length: 8 }).notNull(), // group | dm | inline
  chatId: varchar("chat_id", { length: 64 }),
  messageId: integer("message_id"),
  /** Set when the card was dropped via inline mode (editable via inline_message_id). */
  inlineMessageId: varchar("inline_message_id", { length: 128 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  sessionId: varchar("session_id", { length: 64 }).primaryKey(),
  cardId: varchar("card_id", { length: 64 })
    .notNull()
    .references(() => cards.cardId),
  status: varchar("status", { length: 16 }).notNull().default("waiting"),
  missMode: varchar("miss_mode", { length: 16 }).notNull().default("persistent"),
  pieRule: boolean("pie_rule").notNull().default(false),
  /** When true, Mini App may highlight legal Quarto lines during declare (010). */
  declareHints: boolean("declare_hints").notNull().default(false),
  /** Vs-computer difficulty; null = human 1v1 (016). */
  difficulty: varchar("difficulty", { length: 16 }),
  modules: jsonb("modules").$type<string[]>().notNull().default(["classic4"]),
  settingsLocked: boolean("settings_locked").notNull().default(false),
  seat0: jsonb("seat0").$type<{ telegramUserId: string; joinedAt: string } | null>(),
  seat1: jsonb("seat1").$type<{ telegramUserId: string; joinedAt: string } | null>(),
  openerSeat: integer("opener_seat"),
  turnSeat: integer("turn_seat"),
  lastPlacerSeat: integer("last_placer_seat"),
  lastPlacedCell: integer("last_placed_cell"),
  firstPlaceDone: boolean("first_place_done").notNull().default(false),
  pieResolved: boolean("pie_resolved").notNull().default(false),
  voidClaimOpen: boolean("void_claim_open").notNull().default(false),
  pendingVoidSets: jsonb("pending_void_sets").$type<number[][]>().notNull().default([]),
  phase: varchar("phase", { length: 32 }).notNull().default("waiting"),
  board: jsonb("board").$type<(string | null)[] | Record<string, string | null>>().notNull(),
  pool: jsonb("pool").$type<string[]>().notNull(),
  pieceInHand: varchar("piece_in_hand", { length: 32 }),
  voidedSets: jsonb("voided_sets").$type<number[][]>().notNull().default([]),
  turnNotifiedAt: timestamp("turn_notified_at", { withTimezone: true }),
  outcome: jsonb("outcome"),
  rematchOfSessionId: varchar("rematch_of_session_id", { length: 64 }),
  rematchOffer: jsonb("rematch_offer").$type<{
    offeredBy: string;
    state: "offered" | "declined";
  } | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

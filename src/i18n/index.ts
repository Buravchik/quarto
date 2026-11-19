import { en } from "./en";
import { ru } from "./ru";

export type Lang = "en" | "ru";

const tables = { en, ru } as const;

export function t(lang: Lang | string | undefined) {
  return lang?.toLowerCase().startsWith("ru") ? tables.ru : tables.en;
}

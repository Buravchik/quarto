import { classic4 } from "./classic4";
import type { GameModule } from "./types";

const registry = new Map<string, GameModule>([[classic4.id, classic4]]);

export function registerModule(mod: GameModule) {
  registry.set(mod.id, mod);
}

export function getModule(id: string): GameModule | undefined {
  return registry.get(id);
}

export function resolveModules(ids: string[] | undefined): GameModule {
  const id = ids?.[0] && ids[0].length > 0 ? ids[0] : "classic4";
  const mod = getModule(id);
  if (!mod) {
    throw new Error(`unknown_module:${id}`);
  }
  return mod;
}

export type { GameModule } from "./types";

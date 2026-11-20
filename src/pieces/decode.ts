import { classic4 } from "../quarto/modules/classic4";
import { getChannelMap } from "./registry";
import type { ChannelValues, ModuleChannelMap } from "./types";

export { getChannelMap };

export function traitsBitmaskFor(moduleId: string, pieceId: string): number | null {
  if (moduleId === "classic4" || !moduleId) {
    const t = classic4.pieceSet.traits[pieceId];
    return typeof t === "number" ? t : null;
  }
  // Future modules: extend registry of trait tables; fall back to classic4 ids shape
  const t = classic4.pieceSet.traits[pieceId];
  return typeof t === "number" ? t : null;
}

export function decodeChannels(
  moduleId: string,
  pieceId: string,
  traitsBitmask?: number,
): ChannelValues | null {
  const map: ModuleChannelMap = getChannelMap(moduleId || "classic4");
  const mask =
    typeof traitsBitmask === "number" ? traitsBitmask : traitsBitmaskFor(moduleId || "classic4", pieceId);
  if (mask == null) return null;

  const out: ChannelValues = {
    tone: "dark",
    stature: "short",
    plan: "square",
    aperture: "solid",
  };

  for (const ch of map.channels) {
    const bitOn = ((mask >> ch.bitIndex) & 1) === 1;
    switch (ch.id) {
      case "tone":
        out.tone = bitOn ? "light" : "dark";
        break;
      case "stature":
        out.stature = bitOn ? "tall" : "short";
        break;
      case "plan":
        out.plan = bitOn ? "round" : "square";
        break;
      case "aperture":
        out.aperture = bitOn ? "hollow" : "solid";
        break;
      default:
        out[ch.id] = bitOn ? "true" : "false";
    }
  }
  return out;
}

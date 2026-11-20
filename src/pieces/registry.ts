import { classic4ChannelMap } from "./classic4Channels";
import type { ModuleChannelMap } from "./types";

const maps = new Map<string, ModuleChannelMap>([[classic4ChannelMap.moduleId, classic4ChannelMap]]);

export function registerChannelMap(map: ModuleChannelMap) {
  maps.set(map.moduleId, map);
}

export function getChannelMap(moduleId: string): ModuleChannelMap {
  return maps.get(moduleId) ?? classic4ChannelMap;
}

import type { ModuleChannelMap } from "./types";

/** classic4 bit → channel map (data-model classic4 table; matches engine bitmasks). */
export const classic4ChannelMap: ModuleChannelMap = {
  moduleId: "classic4",
  channels: [
    {
      id: "tone",
      bitIndex: 0,
      falseLabelKey: "traitToneDark",
      trueLabelKey: "traitToneLight",
    },
    {
      id: "stature",
      bitIndex: 1,
      falseLabelKey: "traitStatureShort",
      trueLabelKey: "traitStatureTall",
    },
    {
      id: "plan",
      bitIndex: 2,
      falseLabelKey: "traitPlanSquare",
      trueLabelKey: "traitPlanRound",
    },
    {
      id: "aperture",
      bitIndex: 3,
      falseLabelKey: "traitApertureSolid",
      trueLabelKey: "traitApertureHollow",
    },
  ],
};

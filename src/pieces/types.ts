export type TraitChannelId = "tone" | "stature" | "plan" | "aperture" | (string & {});

export type TraitChannel = {
  id: TraitChannelId;
  /** Index into module pieceSet.traits bitmask (data-model TraitChannel.bitIndex). */
  bitIndex: number;
  falseLabelKey: string;
  trueLabelKey: string;
};

export type ModuleChannelMap = {
  moduleId: string;
  channels: TraitChannel[];
};

export type ChannelValues = {
  tone: "light" | "dark";
  stature: "tall" | "short";
  plan: "round" | "square";
  aperture: "hollow" | "solid";
  [key: string]: string;
};

export type PieceSize = "sm" | "md" | "lg";
export type PieceEmphasis = "none" | "selected" | "inHand";

export type PieceAppearance = {
  pieceId: string;
  moduleId: string;
  channels: ChannelValues;
  size: PieceSize;
  emphasis: PieceEmphasis;
};

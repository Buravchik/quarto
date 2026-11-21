"use client";

import { decodeChannels } from "./decode";
import type { PieceEmphasis, PieceSize } from "./types";

type Props = {
  pieceId: string;
  moduleId?: string;
  size?: PieceSize;
  emphasis?: PieceEmphasis;
  decorative?: boolean;
  label?: string;
  className?: string;
};

const SIZE_PX: Record<PieceSize, number> = {
  sm: 36,
  md: 48,
  lg: 64,
};

export function PieceToken({
  pieceId,
  moduleId = "classic4",
  size = "md",
  emphasis = "none",
  decorative = false,
  label,
  className,
}: Props) {
  const channels = decodeChannels(moduleId, pieceId);
  const px = SIZE_PX[size];
  const fallback = !channels;

  const tone = channels?.tone ?? "dark";
  const stature = channels?.stature ?? "short";
  const plan = channels?.plan ?? "square";
  const aperture = channels?.aperture ?? "solid";

  const fill = tone === "light" ? "var(--ex-piece-light)" : "var(--ex-piece-dark)";
  const stroke = "var(--ex-piece-stroke)";
  // Hole must contrast with the body: surface-colored cutouts vanish on light pieces.
  const holeFill =
    tone === "light" ? "var(--ex-piece-hollow-on-light)" : "var(--ex-piece-hollow-on-dark)";
  const bodyH = stature === "tall" ? 78 : 48;
  const bodyY = stature === "tall" ? 14 : 36;
  const rx = plan === "round" ? 22 : 6;
  const bodyW = 44;
  const bodyX = (100 - bodyW) / 2;
  const holeR = aperture === "hollow" ? (plan === "round" ? 10 : 8) : 0;
  const scale = emphasis === "inHand" || emphasis === "selected" ? 1.08 : 1;

  const svg = (
    <svg
      width={px}
      height={px}
      viewBox="0 0 100 100"
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : label}
      data-piece-id={pieceId}
      data-piece-fallback={fallback ? "true" : undefined}
      data-channel-tone={tone}
      data-channel-stature={stature}
      data-channel-plan={plan}
      data-channel-aperture={aperture}
      data-emphasis={emphasis}
      style={{ display: "block", transform: `scale(${scale})`, transformOrigin: "center" }}
      className={className}
    >
      <rect
        x={bodyX}
        y={bodyY}
        width={bodyW}
        height={bodyH}
        rx={rx}
        ry={rx}
        fill={fill}
        stroke={stroke}
        strokeWidth={4}
      />
      {aperture === "hollow" ? (
        plan === "round" ? (
          <circle
            cx={50}
            cy={bodyY + bodyH / 2}
            r={holeR}
            fill={holeFill}
            stroke={stroke}
            strokeWidth={2.5}
          />
        ) : (
          <rect
            x={50 - holeR}
            y={bodyY + bodyH / 2 - holeR}
            width={holeR * 2}
            height={holeR * 2}
            rx={2}
            fill={holeFill}
            stroke={stroke}
            strokeWidth={2.5}
          />
        )
      ) : null}
      {fallback ? (
        <text x="50" y="55" textAnchor="middle" fill={stroke} fontSize="18">
          ?
        </text>
      ) : null}
    </svg>
  );

  return svg;
}

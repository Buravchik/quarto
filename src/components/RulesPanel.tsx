"use client";

type Copy = {
  rulesTitle: string;
  rulesClassic: string;
  rulesTraits: string;
  rulesDeclare: string;
  sessionRules: string;
  missVoid: string;
  missPersistent: string;
  pieRule: string;
  declareHints: string;
  rulesOn: string;
  rulesOff: string;
};

type Props = {
  missMode: "persistent" | "void";
  pieRule: boolean;
  declareHints: boolean;
  copy: Copy;
};

/** Inline classic + session rules (018). Parent controls visibility. */
export function RulesPanel({ missMode, pieRule, declareHints, copy }: Props) {
  const missLabel = missMode === "void" ? copy.missVoid : copy.missPersistent;
  return (
    <div className="ex-rules-panel" role="region" aria-label={copy.rulesTitle}>
      <p className="ex-rules-panel__title">{copy.rulesTitle}</p>
      <ul className="ex-rules-panel__list">
        <li>{copy.rulesClassic}</li>
        <li>{copy.rulesTraits}</li>
        <li>{copy.rulesDeclare}</li>
      </ul>
      <p className="ex-rules-panel__title">{copy.sessionRules}</p>
      <ul className="ex-rules-panel__list">
        <li>{missLabel}</li>
        <li>
          {copy.pieRule}: {pieRule ? copy.rulesOn : copy.rulesOff}
        </li>
        <li>
          {copy.declareHints}: {declareHints ? copy.rulesOn : copy.rulesOff}
        </li>
      </ul>
    </div>
  );
}

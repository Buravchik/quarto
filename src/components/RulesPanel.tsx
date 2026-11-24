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

/** Inline classic + non-default session rules (018/020). */
export function RulesPanel({ missMode, pieRule, declareHints, copy }: Props) {
  const sessionLines: string[] = [];
  if (missMode === "void") sessionLines.push(copy.missVoid);
  if (pieRule) sessionLines.push(`${copy.pieRule}: ${copy.rulesOn}`);
  if (declareHints) sessionLines.push(`${copy.declareHints}: ${copy.rulesOn}`);

  return (
    <div className="ex-rules-panel" role="region" aria-label={copy.rulesTitle}>
      <p className="ex-rules-panel__title">{copy.rulesTitle}</p>
      <ul className="ex-rules-panel__list">
        <li>{copy.rulesClassic}</li>
        <li>{copy.rulesTraits}</li>
        <li>{copy.rulesDeclare}</li>
      </ul>
      {sessionLines.length > 0 ? (
        <>
          <p className="ex-rules-panel__title">{copy.sessionRules}</p>
          <ul className="ex-rules-panel__list">
            {sessionLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

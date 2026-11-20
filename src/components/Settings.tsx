"use client";

type Props = {
  missMode: "persistent" | "void";
  pieRule: boolean;
  declareHints: boolean;
  locked: boolean;
  disabled?: boolean;
  labels: {
    sessionRules: string;
    missVoid: string;
    pieRule: string;
    declareHints: string;
    settingsLocked: string;
  };
  onChange: (next: {
    missMode: "persistent" | "void";
    pieRule: boolean;
    declareHints: boolean;
  }) => void;
};

/** Creator lobby Miss/Pie/hints; collapsed by default (011). */
export function Settings({
  missMode,
  pieRule,
  declareHints,
  locked,
  disabled,
  labels,
  onChange,
}: Props) {
  const readOnly = locked || disabled;
  return (
    <details className="ex-surface ex-rules">
      <summary className="ex-rules__summary">{labels.sessionRules}</summary>
      <fieldset disabled={readOnly} className="ex-rules__body">
        <label className="ex-rules__row">
          <input
            type="checkbox"
            checked={missMode === "void"}
            onChange={(e) =>
              onChange({
                missMode: e.target.checked ? "void" : "persistent",
                pieRule,
                declareHints,
              })
            }
          />
          {labels.missVoid}
        </label>
        <label className="ex-rules__row">
          <input
            type="checkbox"
            checked={pieRule}
            onChange={(e) =>
              onChange({ missMode, pieRule: e.target.checked, declareHints })
            }
          />
          {labels.pieRule}
        </label>
        <label className="ex-rules__row">
          <input
            type="checkbox"
            checked={declareHints}
            onChange={(e) =>
              onChange({ missMode, pieRule, declareHints: e.target.checked })
            }
          />
          {labels.declareHints}
        </label>
        {locked ? (
          <p className="ex-muted" style={{ margin: "0.5rem 0 0" }}>
            {labels.settingsLocked}
          </p>
        ) : null}
      </fieldset>
    </details>
  );
}

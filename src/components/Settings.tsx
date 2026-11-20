"use client";

type Props = {
  missMode: "persistent" | "void";
  pieRule: boolean;
  locked: boolean;
  disabled?: boolean;
  labels: {
    sessionRules: string;
    missVoid: string;
    pieRule: string;
    settingsLocked: string;
  };
  onChange: (next: { missMode: "persistent" | "void"; pieRule: boolean }) => void;
};

/** Creator lobby Miss/Pie checkboxes; hide after match start (GamePanel). */
export function Settings({ missMode, pieRule, locked, disabled, labels, onChange }: Props) {
  const readOnly = locked || disabled;
  return (
    <fieldset
      disabled={readOnly}
      className="ex-surface"
      style={{ margin: 0 }}
    >
      <legend style={{ padding: "0 0.35rem", fontFamily: "var(--ex-font-display)" }}>
        {labels.sessionRules}
      </legend>
      <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.4rem" }}>
        <input
          type="checkbox"
          checked={missMode === "void"}
          onChange={(e) =>
            onChange({ missMode: e.target.checked ? "void" : "persistent", pieRule })
          }
        />
        {labels.missVoid}
      </label>
      <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input
          type="checkbox"
          checked={pieRule}
          onChange={(e) => onChange({ missMode, pieRule: e.target.checked })}
        />
        {labels.pieRule}
      </label>
      {locked ? (
        <p className="ex-muted" style={{ margin: "0.5rem 0 0" }}>
          {labels.settingsLocked}
        </p>
      ) : null}
    </fieldset>
  );
}

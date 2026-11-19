"use client";

type Props = {
  missMode: "persistent" | "void";
  pieRule: boolean;
  locked: boolean;
  disabled?: boolean;
  onChange: (next: { missMode: "persistent" | "void"; pieRule: boolean }) => void;
};

/** Creator-only Miss/Pie checkboxes; disabled when settingsLocked. */
export function Settings({ missMode, pieRule, locked, disabled, onChange }: Props) {
  const readOnly = locked || disabled;
  return (
    <fieldset
      disabled={readOnly}
      style={{ border: "1px solid #335", padding: "0.75rem", margin: 0 }}
    >
      <legend style={{ padding: "0 0.35rem" }}>Session rules</legend>
      <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.4rem" }}>
        <input
          type="checkbox"
          checked={missMode === "void"}
          onChange={(e) =>
            onChange({ missMode: e.target.checked ? "void" : "persistent", pieRule })
          }
        />
        Miss (Void) — skipped sets die after opponent places
      </label>
      <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input
          type="checkbox"
          checked={pieRule}
          onChange={(e) => onChange({ missMode, pieRule: e.target.checked })}
        />
        Pie Rule — take/pass after first place
      </label>
      {locked ? <p style={{ margin: "0.5rem 0 0", opacity: 0.7 }}>Locked after join</p> : null}
    </fieldset>
  );
}

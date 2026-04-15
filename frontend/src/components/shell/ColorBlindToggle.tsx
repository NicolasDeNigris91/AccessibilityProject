"use client";
import { useEffect, useState } from "react";

const MODES = ["none", "protanopia", "deuteranopia", "tritanopia", "achromatopsia"] as const;
const LABELS: Record<(typeof MODES)[number], string> = {
  none: "Nenhum",
  protanopia: "Protanopia",
  deuteranopia: "Deuteranopia",
  tritanopia: "Tritanopia",
  achromatopsia: "Acromatopsia",
};
type Mode = (typeof MODES)[number];

export function ColorBlindToggle() {
  const [mode, setMode] = useState<Mode>("none");

  useEffect(() => {
    const html = document.documentElement;
    MODES.forEach((m) => m !== "none" && html.classList.remove(`cb-${m}`));
    if (mode !== "none") html.classList.add(`cb-${mode}`);
  }, [mode]);

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only md:not-sr-only text-muted">Daltonismo:</span>
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as Mode)}
        className="rounded border border-line bg-surface px-2 py-1 text-ink"
        aria-label="Simular tipo de daltonismo"
      >
        {MODES.map((m) => (
          <option key={m} value={m}>
            {LABELS[m]}
          </option>
        ))}
      </select>
    </label>
  );
}

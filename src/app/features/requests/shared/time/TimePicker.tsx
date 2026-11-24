import * as React from 'react';
import './time-picker.css';

const two = (n: number) => String(n).padStart(2, '0');
const parseTime = (value: string) => { const m = /^(\d{2}):(\d{2})$/.exec(value); return m ? { h: Number(m[1]), m: Number(m[2]) } : null; };

export default function TimePicker({ value, onChange, disabled = false }: { value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const t = parseTime(value);
  const set = (h: number, m: number) => onChange(`${two(h)}:${two(m)}`);
  // Horas de 1 en 1; minutos de 5 en 5. Si aún no hay hora, el primer toque propone 09:00.
  const step = (part: "h" | "m", dir: 1 | -1) => {
    if (disabled) return;
    if (!t) { set(9, 0); return; }
    if (part === "h") set((t.h + dir + 24) % 24, t.m);
    else set(t.h, dir > 0 ? ((Math.floor(t.m / 5) + 1) * 5) % 60 : ((Math.ceil(t.m / 5) - 1 + 12) % 12) * 5);
  };
  const spin = (part: "h" | "m") => {
    const now = t ? (part === "h" ? t.h : t.m) : null;
    const label = part === "h" ? "Hora" : "Minutos";
    return <div className="zipco-tp-s">
      <button type="button" disabled={disabled} className="zipco-tp-b" aria-label={part === "h" ? "Una hora menos" : "Cinco minutos menos"} onClick={() => step(part, -1)}>−</button>
      <div role="spinbutton" tabIndex={disabled ? -1 : 0} aria-disabled={disabled || undefined} aria-label={label} aria-valuemin={0} aria-valuemax={part === "h" ? 23 : 59} aria-valuenow={now ?? undefined}
        aria-valuetext={now === null ? "Sin elegir" : part === "h" ? `${now} horas` : `${now} minutos`} className="zipco-tp-v" data-empty={now === null || undefined}
        onKeyDown={event => { const d = event.key === "ArrowUp" ? 1 : event.key === "ArrowDown" ? -1 : 0; if (d) { event.preventDefault(); step(part, d); } }}>
        <b>{now === null ? "––" : two(now)}</b><em>{part === "h" ? "hora" : "min"}</em>
      </div>
      <button type="button" disabled={disabled} className="zipco-tp-b zipco-tp-pl" aria-label={part === "h" ? "Una hora más" : "Cinco minutos más"} onClick={() => step(part, 1)}>+</button>
    </div>;
  };
  return <div className="zipco-tp" role="group" aria-label="Hora de Chile">
    <span className="zipco-tp-l" aria-hidden="true">Hora de Chile</span>
    <div className="zipco-tp-r">{spin("h")}<b className="zipco-tp-c" aria-hidden="true">:</b>{spin("m")}</div>
  </div>;
}

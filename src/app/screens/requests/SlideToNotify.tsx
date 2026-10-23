import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { Check, ChevronRight, Package } from 'lucide-react';

export type SlidePhase = 'work' | 'sending' | 'sent';
const SPARKS: Array<[x: number, y: number, color: string, size: number]> = [
  [-96, -26, '#5eead4', 6], [-60, -34, '#fde68a', 5], [-18, -40, '#c4b5fd', 7], [30, -38, '#f0abfc', 5],
  [74, -32, '#67e8f9', 7], [104, -14, '#fde68a', 5], [-104, 10, '#c4b5fd', 5], [108, 16, '#5eead4', 6],
];
const HANDLE = 56;       // ancho reservado para el botón redondo (px)
const THRESHOLD = 0.85;  // al soltar con ≥85 % del recorrido se completa; si no, vuelve al inicio
const vars = (values: Record<string, string | number>) => Object.fromEntries(Object.entries(values).map(([k, v]) => [`--${k}`, v])) as CSSProperties;

/**
 * "Desliza para avisar". Control controlado por la tarjeta: `phase` lo manda la tarjeta (work → sending → sent).
 * - Arrastre con listeners en `window` (pointermove / pointerup / pointercancel / blur / contextmenu / mouseleave del documento):
 *   así NUNCA queda "pegado" aunque el dedo/mouse salga del control o de la ventana (bug visto en el diseño).
 * - Un toque sin arrastre NO completa: hace un pequeño "tirón" del botón (hint) para enseñar el gesto.
 * - Teclado / lector de pantalla: el botón es un <button> real; Enter o Espacio (click con detail === 0) completa directamente.
 * - `onComplete` se llama UNA vez al completar. La tarjeta decide qué hacer (POST) y, si falla, vuelve `phase` a 'work' (el botón se reinicia).
 */
export default function SlideToNotify({ phase, disabled, onComplete, label = 'Desliza para avisar', sendingLabel = 'Avisando al cliente…', sentLabel = 'Aviso enviado', ariaLabel = 'Notificar pedido listo', describedBy }: {
  phase: SlidePhase; disabled?: boolean; onComplete: () => void; label?: string; sendingLabel?: string; sentLabel?: string; ariaLabel?: string; describedBy?: string;
}) {
  const [p, setP] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [hint, setHint] = useState(false);
  const drag = useRef<{ x0: number; travel: number; moved: boolean; pointerId: number } | null>(null);
  const pRef = useRef(0);
  const cleanup = useRef<(() => void) | null>(null);
  const hintTimer = useRef<number | undefined>(undefined);
  const setProgress = useCallback((value: number) => { pRef.current = value; setP(value); }, []);

  useEffect(() => () => { cleanup.current?.(); window.clearTimeout(hintTimer.current); }, []);
  // Si la operación falla, la tarjeta devuelve phase a 'work': el botón vuelve al inicio.
  useEffect(() => { if (phase === 'work') { setProgress(0); setDragging(false); } }, [phase, setProgress]);
  useEffect(() => { if (disabled || phase !== 'work') { cleanup.current?.(); cleanup.current = null; drag.current = null; setDragging(false); } }, [disabled, phase]);

  const finish = useCallback(() => {
    cleanup.current?.(); cleanup.current = null;
    const state = drag.current; drag.current = null;
    if (!state) return;
    if (state.moved && pRef.current >= THRESHOLD) { setProgress(1); setDragging(false); onComplete(); return; }
    setDragging(false); setProgress(0);
    if (!state.moved) { setHint(true); window.clearTimeout(hintTimer.current); hintTimer.current = window.setTimeout(() => setHint(false), 900); }
  }, [onComplete, setProgress]);

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (phase !== 'work' || disabled || !event.isPrimary || event.button !== 0 || drag.current) return;
    event.preventDefault();
    const track = event.currentTarget.parentElement as HTMLElement;
    const scale = track.getBoundingClientRect().width / track.offsetWidth || 1; // por si la pantalla está escalada
    const travel = (track.offsetWidth - HANDLE) * scale;
    if (travel <= 0) return;
    drag.current = { x0: event.clientX, travel, moved: false, pointerId: event.pointerId };
    cleanup.current?.();
    const move = (ev: PointerEvent) => {
      const state = drag.current; if (!state || state.pointerId !== ev.pointerId) return;
      if (ev.pointerType !== 'touch' && ev.buttons === 0) { finish(); return; } // el botón del mouse se soltó fuera de la ventana
      const dx = ev.clientX - state.x0;
      if (Math.abs(dx) > 4) state.moved = true;
      setProgress(Math.max(0, Math.min(1, dx / state.travel)));
    };
    const up = (ev: PointerEvent) => { if (ev.pointerId === drag.current?.pointerId) finish(); };
    const cancel = () => { cleanup.current?.(); cleanup.current = null; drag.current = null; setDragging(false); setProgress(0); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    (['pointercancel', 'blur', 'contextmenu'] as const).forEach(name => window.addEventListener(name, cancel));
    document.addEventListener('mouseleave', cancel);
    cleanup.current = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      (['pointercancel', 'blur', 'contextmenu'] as const).forEach(name => window.removeEventListener(name, cancel));
      document.removeEventListener('mouseleave', cancel);
    };
    setHint(false); setDragging(true);
  };
  // click con detail === 0 ⇒ activado por teclado / lector de pantalla (el puntero siempre trae detail ≥ 1).
  const onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.detail !== 0 || phase !== 'work' || disabled) return;
    setProgress(1); onComplete();
  };

  const handleClass = dragging ? 'drag' : phase !== 'work' ? 'fin' : hint ? 'hint' : p === 0 ? 'idle' : '';
  return <div className="zipco-ec-sl"><div className="zipco-ec-slw">
    {phase === 'sending' && <span className="zipco-co-us" aria-hidden="true">{SPARKS.map(([x, y, c, s], i) => <i key={i} style={vars({ x: `${x}px`, y: `${y}px`, c, s })} />)}</span>}
    <div className={`zipco-ec-tr${dragging ? ' drag' : ''}`} style={vars({ p })}>
      <span className="zipco-ec-slf" aria-hidden="true" />
      <span className="zipco-ec-slt" aria-hidden="true"><span className="l">{label}</span>
        <span className="zipco-ec-chv"><ChevronRight size={17} strokeWidth={3.2} /><ChevronRight size={17} strokeWidth={3.2} /><ChevronRight size={17} strokeWidth={3.2} /></span></span>
      {phase === 'sending' && <span className="zipco-ec-sent" aria-hidden="true"><span className="zipco-co-spin2" />{sendingLabel}</span>}
      {phase === 'sent' && <span className="zipco-ec-sent" aria-hidden="true"><Check size={18} strokeWidth={3.2} />{sentLabel}</span>}
      <button type="button" className={`zipco-ec-hd ${handleClass}`.trim()} aria-label={ariaLabel} aria-describedby={describedBy}
        disabled={disabled || phase !== 'work'} onPointerDown={onPointerDown} onClick={onClick}
        onKeyDown={event => {
          if ((event.key === 'Enter' || event.key === ' ') && phase === 'work' && !disabled) {
            event.preventDefault(); setProgress(1); onComplete();
          }
        }}>
        <Package size={24} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </div>
  </div>
    <p className="sr-only" role="status">{phase === 'sending' ? sendingLabel : phase === 'sent' ? sentLabel : ''}</p>
  </div>;
}

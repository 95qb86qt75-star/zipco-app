import { useEffect, useState } from 'react';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { readCoordinationSession, subscribeCoordinationSession } from './coordinationSession';

/** Evento global: cualquiera de las dos partes aceptó y el trato quedó cerrado. */
export const DEAL_CLOSED_EVENT = 'zipco-deal-closed';
export const announceDealClosed = (key: string) => window.dispatchEvent(new CustomEvent(DEAL_CLOSED_EVENT, { detail: { key } }));

const SPARKS: [string, string, string, string][] = [
  ['118px','-20px','#5eead4','5'],
  ['126px','40px','#c4b5fd','7'],
  ['101px','106px','#f0abfc','9'],
  ['26px','95px','#fde68a','5'],
  ['-31px','116px','#67e8f9','7'],
  ['-101px','106px','#5eead4','9'],
  ['-106px','31px','#c4b5fd','5'],
  ['-140px','-19px','#f0abfc','7'],
  ['-145px','-90px','#fde68a','9'],
  ['-73px','-112px','#67e8f9','5'],
  ['-31px','-156px','#5eead4','7'],
  ['36px','-177px','#c4b5fd','9'],
  ['73px','-112px','#f0abfc','5'],
  ['126px','-80px','#fde68a','7'],
];
const FULL_MS = 5700;   // coincide con la animación de 5.6 s
const REDUCED_MS = 2200; // prefers-reduced-motion: sin animación, solo el mensaje

/** Holograma "Cierre exitoso" (dos manos que se estrechan). Se monta UNA vez en la raíz de la pantalla de pedidos
 *  y se muestra con announceDealClosed(), así funciona aunque el componente que aceptó ya se haya desmontado. */
export default function DealSuccessHost() {
  const [shown, setShown] = useState(0); // clave: reinicia la animación si se dispara de nuevo
  useEffect(() => {
    const seen = new Set<string>();
    let session = readCoordinationSession();
    const on = (event: Event) => {
      const key = (event as CustomEvent).detail?.key;
      if (typeof key !== 'string' || seen.has(key)) return;
      seen.add(key);
      if (seen.size > 100) seen.delete(seen.values().next().value!);
      session = readCoordinationSession();
      setShown(value => value + 1);
    };
    window.addEventListener(DEAL_CLOSED_EVENT, on);
    const unsubscribe = subscribeCoordinationSession(() => { if (session !== readCoordinationSession()) setShown(0); });
    return () => { window.removeEventListener(DEAL_CLOSED_EVENT, on); unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!shown) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setShown(0), reduced ? REDUCED_MS : FULL_MS);
    return () => window.clearTimeout(timer);
  }, [shown]);
  if (!shown || typeof document === 'undefined') return null;
  return createPortal(
    <div key={shown} className="zipco-d-hs" role="status" aria-live="polite" aria-label="Cierre exitoso">
      <div className="zipco-d-hs-in">
        <div className="zipco-d-hs-stage" aria-hidden="true">
          <span className="zipco-d-hs-beam" /><span className="zipco-d-hs-ring a" /><span className="zipco-d-hs-ring b" /><span className="zipco-d-hs-shock" />
          {SPARKS.map(([x, y, c, s], i) => <i key={i} className="zipco-d-sp" style={{ ['--x' as string]: x, ['--y' as string]: y, ['--c' as string]: c, ['--s' as string]: s }} />)}
          <svg className="zipco-d-hs-icon" viewBox="0 0 24 24" fill="none" stroke="url(#zipco-d-hsg)" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
            <defs><linearGradient id="zipco-d-hsg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5eead4" /><stop offset=".5" stopColor="#a78bfa" /><stop offset="1" stopColor="#f0abfc" /></linearGradient></defs>
            <g className="zipco-d-hshake">
              <g className="zipco-d-hl"><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" /><path d="M3 4h8" /><path d="m11 17 2 2a1 1 0 1 0 3-3" /></g>
              <g className="zipco-d-hr"><path d="m21 3 1 11h-2" /><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" /></g>
            </g>
          </svg>
          <span className="zipco-d-hs-scan" /><span className="zipco-d-hs-base" />
        </div>
        <div className="zipco-d-hs-title">Cierre exitoso</div>
      </div>
    </div>,
    document.body);
}

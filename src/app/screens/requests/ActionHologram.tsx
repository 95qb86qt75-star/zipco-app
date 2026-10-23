import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { readCoordinationSession, subscribeCoordinationSession } from './coordinationSession';

/**
 * Holograma TRANSVERSAL de acción (diseño Q). Una sola pieza para todos los avisos tipo "Alternativa enviada",
 * "Contacto autorizado", "Pedido listo", "Solicitud anulada"… Cambia el ícono, los colores y la animación según `kind`.
 * Se monta UNA vez (junto a <DealSuccessHost />) y se dispara con announceAction(kind) desde cualquier parte, así sigue
 * visible aunque el componente que lo disparó se desmonte al cambiar el pedido de pestaña.
 */
export type ActionKind = 'alternative' | 'final' | 'counter' | 'authorized' | 'redirecting' | 'accepted' | 'started' | 'ready' | 'rejected' | 'annulled';

export const ACTION_HOLOGRAM_EVENT = 'zipco-action-hologram';
let sequence = 0;
type Feedback = { kind: ActionKind; id: number; title?: string; description?: string; key?: string; session: ReturnType<typeof readCoordinationSession> };
export const announceAction = (kind: ActionKind, text?: { title?: string; description?: string; key?: string }) => {
  const id = ++sequence;
  window.dispatchEvent(new CustomEvent(ACTION_HOLOGRAM_EVENT, { detail: { kind, id, ...text, session: readCoordinationSession() } }));
  return id;
};
/** Oculta el holograma (p. ej. si la operación falló después de anunciarlo). */
export const dismissAction = () => window.dispatchEvent(new CustomEvent(ACTION_HOLOGRAM_EVENT, { detail: null }));

type Shape = readonly [tag: 'path' | 'circle', attrs: Record<string, string>];
type Motion = 'fly' | 'swap' | 'pop' | 'shake';
type Variant = {
  title: string; desc: string; icon: readonly Shape[]; motion: Motion;
  colors: readonly [c1: string, c2: string, c3: string]; glow: readonly [g1: string, g2: string];
};

const SEND: Shape[] = [['path', { d: 'M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z' }], ['path', { d: 'm21.854 2.147-10.94 10.939' }]];
const SWAP: Shape[] = [['path', { d: 'M8 3 4 7l4 4' }], ['path', { d: 'M4 7h16' }], ['path', { d: 'm16 21 4-4-4-4' }], ['path', { d: 'M20 17H4' }]];
const WA: Shape[] = [['path', { d: 'M3 21l1.65-4.9A9 9 0 1 1 8 19.4z' }], ['path', { d: 'M9.2 8.6c0 3.4 2.8 6.2 6.2 6.2l1-1.4-2-1-.9.8c-.9-.4-1.8-1.3-2.2-2.2l.8-.9-1-2z' }]];
const PKG: Shape[] = [['path', { d: 'M12 22V12' }], ['path', { d: 'm16 17 2 2 4-4' }], ['path', { d: 'M21 11.127V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.729l7 4a2 2 0 0 0 2 .001l1.32-.753' }], ['path', { d: 'M3.29 7 12 12l8.71-5' }], ['path', { d: 'm7.5 4.27 8.997 5.148' }]];
const XCIRCLE: Shape[] = [['circle', { cx: '12', cy: '12', r: '10' }], ['path', { d: 'm15 9-6 6' }], ['path', { d: 'm9 9 6 6' }]];
const FILECHECK: Shape[] = [['path', { d: 'M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z' }], ['path', { d: 'M14 2v5a1 1 0 0 0 1 1h5' }], ['path', { d: 'm9 15 2 2 4-4' }]];
// El basurero va en dos partes para animar la tapa por separado.
const TRASH_BODY: Shape[] = [['path', { d: 'M10 11v6' }], ['path', { d: 'M14 11v6' }], ['path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6' }]];
const TRASH_LID: Shape[] = [['path', { d: 'M3 6h18' }], ['path', { d: 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }]];

/**
 * TEXTOS. Solo "alternative" y "final" existen hoy en `proposalSentFeedback.ts`: al integrar, toma título y descripción de ahí
 * (son los reales). El resto son propuestas del diseño: revísalas con producto antes de publicar.
 */
const VARIANTS: Record<ActionKind, Variant> = {
  accepted: { title: 'Propuesta aceptada', desc: 'Ya están de acuerdo. Revisa la autorización de contacto en Coordinación para continuar por WhatsApp.', icon: FILECHECK, motion: 'pop', colors: ['#4ade80', '#16a34a', '#bbf7d0'], glow: ['rgba(74,222,128,.5)', 'rgba(52,211,153,.4)'] },
  started: { title:'Pedido en curso',desc:'Coordinación confirmada. Avisa al cliente cuando el pedido esté listo.',icon:[['circle',{cx:'12',cy:'12',r:'10'}],['path',{d:'m7 12 3 3 7-7'}]],motion:'pop',colors:['#5eead4','#0891b2','#a78bfa'],glow:['rgba(34,211,238,.45)','rgba(139,92,246,.4)'] },
  alternative: { title: 'Alternativa enviada al cliente', desc: 'En Mi Negocio queda en «Esperando respuesta». El cliente la encontrará en «Por responder».', icon: SEND, motion: 'fly', colors: ['#a78bfa', '#6366f1', '#5eead4'], glow: ['rgba(139,92,246,.45)', 'rgba(94,234,212,.4)'] },
  final: { title: 'Propuesta final enviada al cliente', desc: 'En Mi Negocio queda en «Esperando respuesta». El cliente la encontrará en «Por responder».', icon: SEND, motion: 'fly', colors: ['#c084fc', '#7c3aed', '#f0abfc'], glow: ['rgba(192,132,252,.5)', 'rgba(240,171,252,.4)'] },
  counter: { title: 'Contrapropuesta enviada', desc: 'El negocio la verá en «Esperando respuesta» y podrá revisarla para responder.', icon: SWAP, motion: 'swap', colors: ['#5eead4', '#0d9488', '#a78bfa'], glow: ['rgba(45,212,191,.45)', 'rgba(139,92,246,.4)'] },
  authorized: { title: 'Contacto autorizado', desc: 'Autorizaste compartir tu teléfono solo para este pedido. El consentimiento de la otra parte es independiente.', icon: WA, motion: 'pop', colors: ['#34d399', '#059669', '#5eead4'], glow: ['rgba(52,211,153,.5)', 'rgba(45,212,191,.4)'] },
  redirecting: { title: 'Te estamos redirigiendo a WhatsApp', desc: 'Abriendo la conversación para coordinar el pedido…', icon: WA, motion: 'pop', colors: ['#34d399', '#059669', '#5eead4'], glow: ['rgba(52,211,153,.5)', 'rgba(45,212,191,.4)'] },
  ready: { title: 'Pedido listo', desc: 'El pedido quedó marcado como listo. El cliente debe confirmar el aviso y coordinar el retiro.', icon: PKG, motion: 'pop', colors: ['#5eead4', '#0891b2', '#a78bfa'], glow: ['rgba(34,211,238,.45)', 'rgba(139,92,246,.4)'] },
  rejected: { title: 'Propuesta rechazada', desc: 'La solicitud finalizó y quedó en «Historial».', icon: XCIRCLE, motion: 'shake', colors: ['#fb7185', '#be123c', '#f0abfc'], glow: ['rgba(251,113,133,.5)', 'rgba(192,132,252,.35)'] },
  annulled: { title: 'Solicitud anulada', desc: 'Pasó a «Historial» y conserva sus condiciones aceptadas.', icon: TRASH_BODY, motion: 'shake', colors: ['#fb7185', '#e11d48', '#fda4af'], glow: ['rgba(251,113,133,.5)', 'rgba(244,114,182,.35)'] },
};

// Chispas de salida: [x px, y px, color, tamaño]
const SPARKS: ReadonlyArray<readonly [number, number, string, number]> = [
  [118, -20, '#5eead4', 5], [126, 40, '#c4b5fd', 7], [101, 106, '#f0abfc', 9], [26, 95, '#fde68a', 5], [-31, 116, '#67e8f9', 7],
  [-101, 106, '#5eead4', 9], [-106, 31, '#c4b5fd', 5], [-140, -19, '#f0abfc', 7], [-145, -90, '#fde68a', 9], [-73, -112, '#67e8f9', 5],
  [-31, -156, '#5eead4', 7], [36, -177, '#c4b5fd', 9], [73, -112, '#f0abfc', 5], [126, -80, '#fde68a', 7],
];
const FULL_MS = 4300;   // coincide con la animación de 4,2 s
const REDUCED_MS = 2200; // prefers-reduced-motion: sin animación, solo el mensaje

const Shapes = ({ shapes }: { shapes: readonly Shape[] }) => <>{shapes.map(([tag, attrs], index) => {
  const Tag = tag;
  return <Tag key={index} {...attrs} pathLength={1} className="zipco-ah-dr" />;
})}</>;

export default function ActionHologramHost() {
  const [shown, setShown] = useState<Feedback | null>(null);
  useEffect(() => {
    const seen = new Set<string>();
    let session = readCoordinationSession();
    const on = (event: Event) => {
      const value = (event as CustomEvent<Feedback | null>).detail;
      if (!value) { setShown(null); return; }
      if (!Object.hasOwn(VARIANTS, value.kind) || value.session !== readCoordinationSession()) return;
      session = value.session;
      const key = value.key ? `${value.session?.revision}:${value.key}` : null;
      if (key && seen.has(key)) return;
      if (key) { seen.add(key); if (seen.size > 100) seen.delete(seen.values().next().value!); }
      setShown(value);
    };
    window.addEventListener(ACTION_HOLOGRAM_EVENT, on);
    const unsubscribe = subscribeCoordinationSession(() => {
      const next = readCoordinationSession();
      if (session !== next) { setShown(null); seen.clear(); session = next; }
    });
    return () => { window.removeEventListener(ACTION_HOLOGRAM_EVENT, on); unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!shown) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setShown(null), reduced ? REDUCED_MS : FULL_MS);
    return () => window.clearTimeout(timer);
  }, [shown]);
  return shown ? <ActionHologram key={shown.id} kind={shown.kind} title={shown.title} description={shown.description} /> : null;
}

export function ActionHologram({ kind, title, description }: { kind: ActionKind; title?: string; description?: string }) {
  if (typeof document === 'undefined') return null;
  const v = VARIANTS[kind];
  const style = { ['--c1' as string]: v.colors[0], ['--c2' as string]: v.colors[1], ['--c3' as string]: v.colors[2], ['--g1' as string]: v.glow[0], ['--g2' as string]: v.glow[1] };
  return createPortal(
    <div className="zipco-ah" role="status" aria-live="polite" aria-label={title ?? v.title} style={style}>
      <div className="zipco-ah-in">
        <div className="zipco-ah-st" aria-hidden="true">
          <span className="zipco-ah-rays" /><span className="zipco-ah-rg" /><span className="zipco-ah-rg b" />
          {SPARKS.map(([x, y, c, s], i) => <i key={i} className="zipco-ah-sp" style={{ ['--x' as string]: `${x}px`, ['--y' as string]: `${y}px`, ['--c' as string]: c, ['--s' as string]: s }} />)}
          <span className="zipco-ah-orb"><span className={`m ${v.motion}`}>
            <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Shapes shapes={v.icon} />
              {kind === 'annulled' && <g className="lid"><Shapes shapes={TRASH_LID} /></g>}
            </svg>
          </span></span>
        </div>
        <div className="zipco-ah-t">{title ?? v.title}</div>
        <div className="zipco-ah-d">{description ?? v.desc}</div>
      </div>
    </div>,
    document.body);
}

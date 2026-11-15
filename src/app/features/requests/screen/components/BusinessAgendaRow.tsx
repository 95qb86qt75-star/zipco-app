import * as React from 'react';
import { CalendarDays, CircleHelp, ClipboardCheck, Hand, TriangleAlert, Zap } from 'lucide-react';
import { agendaHeading, describeSchedule, type AgendaGroup, type AgreedSchedule } from '../../domain/businessAgenda';

const TONE: Record<AgendaGroup, string> = {
  asap: 'is-now', today: 'is-now', tomorrow: 'is-tomorrow', upcoming: 'is-upcoming', past: 'is-past', unverified: 'is-unverified',
};

/** Encabezado de grupo: no interactivo; solo organiza la lista. */
export function AgendaGroupHeading({ group, nowMs }: { group: AgendaGroup; nowMs: number }) {
  const { title, hint } = agendaHeading(group, nowMs);
  const Icon = group === 'asap' ? Zap : group === 'past' ? TriangleAlert : group === 'unverified' ? CircleHelp : CalendarDays;
  return (
    <h3 className={`zipco-agenda-heading ${TONE[group]}`}>
      <Icon size={15} strokeWidth={2.4} aria-hidden="true" />
      <strong>{title}</strong>{hint && <span>{hint}</span>}<i aria-hidden="true" />
    </h3>
  );
}

/** Separador por fecha de solicitud para «Recientes»/«Antiguas» (igual que antes: order.date). */
export function AgendaRequestDay({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-2 pt-1 text-xs font-bold text-slate-500">
      <CalendarDays className="h-4 w-4" />
      <span>{date}</span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

const norm = (text?: string | null) => (text ?? '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('es-CL');

/**
 * Marca la fila con `data-redundant-status` cuando la píldora de estado de la tarjeta no aporta nada nuevo:
 * en retiro, cuando repite el título de la fila de estado; en WhatsApp, cuando solo dice «En curso» (la pestaña ya lo dice).
 * Solo lee el DOM de la tarjeta; el CSS usa la marca para ganar altura en la agenda compacta.
 */
function useRedundantStatusMark(ref: React.RefObject<HTMLDivElement | null>) {
  React.useLayoutEffect(() => {
    const row = ref.current;
    if (!row) return;
    const sync = () => {
      const whatsapp = row.querySelector('.zipco-bp-pill b');
      const pickup = row.querySelector('.zipco-co-pill');
      const title = row.querySelector('.zipco-co-colrow .tx b');
      const redundant = whatsapp
        ? norm(whatsapp.textContent) === 'en curso'
        : Boolean(pickup && title && norm(pickup.textContent) !== '' && norm(pickup.textContent) === norm(title.textContent));
      if (row.hasAttribute('data-redundant-status') !== redundant) row.toggleAttribute('data-redundant-status', redundant);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(row, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [ref]);
}

/* ============================================================================================
 * «Cerrar solicitud» · swipe (solo presentación y navegación; no ejecuta nada por sí mismo)
 *
 * Contrato con la tarjeta (BusinessProgressCardView.tsx), solo por DOM y eventos; no se modifica ninguna tarjeta ni su controlador:
 *  - La tarjeta marca su <article> con `data-close-request` SOLO cuando existe esa opción (CloseRequestContext.available).
 *    Sin esa marca la fila no tiene swipe, ni botón, ni aviso.
 *  - Esta fila le pide abrir la hoja con el evento `zipco:close-request-open` sobre ese <article>.
 *  - La tarjeta avisa con `zipco:close-request-closed` (la hoja se cerró sin guardar) y `zipco:close-request-saved`
 *    (el servidor respondió con éxito). Solo con ese último evento la fila anima su salida; no hay salida local sin respuesta válida.
 * El swipe solo DESCUBRE el botón: soltar el dedo nunca abre la hoja, guarda, cancela ni finaliza.
 * ============================================================================================ */
const EVT_OPEN = 'zipco:close-request-open';
const EVT_CLOSED = 'zipco:close-request-closed';
const EVT_SAVED = 'zipco:close-request-saved';
const EVT_ROW_OPEN = 'zipco:agenda-swipe-open';
const REVEAL = 108;       // ancho del botón revelado (px)
const SETTLE_AT = 0.45;   // al soltar con ≥45 % del recorrido queda abierto; si no, vuelve
const NO_SWIPE = 'button,a,[role="button"],.zipco-co-av,.zipco-bp-th,.zipco-product-preview,.zipco-ec-sl,.zipco-agenda-act,input,textarea,select,[data-no-swipe]';

/** Cuántas filas tienen swipe activo (para que el aviso solo aparezca si sirve). */
const swipeStore = (() => {
  let count = 0;
  const subs = new Set<() => void>();
  const emit = () => subs.forEach(fn => fn());
  return {
    inc() { count += 1; emit(); },
    dec() { count = Math.max(0, count - 1); emit(); },
    get: () => count,
    subscribe(fn: () => void) { subs.add(fn); return () => { subs.delete(fn); }; },
  };
})();

function useAgendaSwipe(ref: React.RefObject<HTMLDivElement | null>) {
  const [enabled, setEnabled] = React.useState(false);
  const [revealed, setRevealed] = React.useState(false);
  const settleRef = React.useRef<(open: boolean) => void>(() => undefined);

  // La fila tiene swipe solo si la tarjeta lo declara (data-close-request).
  React.useLayoutEffect(() => {
    const row = ref.current;
    if (!row) return;
    const sync = () => setEnabled(Boolean(row.querySelector('[data-close-request]')));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(row, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-close-request'] });
    return () => observer.disconnect();
  }, [ref]);

  React.useEffect(() => {
    if (!enabled) return;
    swipeStore.inc();
    return () => swipeStore.dec();
  }, [enabled]);

  React.useEffect(() => {
    const row = ref.current;
    if (!enabled || !row) return;
    row.dataset.swipe = 'idle';
    let gesture: { id: number; x: number; y: number; base: number; lock: 0 | 1 | -1; dx: number } | null = null;
    let swallowUntil = 0;

    const setX = (x: number) => row.style.setProperty('--ag-sx', `${x}px`);
    const unfolded = () => Boolean(row.querySelector('.zipco-co-fb[data-folded="false"]'));
    const swipeable = () => Boolean(row.querySelector('[data-close-request]')) && !unfolded();
    const settle = (open: boolean) => {
      row.dataset.swipe = open ? 'open' : 'idle';
      setX(open ? -REVEAL : 0);
      setRevealed(open);
      if (open) window.dispatchEvent(new CustomEvent(EVT_ROW_OPEN, { detail: row }));
    };
    settleRef.current = settle;

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary || gesture || !swipeable()) return;
      if ((event.target as Element | null)?.closest(NO_SWIPE)) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, base: row.dataset.swipe === 'open' ? -REVEAL : 0, lock: 0, dx: 0 };
    };
    const onMove = (event: PointerEvent) => {
      if (!gesture || event.pointerId !== gesture.id) return;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      if (!gesture.lock) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        gesture.lock = Math.abs(dx) > Math.abs(dy) * 1.4 ? 1 : -1; // vertical: se deja el scroll al navegador
        if (gesture.lock === 1) {
          try { row.setPointerCapture(event.pointerId); } catch { /* sin captura: el gesto sigue por la fila */ }
          row.dataset.swipe = 'drag';
        }
      }
      if (gesture.lock !== 1) return;
      let x = Math.max(-REVEAL - 16, Math.min(0, gesture.base + dx));
      if (x < -REVEAL) x = -REVEAL + (x + REVEAL) * 0.4; // resistencia al pasarse
      gesture.dx = x;
      setX(x);
    };
    const onEnd = (event: PointerEvent) => {
      if (!gesture || event.pointerId !== gesture.id) return;
      const done = gesture;
      gesture = null;
      if (done.lock !== 1) return;
      swallowUntil = Date.now() + 350; // el clic que sigue a un arrastre no debe abrir ni pulsar nada
      settle(event.type === 'pointerup' ? done.dx < -REVEAL * SETTLE_AT : done.base !== 0);
    };
    const onClickCapture = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest('.zipco-agenda-act')) return;
      const dragged = Date.now() < swallowUntil; // el clic que cierra un arrastre no debe cerrar lo recién abierto
      if (dragged || row.dataset.swipe === 'open') {
        event.preventDefault();
        event.stopPropagation();
        if (!dragged) settle(false);
      }
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && row.dataset.swipe === 'open') settle(false); };
    const onOtherOpen = (event: Event) => { if ((event as CustomEvent).detail !== row && row.dataset.swipe === 'open') settle(false); };
    const onOutside = (event: PointerEvent) => { if (row.dataset.swipe === 'open' && !row.contains(event.target as Node)) settle(false); };
    const onSheetClosed = () => settle(false);
    const onSaved = (event:Event) => {
      const detail=(event as CustomEvent<{complete?:()=>void;claim?:()=>void}>).detail;
      detail?.claim?.();
      let finished=false;
      const complete=()=>{if(finished)return;finished=true;row.removeEventListener('animationend',onAnimation);clearTimeout(timer);detail?.complete?.();};
      const onAnimation=(event:AnimationEvent)=>{if(event.animationName==='zipco-ag-fly')complete();};
      row.addEventListener('animationend',onAnimation);
      const timer=setTimeout(complete,matchMedia('(prefers-reduced-motion: reduce)').matches?0:650);
      const target = document.querySelector('[data-history-target]');
      const box = row.getBoundingClientRect();
      let fx = 48; let fy = 0;
      if (target) {
        const t = target.getBoundingClientRect();
        fx = t.x + t.width / 2 - (box.x + box.width / 2);
        fy = t.y + t.height / 2 - (box.y + box.height / 2);
      }
      const gap = parseFloat(getComputedStyle(row.parentElement ?? row).rowGap) || 0;
      row.style.setProperty('--ag-fx', `${fx}px`);
      row.style.setProperty('--ag-fy', `${fy}px`);
      row.style.setProperty('--ag-gap', `${gap}px`);
      row.style.height = `${box.height}px`;
      row.classList.add('is-leaving');
      requestAnimationFrame(() => requestAnimationFrame(() => row.classList.add('is-gone')));
    };
    // En una fila que se desplegó mientras estaba abierta, el botón se guarda.
    const observer = new MutationObserver(() => { if (unfolded() && row.dataset.swipe === 'open') settle(false); });
    observer.observe(row, { subtree: true, attributes: true, attributeFilter: ['data-folded'] });

    row.addEventListener('pointerdown', onDown);
    row.addEventListener('pointermove', onMove);
    row.addEventListener('pointerup', onEnd);
    row.addEventListener('pointercancel', onEnd);
    row.addEventListener('click', onClickCapture, true);
    row.addEventListener('keydown', onKey);
    row.addEventListener(EVT_CLOSED, onSheetClosed);
    row.addEventListener(EVT_SAVED, onSaved);
    window.addEventListener(EVT_ROW_OPEN, onOtherOpen);
    document.addEventListener('pointerdown', onOutside, true);
    return () => {
      row.removeEventListener('pointerdown', onDown);
      row.removeEventListener('pointermove', onMove);
      row.removeEventListener('pointerup', onEnd);
      row.removeEventListener('pointercancel', onEnd);
      row.removeEventListener('click', onClickCapture, true);
      row.removeEventListener('keydown', onKey);
      row.removeEventListener(EVT_CLOSED, onSheetClosed);
      row.removeEventListener(EVT_SAVED, onSaved);
      window.removeEventListener(EVT_ROW_OPEN, onOtherOpen);
      document.removeEventListener('pointerdown', onOutside, true);
      observer.disconnect();
      delete row.dataset.swipe;
      row.style.removeProperty('--ag-sx');
      setRevealed(false);
    };
  }, [enabled, ref]);

  const openSheet = React.useCallback(() => {
    ref.current?.querySelector('[data-close-request]')?.dispatchEvent(new CustomEvent(EVT_OPEN));
  }, [ref]);
  return { enabled, revealed, openSheet, close: () => settleRef.current(false) };
}

/**
 * Aviso de ayuda, opcional: se coloca UNA vez arriba de la lista de En curso (BusinessOrdersTab.tsx).
 * Una mini tarjeta se desliza y deja ver «Cerrar solicitud». Dura ~5 s desde que queda a la vista y se pliega;
 * también se pliega al primer toque sobre una tarjeta. Se muestra solo la primera vez (localStorage, con try/catch).
 * No renderiza nada si ninguna fila tiene la opción disponible.
 */
const HINT_KEY = 'zipco:agenda-swipe-hint:v1';
const HINT_MS = 5000;
const hintSeen = () => { try { return window.localStorage.getItem(HINT_KEY) === '1'; } catch { return false; } };
const markHintSeen = () => { try { window.localStorage.setItem(HINT_KEY, '1'); } catch { /* sin almacenamiento: puede repetirse */ } };

export function AgendaSwipeHint() {
  const rows = React.useSyncExternalStore(swipeStore.subscribe, swipeStore.get, () => 0);
  const [phase, setPhase] = React.useState<'show' | 'fade' | 'fold' | 'gone'>(() => (hintSeen() ? 'gone' : 'show'));
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (phase !== 'show' || rows === 0) return;
    const node = ref.current;
    let timer = 0;
    const fold = () => { window.clearTimeout(timer); markHintSeen(); setPhase('fold'); };
    const start = () => { window.clearTimeout(timer); timer = window.setTimeout(fold, HINT_MS); };
    let observer: IntersectionObserver | null = null;
    if (node && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { start(); observer?.disconnect(); } }, { threshold: 0.6 });
      observer.observe(node);
    } else start();
    // Al tocar una tarjeta solo se desvanece; el espacio se recoge cuando el dedo ya se levantó (nada se mueve bajo el dedo).
    const onDown = (event: PointerEvent) => { if ((event.target as Element | null)?.closest('.zipco-agenda-row')) { window.clearTimeout(timer); markHintSeen(); setPhase('fade'); } };
    document.addEventListener('pointerdown', onDown, true);
    return () => { window.clearTimeout(timer); observer?.disconnect(); document.removeEventListener('pointerdown', onDown, true); };
  }, [phase, rows]);

  React.useEffect(() => {
    if (phase !== 'fade') return;
    let timer = 0;
    const release = () => { window.clearTimeout(timer); timer = window.setTimeout(() => setPhase('fold'), 450); };
    document.addEventListener('pointerup', release, true);
    document.addEventListener('pointercancel', release, true);
    return () => { window.clearTimeout(timer); document.removeEventListener('pointerup', release, true); document.removeEventListener('pointercancel', release, true); };
  }, [phase]);

  React.useEffect(() => {
    if (phase !== 'fold') return;
    const timer = window.setTimeout(() => setPhase('gone'), 420);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === 'gone' || rows === 0) return null;
  return (
    <div ref={ref} className={`zipco-agenda-hint${phase === 'fade' ? ' is-fade' : phase === 'fold' ? ' is-off' : ''}`} role="note">
      <span className="sr-only">Desliza una tarjeta a la izquierda para cerrar la solicitud.</span>
      <span className="zipco-agenda-hint-bk" aria-hidden="true"><i><ClipboardCheck size={16} strokeWidth={2.2} /></i><span>Cerrar<br />solicitud</span></span>
      <span className="zipco-agenda-hint-fr" aria-hidden="true"><span>Desliza una tarjeta</span><Hand size={22} strokeWidth={2} /></span>
    </div>
  );
}

/**
 * Envuelve la tarjeta real SIN modificarla: bloque con el horario acordado a la izquierda (46 px).
 * Con la tarjeta desplegada (o en pantallas muy angostas) el bloque pasa a ser una banda superior.
 * Si la tarjeta declara `data-close-request`, la fila permite deslizar para descubrir «Cerrar solicitud».
 */
export function AgendaRow({ schedule, group, children }: { schedule: AgreedSchedule; group: AgendaGroup; children: React.ReactNode }) {
  const when = describeSchedule(schedule, group);
  const rowRef = React.useRef<HTMLDivElement>(null);
  useRedundantStatusMark(rowRef);
  const swipe = useAgendaSwipe(rowRef);
  return (
    <div ref={rowRef} className={`zipco-agenda-row ${TONE[group]}`}>
      {swipe.enabled && (
        <button type="button" className="zipco-agenda-act" tabIndex={swipe.revealed ? 0 : -1} aria-hidden={!swipe.revealed}
          onClick={swipe.openSheet}>
          <i aria-hidden="true"><ClipboardCheck size={20} strokeWidth={2.2} /></i>
          <span>Cerrar<br />solicitud</span>
        </button>
      )}
      <div className="zipco-agenda-when">
        <span className="sr-only">Servicio acordado: {when.full}</span>
        <span className="zipco-agenda-when-short" aria-hidden="true">
          {group === 'asap' ? <em><Zap size={14} strokeWidth={2.6} /></em> : <em>{when.top || ' '}</em>}
          <b>{when.big}</b><i>{when.bottom}</i>
        </span>
        <span className="zipco-agenda-when-full" aria-hidden="true">{when.full}</span>
      </div>
      <div className="zipco-agenda-card">{children}</div>
    </div>
  );
}

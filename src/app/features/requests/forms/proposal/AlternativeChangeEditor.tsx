import TimePicker from '../../shared/time/TimePicker';
import * as React from 'react';
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CalendarClock, Check, ChevronDown, ChevronRight, Clock, DollarSign, Hash, Moon, Package, Sun } from "lucide-react";
import type { ChangeKey } from "./AlternativeProposalFields";
import type { DraftLine, AlternativeSource } from "../../domain/alternativeDraft";

import { santiagoDraftTime } from "../../domain/alternativeDraft";

// Valores que un editor entrega al pulsar "Guardar". Solo viajan los campos
// del cambio que se está guardando.

// Valores que un editor entrega al pulsar "Guardar". Solo viajan los campos
// del cambio que se está guardando.
export type ChangeValues = Partial<{
  name: string;
  description: string;
  price: string;
  quantity: string;
  immediate: boolean;
  date: string;
  time: string;
}>;

type ScheduleValue = { immediate: boolean; date: string; time: string };

type Props = {
  original: string;
  originalTotal?: number | null;
  baselineLabel?: string;
  originalNote: string;
  originalLine: AlternativeSource['items'][number];
  originalSchedule: string;
  line: DraftLine;
  schedule: ScheduleValue;
  originalScheduleValue: ScheduleValue;
  customBasePrice: string;
  onEditorOpenChange: (open: boolean) => void;
  selected: ReadonlySet<ChangeKey>;
  quantityLocked: boolean;
  quantityMax: number;
  onApply: (key: ChangeKey, values: ChangeValues) => void;
  onRemove: (key: ChangeKey) => void;
  message: string;
  setMessage: (value: string) => void;
  messageMaxLength: number;
  explanationHint: string;
  photoFields: ReactNode;
  /** Presentación Glow compartida; scheduleRequired solo señala el contrato atrasado. */
  late?: { scheduleRequired: boolean; changeCount: number; counterProposal?: boolean; final?: boolean };
};

const field = "zipco-readable-field w-full rounded-xl border p-3 text-sm";
const integer = /^[1-9]\d*$/;
const MAX_PRICE = 50_000_000;
const pesos = (value: number) => `$${value.toLocaleString("es-CL")}`;
const money = (value: string) => (/^\d+$/.test(value) ? pesos(Number(value)) : value);

// Horarios rápidos (solo diseño de solicitud atrasada): se calculan con la fecha de Santiago y se descartan los vencidos, ambiguos o inexistentes.
const santiagoDay = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago", year: "numeric", month: "2-digit", day: "2-digit" });
function quickTimes(now = Date.now()) {
  const today = santiagoDay.format(now);
  const tomorrow = new Date(Date.parse(`${today}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
  return [{ label: "Hoy 18:00", date: today, time: "18:00" }, { label: "Mañana 10:00", date: tomorrow, time: "10:00" }]
    .filter(option => { const instant = santiagoDraftTime(option.date, option.time); return instant !== null && instant > now; });
}
const suggestedMessages = [
  { label: "Por alta demanda no alcancé a responder", text: "Por alta demanda no alcancé a responder a tiempo." },
  { label: "Te propongo una nueva hora", text: "Te propongo una nueva hora para tu pedido." },
  { label: "Puedo ofrecerte esta alternativa", text: "Puedo ofrecerte esta alternativa para tu pedido." },
];
// Propuesta final: sin «alta demanda» (ya hubo una contrapropuesta; no aplica a una respuesta atrasada).
const finalMessages = [
  { label: "Te propongo una nueva hora", text: "Te propongo una nueva hora para tu pedido." },
  { label: "Puedo ofrecerte esta alternativa", text: "Puedo ofrecerte esta alternativa para tu pedido." },
  { label: "Es la mejor que puedo ofrecer", text: "Esta es la mejor alternativa que puedo ofrecerte." },
];
const customerMessages = [
  { label: 'Ajustar la cantidad', text: 'Me gustaría ajustar la cantidad de mi pedido.' },
  { label: 'Proponer otro horario', text: 'Me acomoda más este horario para mi pedido.' },
  { label: 'Proponer otra opción', text: 'Quisiera proponer esta otra opción para mi pedido.' },
];

const tiles: Array<{ key: ChangeKey; label: string; icon: typeof Package }> = [
  { key: "price", label: "Precio", icon: DollarSign },
  { key: "quantity", label: "Cantidad", icon: Hash },
  { key: "schedule", label: "Disponibilidad", icon: CalendarClock },
  { key: "item", label: "Producto", icon: Package },
];

const editorTitles: Record<ChangeKey, string> = {
  price: "Nuevo precio por unidad",
  quantity: "Nueva cantidad",
  schedule: "Nueva disponibilidad",
  item: "Producto o servicio alternativo",
};

// ===== Hora: selector propio (reemplaza <input type="time"> en la presentación Glow) y confirmación «¿Proponer esta hora?» =====
// El valor sigue siendo «HH:MM» en 24 h, el mismo que ya validaba santiagoDraftTime; solo cambia cómo se elige y se confirma.
const two = (n: number) => String(n).padStart(2, "0");
const parseTime = (value: string) => { const m = /^(\d{2}):(\d{2})$/.exec(value); return m ? { h: Number(m[1]), m: Number(m[2]) } : null; };
// Espacios duros: «7:00 p. m.» nunca se parte en dos líneas.
const clock12 = (value: string) => { const t = parseTime(value); return t ? `${t.h % 12 || 12}:${two(t.m)}\u00A0${t.h < 12 ? "a.\u00A0m." : "p.\u00A0m."}` : value; };
const dayPart = (value: string) => { const t = parseTime(value); if (!t) return ""; return t.h < 6 ? "de la madrugada" : t.h < 12 ? "de la mañana" : t.h === 12 && t.m === 0 ? "del mediodía" : t.h < 20 ? "de la tarde" : "de la noche"; };
const shortDay = (date: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return date;
  return new Intl.DateTimeFormat("es-CL", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
    .format(new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12))).replace(/\./g, "");
};

// Al guardar una hora: muestra cómo quedará (24 h y 12 h) y, si la hora es de 1 a 11, ofrece la misma hora de la tarde. Nada se envía aquí.
function TimeConfirm({ date, time, before, onUse, onBack, onOk }: { date: string; time: string; before: string; onUse: (value: string) => void; onBack: () => void; onOk: () => void }) {
  const t = parseTime(time);
  const night = t ? t.h < 6 || t.h >= 20 : false;
  const alt = t && t.h >= 1 && t.h <= 11 ? `${two(t.h + 12)}:${two(t.m)}` : null;
  return <Dialog.Root open onOpenChange={value => { if (!value) onBack(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="zipco-tpop-ov" />
      <Dialog.Content className="zipco-tpop" aria-describedby={undefined} onOpenAutoFocus={event => { event.preventDefault(); (event.currentTarget as HTMLElement).querySelector<HTMLElement>("[data-tpop-ok]")?.focus(); }}>
        <div className="zipco-tpop-in">
          <span className="zipco-tpop-ic" aria-hidden="true"><Clock /></span>
          <Dialog.Title className="zipco-tpop-t">¿Proponer esta hora?</Dialog.Title>
          <div className="zipco-tpop-sum">
            <p className="zipco-tpop-d">{shortDay(date)}</p>
            <p className="zipco-tpop-h">{time}</p>
            <p className="zipco-tpop-p">{night ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}<span>{clock12(time)} · {dayPart(time)}</span></p>
          </div>
          <p className="zipco-tpop-was">Antes: <s>{before}</s></p>
          {alt && <div className="zipco-tpop-alt" role="group" aria-label="Hora alternativa">
            <span>¿Querías decir las {alt} ({clock12(alt)})?</span>
            <button type="button" onClick={() => onUse(alt)}>Usar {alt}</button>
          </div>}
          <p className="zipco-tpop-note">Hora de Chile. El cliente la verá tal como aparece aquí.</p>
          <div className="zipco-tpop-r">
            <button type="button" className="zipco-tpop-back" onClick={onBack}>Cambiar hora</button>
            <button type="button" className="zipco-tpop-ok" data-tpop-ok onClick={onOk}>Sí, proponer</button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

function SaveButton({ valid, onClick, className = "" }: { valid: boolean; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      disabled={!valid}
      onClick={onClick}
      className={`zipco-ed-save min-h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50 ${className}`}
    >
      Guardar
    </button>
  );
}

type EditorProps = {
  kind: ChangeKey;
  line: DraftLine;
  originalLine: AlternativeSource['items'][number];
  schedule: ScheduleValue;
  originalScheduleValue: ScheduleValue;
  customBasePrice: string;
  selected: ReadonlySet<ChangeKey>;
  quantityMax: number;
  onApply: Props["onApply"];
  onRemove: Props["onRemove"];
  close: () => void;
  late?: Props["late"];
};

// Campo pequeño que se abre al tocar un cuadrito. Guarda sus valores en estado
// local y solo los entrega al formulario al pulsar "Guardar".
export function ChangeEditor({ kind, line, originalLine, schedule, originalScheduleValue, customBasePrice, selected, quantityMax, onApply, onRemove, close, late }: EditorProps) {
  const saved = selected.has(kind);
  const [name, setName] = useState(kind === "item" ? line.name : "");
  const [description, setDescription] = useState(kind === "item" ? line.description : "");
  const [price, setPrice] = useState(kind === "item" ? (selected.has("item") ? line.price : "") : line.price);
  const [quantity, setQuantity] = useState(line.quantity);
  const [immediate, setImmediate] = useState(schedule.immediate);
  const [date, setDate] = useState(schedule.date);
  const [time, setTime] = useState(schedule.time);
  const [scheduleEdited,setScheduleEdited]=useState(false);
  const [pastScheduleNotice,setPastScheduleNotice]=useState(false);
  const [confirmTime, setConfirmTime] = useState(false);
  const dateInput = useRef<HTMLInputElement>(null);
  const [quick] = useState(() => (late ? quickTimes() : []));

  const priceOk = integer.test(price) && Number.isSafeInteger(Number(price)) && Number(price) <= MAX_PRICE;
  const quantityNumber = Number(quantity);
  const custom = selected.has('item') || originalLine.customTotal !== undefined;
  const priceBaseline = custom ? customBasePrice : String(originalLine.price);
  const scheduledInstant = kind === 'schedule' && !immediate ? santiagoDraftTime(date, time) : null;
  // Local guidance only; reuse the Chile conversion and keep server validation authoritative.
  useEffect(()=>{
    if(!scheduleEdited||kind!=='schedule'||immediate||scheduledInstant===null||scheduledInstant>Date.now()){
      setPastScheduleNotice(false);return;
    }
    setPastScheduleNotice(true);
    const timer=setTimeout(()=>setPastScheduleNotice(false),4000);
    return()=>clearTimeout(timer);
  },[scheduleEdited,kind,immediate,date,time,scheduledInstant]);
  const scheduleChanged = immediate !== originalScheduleValue.immediate || (!immediate && (date !== originalScheduleValue.date || time !== originalScheduleValue.time));
  const valid =
    kind === "price" ? priceOk && price !== priceBaseline
    : kind === "quantity" ? integer.test(quantity) && Number.isInteger(quantityNumber) && quantityNumber >= 1 && quantityNumber <= quantityMax && quantityNumber !== originalLine.quantity
    : kind === "item" ? name.trim().length > 0 && name.trim().length <= 120 && description.trim().length <= 500 && priceOk &&
      (!saved || name.trim() !== line.name || description.trim() !== line.description || price !== line.price)
    : scheduleChanged && (immediate || (scheduledInstant !== null && scheduledInstant > Date.now()));

  const save = () => {
    if (!valid) return;
    if (kind === "price") onApply(kind, { price });
    else if (kind === "quantity") onApply(kind, { quantity: String(quantityNumber) });
    else if (kind === "item") onApply(kind, { name: name.trim(), description: description.trim(), price });
    else onApply(kind, { immediate, date: immediate ? schedule.date : date, time: immediate ? schedule.time : time });
    close();
  };

  // Presentación Glow: una hora programada se confirma antes de guardarla (24 h + a. m./p. m.). «Lo antes posible» no necesita hora.
  const requestSave = () => { if (!valid) return; if (late && kind === "schedule" && !immediate) { setConfirmTime(true); return; } save(); };
  const originalWhen = originalScheduleValue.immediate ? "Lo antes posible" : `${shortDay(originalScheduleValue.date)} · ${originalScheduleValue.time}`;
  const priceWarning = price !== "" && !priceOk && (
    <p role="alert" className="mt-1 text-xs text-red-700">Usa solo números enteros, sin puntos ni comas.</p>
  );

  return (
    <div className="zipco-ed space-y-2 rounded-2xl border border-violet-200 bg-violet-50/50 p-3 dark:border-violet-500/40 dark:bg-violet-950/20">
      <div className="zipco-ed-top flex items-center justify-between gap-2">
        <p className="zipco-ed-title text-sm font-black text-slate-900 dark:text-white">{kind === 'price' && custom ? 'Nuevo precio total de la opción' : editorTitles[kind]}</p>
        {saved && (
          <button
            type="button"
            onClick={() => { onRemove(kind); close(); }}
            className="zipco-ed-link min-h-11 px-2 text-xs font-bold text-violet-700 dark:text-violet-200"
          >
            Quitar cambio
          </button>
        )}
      </div>

      {kind === "price" && (
        <>
          <div className="flex gap-2">
            <input
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              aria-label={custom ? 'Nuevo precio total de la opción' : 'Nuevo precio por unidad'}
              placeholder={`Ej: ${priceBaseline}`}
              className={`zipco-ed-in min-w-0 flex-1 ${field}`}
            />
            <SaveButton valid={valid} onClick={save} className="shrink-0" />
          </div>
          <p className="zipco-ed-help text-xs text-slate-500">{custom ? `Total de la opción escrita, en pesos enteros. Base: ${money(customBasePrice)}.` : `Precio por unidad, en pesos enteros. Original: ${pesos(originalLine.price)}.`}</p>
          {priceWarning}
        </>
      )}

      {kind === "quantity" && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Disminuir cantidad"
              disabled={quantityNumber <= 1}
              onClick={() => setQuantity(String(Math.max(1, (Number(quantity) || 1) - 1)))}
              className="zipco-ed-step h-11 w-11 rounded-full bg-slate-100 font-black dark:bg-slate-800"
            >
              −
            </button>
            <span className="min-w-6 text-center text-lg font-black" aria-live="polite">{quantity || "1"}</span>
            <button
              type="button"
              aria-label="Aumentar cantidad"
              disabled={quantityNumber >= quantityMax}
              onClick={() => setQuantity(String((Number(quantity) || 1) + 1))}
              className="zipco-ed-step zipco-ed-plus h-11 w-11 rounded-full bg-violet-600 font-black text-white disabled:opacity-50"
            >
              +
            </button>
          </div>
          <SaveButton valid={valid} onClick={save} className="shrink-0" />
        </div>
      )}

      {kind === "schedule" && (
        <>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={immediate} onChange={(e) => setImmediate(e.target.checked)} />
            Lo antes posible
          </label>
          {late?.scheduleRequired && <p className="zipco-ed-help text-xs text-slate-500">Para esta solicitud, elige una fecha y hora programadas.</p>}
          {late && !immediate && (
            <div className="zipco-la-chips" role="group" aria-label="Horarios rápidos">
              {quick.map(option => (
                <button key={option.label} type="button" aria-pressed={date === option.date && time === option.time}
                  onClick={() => { setScheduleEdited(true);setDate(option.date); setTime(option.time); }} className="zipco-la-chip">{option.label}</button>
              ))}
              <button type="button" onClick={() => { setDate(""); setTime(""); dateInput.current?.focus(); }} className="zipco-la-chip">Otra fecha…</button>
            </div>
          )}
          {!immediate && (
            <div className={late ? "grid gap-2" : "grid grid-cols-2 gap-2"}>
              <label className="min-w-0 text-xs font-bold">
                Fecha
                <input ref={dateInput} type="date" value={date} onChange={(e) => {setScheduleEdited(true);setDate(e.target.value);}} className={`zipco-ed-in mt-1 min-w-0 ${field}`} />
                {!date && <span className="font-normal">Selecciona fecha</span>}
              </label>
              {late ? <TimePicker value={time} onChange={(value) => { setScheduleEdited(true); setTime(value); }} /> : <label className="min-w-0 text-xs font-bold">
                Hora de Chile
                <input type="time" value={time} onChange={(e) => {setScheduleEdited(true);setTime(e.target.value);}} className={`zipco-ed-in mt-1 min-w-0 ${field}`} />
                {!time && <span className="font-normal">Selecciona hora</span>}
              </label>}
            </div>
          )}
          {pastScheduleNotice&&<p role="status" aria-live="polite" className="rounded-xl border border-amber-300 bg-amber-50 p-2 text-xs font-semibold text-amber-900">Esa fecha y hora ya pasaron. Elige un horario futuro.</p>}
          <SaveButton valid={valid} onClick={requestSave} className="w-full" />
          {confirmTime && <TimeConfirm date={date} time={time} before={originalWhen} onUse={(value) => { setScheduleEdited(true); setTime(value); }}
            onBack={() => setConfirmTime(false)} onOk={() => { setConfirmTime(false); save(); }} />}
          {!valid && <p className="zipco-ed-help text-xs text-slate-500">Elige un horario diferente, futuro y válido en Chile. Para conservar el original, quita el cambio.</p>}
        </>
      )}

      {kind === "item" && (
        <>
          <p className="zipco-ed-help text-xs text-violet-700 dark:text-violet-200">Escribe una opción fuera del catálogo. No se creará un artículo nuevo.</p>
          <label className="block text-sm font-bold">
            Nombre de la alternativa
            <input value={name} maxLength={120} onChange={(e) => setName(e.target.value)} className={`zipco-ed-in mt-1 ${field}`} />
          </label>
          <label className="block text-sm font-bold">
            Descripción opcional
            <textarea value={description} maxLength={500} rows={2} onChange={(e) => setDescription(e.target.value)} className={`zipco-ed-in mt-1 ${field}`} />
          </label>
          <label className="block text-sm font-bold">
            Precio total de esta opción (obligatorio)
            <input
              aria-label="Precio total de la opción escrita"
              required
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={`zipco-ed-in mt-1 ${field}`}
            />
          </label>
          <p className="zipco-ed-help text-xs text-slate-500">Total de esta línea en pesos enteros, no un precio unitario calculado.</p>
          {priceWarning}
          <SaveButton valid={valid} onClick={save} className="w-full" />
        </>
      )}
      <button type="button" onClick={close} className="zipco-ed-close min-h-11 text-xs font-bold text-slate-600 dark:text-slate-300">Cerrar edición sin guardar</button>
    </div>
  );
}

export default function AlternativeChangeEditor(props: Props) {
  const [open, setOpen] = useState<ChangeKey | null>(null);
  const { selected, originalLine, line, schedule, quantityLocked, late } = props;
  const isLate = Boolean(late);
  const root = useRef<HTMLDivElement>(null);
  const previousOpen = useRef<ChangeKey | null>(null);
  // Diseño de solicitud atrasada: el editor se abre bajo su fila. Al abrir, la fila sube para que el editor quede a la vista
  // (el pie fijo no lo tapa); al cerrar o guardar, la lista vuelve arriba. Solo cambia la posición del scroll.
  useEffect(() => {
    const before = previousOpen.current; previousOpen.current = open;
    if (!isLate) return;
    const box = root.current?.closest<HTMLElement>("[data-alternative-body]");
    if (!box?.scrollTo) return;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = reduce ? "auto" : "smooth";
    if (open) {
      const row = root.current?.querySelector<HTMLElement>('[data-open="true"]');
      if (row) box.scrollTo({ top: Math.max(0, box.scrollTop + row.getBoundingClientRect().top - box.getBoundingClientRect().top - 56), behavior });
    } else if (before) box.scrollTo({ top: 0, behavior });
  }, [isLate, open]);
  const customItem = selected.has("item");
  const isOff = (key: ChangeKey) => key === "quantity" && quantityLocked;
  const changeOpen = (key: ChangeKey | null) => { setOpen(key); props.onEditorOpenChange(key !== null); };

  const rows: Array<[string, string]> = [];
  if (customItem) rows.push(["Producto", `${originalLine.name} → ${line.name.trim()} · ${money(line.price)} total`]);
  if (selected.has("price")) rows.push(["Precio", customItem || originalLine.customTotal !== undefined ? `${money(props.customBasePrice)} → ${money(line.price)} total de la opción` : `${pesos(originalLine.price)} → ${money(line.price)} por unidad`]);
  if (selected.has("quantity")) rows.push(["Cantidad", `${originalLine.quantity} → ${line.quantity}`]);
  if (selected.has("schedule")) {
    rows.push(["Disponibilidad", `${props.originalSchedule} → ${schedule.immediate ? "Lo antes posible" : `${schedule.date || "—"} · ${schedule.time || "—"}`}`]);
  }

  if (late) {
    const custom = customItem || originalLine.customTotal !== undefined;
    const scheduleSaved = selected.has("schedule");
    const needsSchedule = late.scheduleRequired && !(scheduleSaved && !schedule.immediate);
    const before: Record<ChangeKey, string> = {
      price: custom ? `${money(props.customBasePrice)} total` : `${pesos(originalLine.price)} por unidad`,
      quantity: `${originalLine.quantity}×`,
      schedule: props.originalSchedule,
      item: originalLine.name,
    };
    const after: Record<ChangeKey, string> = {
      price: `${money(line.price)} ${custom ? "total" : "por unidad"}`,
      quantity: `${line.quantity}×`,
      schedule: schedule.immediate ? "Lo antes posible" : `${late.final && schedule.date ? shortDay(schedule.date) : schedule.date || "—"} · ${schedule.time || "—"}`,
      item: line.name.trim(),
    };
    const idle: Record<ChangeKey, string> = {
      price: before.price,
      quantity: `${originalLine.quantity}× solicitada`,
      schedule: needsSchedule ? "Obligatoria · falta elegir" : props.originalSchedule,
      item: originalLine.name,
    };
    const order: ChangeKey[] = ["schedule", "price", "quantity", "item"];
    return (
      <div ref={root} className="zipco-la mt-3">
        <div className="zipco-la-orig">
          <div className="min-w-0 flex-1">
            <p className="zipco-la-orig-label">{props.baselineLabel ?? "Solicitud original"}</p>
            <p className="zipco-la-orig-main">{props.original}</p>
            <p className="zipco-la-orig-note">{props.originalNote}</p>
          </div>
          {props.originalTotal != null && <p className="zipco-la-orig-price">{pesos(props.originalTotal)}</p>}
        </div>

        <h4 className="zipco-la-q">{late.final ? 'Toca lo que cambiarías de esta propuesta' : 'Haz clic en lo que cambiarías de esta propuesta'}</h4>
        <div className="zipco-la-list">
          {order.map((key) => {
            const { label, icon: Icon } = tiles.find((tile) => tile.key === key)!;
            const active = selected.has(key);
            const isOpen = open === key;
            return (
              <React.Fragment key={key}>
                <button
                  type="button"
                  aria-pressed={active}
                  aria-expanded={isOpen}
                  aria-label={active ? `${label}, cambio guardado: de ${before[key]} a ${after[key]}` : `${label}: ${idle[key]}`}
                  disabled={isOff(key)}
                  data-active={active}
                  data-open={isOpen}
                  data-need={key === "schedule" && needsSchedule ? "true" : undefined}
                  onClick={() => changeOpen(isOpen ? null : key)}
                  className="zipco-la-tile"
                >
                  <span className="zipco-la-tile-ic" aria-hidden="true"><Icon className="h-[17px] w-[17px]" /></span>
                  <span className="zipco-la-tile-tx" aria-hidden="true">
                    <b>{label}</b>
                    <em>{active ? <><s>{before[key]}</s><span>{after[key]}</span></> : <span>{idle[key]}</span>}</em>
                  </span>
                  {late.final && <span className="zipco-final-row-indicator" aria-hidden="true">{isOpen ? <ChevronDown /> : active ? <Check /> : <ChevronRight />}</span>}
                </button>
                {isOpen && (
                  <div className="zipco-la-editor">
                    <ChangeEditor
                      key={open}
                      kind={key}
                      line={line}
                      originalLine={originalLine}
                      schedule={schedule}
                      originalScheduleValue={props.originalScheduleValue}
                      customBasePrice={props.customBasePrice}
                      selected={selected}
                      quantityMax={props.quantityMax}
                      onApply={props.onApply}
                      onRemove={props.onRemove}
                      close={() => changeOpen(null)}
                      late={late}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* El mensaje se pliega hasta elegir un cambio; sigue montado, así que lo escrito se conserva. */}
        <div hidden={late.changeCount === 0}>
          <label className="zipco-la-msg">
            <span className="zipco-la-msg-top">Explica tu cambio o el motivo<i>{props.message.length}/{props.messageMaxLength}</i></span>
            <textarea
              value={props.message}
              onChange={(e) => props.setMessage(e.target.value)}
              rows={3}
              maxLength={props.messageMaxLength}
              placeholder="Ej: Puedo ofrecerte esta alternativa porque…"
              className="zipco-readable-field zipco-alt-ta zipco-la-ta"
            />
            <span className="zipco-la-hint">{props.explanationHint}</span>
          </label>
          {props.message.trim() === "" && (
            <div className="zipco-la-chips" role="group" aria-label="Frases sugeridas">
              {(late.counterProposal ? customerMessages : late.final ? finalMessages : suggestedMessages).map((suggestion) => (
                <button key={suggestion.label} type="button" onClick={() => props.setMessage(suggestion.text)} className="zipco-la-chip">{suggestion.label}</button>
              ))}
            </div>
          )}
        </div>

        {props.photoFields}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="zipco-alt-orig">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="min-w-0 flex-1 basis-32">
            <p className="zipco-alt-orig-label">{props.baselineLabel ?? 'Solicitud original'}</p>
            <p className="mt-1 break-words text-sm font-extrabold">{props.original}</p>
            <p className="mt-0.5 break-words text-xs text-white/70">{props.originalNote}</p>
          </div>
          {props.originalTotal != null && <p className="zipco-alt-orig-price">{pesos(props.originalTotal)}</p>}
        </div>
      </div>

      <div>
        <h4 className="text-[15px] font-extrabold text-slate-900 dark:text-white">¿Qué cambia en tu propuesta?</h4>
        <div className="mt-2.5 grid grid-cols-4 gap-2">
          {tiles.map(({ key, label, icon: Icon }) => {
            const active = selected.has(key);
            const isOpen = open === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                aria-expanded={isOpen}
                aria-label={active ? `${label}, cambio guardado` : label}
                disabled={isOff(key)}
                data-active={active}
                data-open={isOpen}
                onClick={() => changeOpen(isOpen ? null : key)}
                className="zipco-alt-tile"
              >
                <Icon className="h-5 w-5" />
                <span className="max-w-full break-words text-center text-[10px] font-black leading-tight tracking-tight">{key === 'schedule'
                  ? <><span className="max-[360px]:hidden">Disponibilidad</span><span className="hidden max-[360px]:inline">Horario</span></>
                  : label}</span>
                {active && (
                  <span className="zipco-alt-tile-check">
                    <Check className="h-2.5 w-2.5" strokeWidth={3.6} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {rows.length > 0 && (
        <ul className="zipco-alt-rows space-y-1 text-xs">
          {rows.map(([label, text]) => (
            <li key={label} className="flex gap-2">
              <span className="shrink-0 font-black text-violet-800 dark:text-violet-200">{label}</span>
              <span className="min-w-0 break-words text-slate-700 dark:text-slate-200">{text}</span>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <ChangeEditor
          key={open}
          kind={open}
          line={line}
          originalLine={originalLine}
          schedule={schedule}
          originalScheduleValue={props.originalScheduleValue}
          customBasePrice={props.customBasePrice}
          selected={selected}
          quantityMax={props.quantityMax}
          onApply={props.onApply}
          onRemove={props.onRemove}
          close={() => changeOpen(null)}
        />
      )}

      <label className="block text-[15px] font-extrabold text-slate-900 dark:text-white">
        <span className="flex items-baseline justify-between gap-2">
          Explica tu cambio o el motivo
          <span className="text-[11.5px] font-normal tabular-nums text-slate-400">{props.message.length}/{props.messageMaxLength}</span>
        </span>
        <textarea
          value={props.message}
          onChange={(e) => props.setMessage(e.target.value)}
          rows={3}
          maxLength={props.messageMaxLength}
          placeholder="Ej: Puedo ofrecerte esta alternativa porque…"
          className="zipco-readable-field zipco-alt-ta mt-2 font-normal"
        />
        <span className="mt-1.5 block text-[11.5px] font-normal leading-snug text-slate-500">{props.explanationHint}</span>
      </label>

      {props.photoFields}
    </div>
  );
}

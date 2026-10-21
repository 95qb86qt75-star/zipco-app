import { useState } from "react";
import type { ReactNode } from "react";
import { CalendarClock, Check, DollarSign, Hash, Package } from "lucide-react";
import type { ChangeKey } from "./AlternativeProposalFields";
import type { DraftLine, AlternativeSource } from "./alternativeDraft";
import type { Product } from "./types";
import { santiagoDraftTime } from './alternativeDraft';

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
};

const field = "zipco-readable-field w-full rounded-xl border p-3 text-sm";
const integer = /^[1-9]\d*$/;
const MAX_PRICE = 50_000_000;
const pesos = (value: number) => `$${value.toLocaleString("es-CL")}`;
const money = (value: string) => (/^\d+$/.test(value) ? pesos(Number(value)) : value);

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

function SaveButton({ valid, onClick, className = "" }: { valid: boolean; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      disabled={!valid}
      onClick={onClick}
      className={`min-h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50 ${className}`}
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
};

// Campo pequeño que se abre al tocar un cuadrito. Guarda sus valores en estado
// local y solo los entrega al formulario al pulsar "Guardar".
export function ChangeEditor({ kind, line, originalLine, schedule, originalScheduleValue, customBasePrice, selected, quantityMax, onApply, onRemove, close }: EditorProps) {
  const saved = selected.has(kind);
  const [name, setName] = useState(kind === "item" ? line.name : "");
  const [description, setDescription] = useState(kind === "item" ? line.description : "");
  const [price, setPrice] = useState(kind === "item" ? (selected.has("item") ? line.price : "") : line.price);
  const [quantity, setQuantity] = useState(line.quantity);
  const [immediate, setImmediate] = useState(schedule.immediate);
  const [date, setDate] = useState(schedule.date);
  const [time, setTime] = useState(schedule.time);

  const priceOk = integer.test(price) && Number.isSafeInteger(Number(price)) && Number(price) <= MAX_PRICE;
  const quantityNumber = Number(quantity);
  const custom = selected.has('item') || originalLine.customTotal !== undefined;
  const priceBaseline = custom ? customBasePrice : String(originalLine.price);
  const scheduledInstant = kind === 'schedule' && !immediate ? santiagoDraftTime(date, time) : null;
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

  const priceWarning = price !== "" && !priceOk && (
    <p role="alert" className="mt-1 text-xs text-red-700">Usa solo números enteros, sin puntos ni comas.</p>
  );

  return (
    <div className="space-y-2 rounded-2xl border border-violet-200 bg-violet-50/50 p-3 dark:border-violet-500/40 dark:bg-violet-950/20">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-black text-slate-900 dark:text-white">{kind === 'price' && custom ? 'Nuevo precio total de la opción' : editorTitles[kind]}</p>
        {saved && (
          <button
            type="button"
            onClick={() => { onRemove(kind); close(); }}
            className="min-h-11 px-2 text-xs font-bold text-violet-700 dark:text-violet-200"
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
              className={`min-w-0 flex-1 ${field}`}
            />
            <SaveButton valid={valid} onClick={save} className="shrink-0" />
          </div>
          <p className="text-xs text-slate-500">{custom ? `Total de la opción escrita, en pesos enteros. Base: ${money(customBasePrice)}.` : `Precio por unidad, en pesos enteros. Original: ${pesos(originalLine.price)}.`}</p>
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
              className="h-11 w-11 rounded-full bg-slate-100 font-black dark:bg-slate-800"
            >
              −
            </button>
            <span className="min-w-6 text-center text-lg font-black" aria-live="polite">{quantity || "1"}</span>
            <button
              type="button"
              aria-label="Aumentar cantidad"
              disabled={quantityNumber >= quantityMax}
              onClick={() => setQuantity(String((Number(quantity) || 1) + 1))}
              className="h-11 w-11 rounded-full bg-violet-600 font-black text-white disabled:opacity-50"
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
          {!immediate && (
            <div className="grid grid-cols-2 gap-2">
              <label className="min-w-0 text-xs font-bold">
                Fecha
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`mt-1 min-w-0 ${field}`} />
                {!date && <span className="font-normal">Selecciona fecha</span>}
              </label>
              <label className="min-w-0 text-xs font-bold">
                Hora de Chile
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`mt-1 min-w-0 ${field}`} />
                {!time && <span className="font-normal">Selecciona hora</span>}
              </label>
            </div>
          )}
          <SaveButton valid={valid} onClick={save} className="w-full" />
          {!valid && <p className="text-xs text-slate-500">Elige un horario diferente, futuro y válido en Chile. Para conservar el original, quita el cambio.</p>}
        </>
      )}

      {kind === "item" && (
        <>
          <p className="text-xs text-violet-700 dark:text-violet-200">Escribe una opción fuera del catálogo. No se creará un artículo nuevo.</p>
          <label className="block text-sm font-bold">
            Nombre de la alternativa
            <input value={name} maxLength={120} onChange={(e) => setName(e.target.value)} className={`mt-1 ${field}`} />
          </label>
          <label className="block text-sm font-bold">
            Descripción opcional
            <textarea value={description} maxLength={500} rows={2} onChange={(e) => setDescription(e.target.value)} className={`mt-1 ${field}`} />
          </label>
          <label className="block text-sm font-bold">
            Precio total de esta opción (obligatorio)
            <input
              aria-label="Precio total de la opción escrita"
              required
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={`mt-1 ${field}`}
            />
          </label>
          <p className="text-xs text-slate-500">Total de esta línea en pesos enteros, no un precio unitario calculado.</p>
          {priceWarning}
          <SaveButton valid={valid} onClick={save} className="w-full" />
        </>
      )}
      <button type="button" onClick={close} className="min-h-11 text-xs font-bold text-slate-600 dark:text-slate-300">Cerrar edición sin guardar</button>
    </div>
  );
}

export default function AlternativeChangeEditor(props: Props) {
  const [open, setOpen] = useState<ChangeKey | null>(null);
  const { selected, originalLine, line, schedule, quantityLocked } = props;
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

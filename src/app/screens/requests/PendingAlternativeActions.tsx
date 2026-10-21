import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ImagePlus, Trash2, X } from 'lucide-react';
import type { ChangeKey } from './AlternativeProposalFields';
import AlternativeChangeEditor, { type ChangeValues } from './AlternativeChangeEditor';
import AlternativeReviewPanel from './AlternativeReviewPanel';
import { alternativeSource, alternativeSourceCurrent, canPrepareAlternative, canSubmitAlternative, newAlternativeDraft, reviewAlternative, type AlternativeDraft, type AlternativeSource, type AlternativeReview } from './alternativeDraft';
import type { BusinessRequest, MyOrder } from './types';

type Order = BusinessRequest | MyOrder;
const field = 'zipco-readable-field w-full rounded-xl border p-3 text-sm';
const pesos = (value: number) => `$${value.toLocaleString('es-CL')}`;

export function LocalAlternativePhoto({ onFile }: { onFile?: (file: File | null, preview: string) => void } = {}) {
  const [photo, setPhoto] = useState('');
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo); }, [photo]);
  return <div>
    {photo ? <div className="relative overflow-hidden rounded-2xl border border-violet-300">
      <img src={photo} alt="Foto preparada para la alternativa" className="h-36 w-full object-cover" />
      <button type="button" aria-label="Quitar foto preparada" onClick={() => { setPhoto(''); onFile?.(null, ''); }} className="absolute right-2 top-2 rounded-full bg-slate-950/75 p-2 text-white"><Trash2 className="h-4 w-4" /></button>
    </div> : <button type="button" onClick={() => input.current?.click()} className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-violet-400 bg-violet-500/5 p-3 text-left text-violet-700 dark:text-violet-200">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15"><ImagePlus className="h-5 w-5" /></span>
      <span><span className="block text-sm font-black">Agregar foto de referencia</span><span className="block text-xs opacity-70">Opcional, úsala si ayuda a explicar la propuesta.</span></span>
    </button>}
    <p className="mt-1 text-xs text-slate-500">{onFile ? 'La foto se cargará al confirmar el envío. JPG, PNG o WebP, hasta 8 MB.' : 'Foto solo en este formulario, sin subir ni guardar. JPG, PNG o WebP, hasta 8 MB.'}</p>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <input ref={input} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={event => {
      const file = event.target.files?.[0]; event.target.value = '';
      if (!file) return;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size < 1 || file.size > 8 * 1024 * 1024) {
        setError('Selecciona una imagen JPG, PNG o WebP de hasta 8 MB.'); return;
      }
      try { const url = URL.createObjectURL(file); setPhoto(url); onFile?.(file, url); setError(''); }
      catch { setError('No se pudo preparar la foto. Intenta con otra imagen.'); }
    }} />
  </div>;
}

export function AlternativeDraftDialog({ order, close, sourceOverride, onConfirm, title = 'Proponer una alternativa' }: {
  order: Order; close: () => void; sourceOverride?: AlternativeSource;
  onConfirm?: (review: AlternativeReview, file: File | null) => Promise<void>; title?: string;
}) {
  const [source] = useState(() => sourceOverride ?? alternativeSource(order));
  const [draft, setDraft] = useState<AlternativeDraft>(() => newAlternativeDraft(source));
  const [index, setIndex] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => { if (body.current) body.current.scrollTop = 0; }, [reviewing]);
  const [showErrors, setShowErrors] = useState(false);
  const [editing, setEditing] = useState(false);
  const [priceModes, setPriceModes] = useState(() => source.items.map(item => ({ unit: String(item.price), custom: '' })));
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const sendLock = useRef(false);
  const current = sourceOverride ? order.requestProcess?.id === source.processId && order.requestProcess.version <= source.expectedVersion
    : alternativeSourceCurrent(source, order, true);
  const validation = reviewAlternative(source, draft);
  const line = draft.lines[index];
  const originalLine = source.items[index];
  const updateMessage = (message: string) => { setDraft(previous => ({ ...previous, message })); setReviewing(false); };
  const selected = new Set<ChangeKey>(line?.selected ?? []);
  if (draft.scheduleChanged) selected.add('schedule');

  // Guardar un cambio desde su campo pequeño: lo marca como seleccionado y copia sus valores.
  const applyChange = (key: ChangeKey, values: ChangeValues) => {
    if (!current) return;
    setReviewing(false);
    if (key === 'schedule') {
      setDraft(previous => ({ ...previous, scheduleChanged: true,
        immediate: values.immediate ?? previous.immediate, date: values.date ?? previous.date, time: values.time ?? previous.time }));
      return;
    }
    if (key === 'item') setPriceModes(previous => previous.map((value, i) => i !== index ? value : {
      unit: line.selected.has('item') ? value.unit : line.price, custom: values.price!,
    }));
    if (key === 'price' && !line.selected.has('item')) setPriceModes(previous => previous.map((value, i) => i !== index ? value : { ...value, unit: values.price! }));
    setDraft(previous => ({ ...previous, lines: previous.lines.map((value, i) => {
      if (i !== index) return value;
      const next = new Set(value.selected); next.add(key);
      const patch = key === 'item' ? { name: values.name!, description: values.description ?? '', price: values.price! }
        : key === 'price' ? { price: values.price! } : { quantity: values.quantity! };
      return { ...value, ...patch, selected: next };
    }) }));
  };

  // Quitar un cambio guardado: lo desmarca y devuelve el valor original.
  const removeChange = (key: ChangeKey) => {
    if (!current) return;
    setReviewing(false);
    if (key === 'schedule') {
      setDraft(previous => ({ ...previous, scheduleChanged: false, immediate: source.needNow, date: source.date, time: source.time }));
      return;
    }
    setDraft(previous => ({ ...previous, lines: previous.lines.map((value, i) => {
      if (i !== index) return value;
      const next = new Set(value.selected); next.delete(key);
      const original = source.items[index];
      const reset = key === 'item' ? { name: '', description: '', price: next.has('price') ? priceModes[index].unit : String(original.customTotal ?? original.price) }
        : key === 'price' ? { price: value.selected.has('item') ? priceModes[index].custom : String(original.customTotal ?? original.price) } : { quantity: String(original.quantity) };
      return { ...value, ...reset, selected: next };
    }) }));
  };

  const originalSchedule = source.needNow ? 'Lo antes posible' : `${source.date || 'Sin fecha disponible'} · ${source.time || 'Sin hora disponible'}`;
  return <Dialog.Root open onOpenChange={value => { if (!value && !sendLock.current) close(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[1000] bg-black/40" />
      <Dialog.Content className="zipco-action-dialog fixed bottom-4 left-1/2 z-[1001] flex max-h-[88dvh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 dark:bg-slate-900">
        <Dialog.Close asChild><button type="button" aria-label="Cerrar alternativa" className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full"><X className="h-5 w-5" /></button></Dialog.Close>
        <div ref={body} data-alternative-body className="min-h-0 flex-1 overflow-y-auto p-5 pb-3">
          <Dialog.Title className="pr-7 text-lg font-black">{reviewing ? 'Revisar alternativa' : title}</Dialog.Title>
          <Dialog.Description className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{reviewing ? 'Revisa cómo quedó tu propuesta antes de enviarla.' : 'Elige qué cambia. La solicitud original se conserva.'}</Dialog.Description>
          {!current && <p role="alert" className="mt-3 text-sm font-bold text-red-700">La solicitud cambió. Cierra y actualiza su estado antes de preparar otra alternativa.</p>}
          <fieldset disabled={!current || sending} className={reviewing ? 'hidden' : ''}>
            {source.items.length > 1 && <label className="mt-3 block text-sm font-bold">Artículo a modificar
              <select className={`mt-1 ${field}`} value={index} onChange={event => { setEditing(false); setIndex(Number(event.target.value)); }}>
                {source.items.map((item, i) => <option key={i} value={i}>{i + 1}. {item.name}</option>)}
              </select><span className="text-xs font-normal">Puedes ajustar cada línea; las demás se conservan.</span>
            </label>}
            {line && originalLine && <AlternativeChangeEditor key={index}
              original={`${source.items.map(item => `${item.quantity}x ${item.name}`).join(' · ')} · ${source.total === null ? 'Total no disponible' : pesos(source.total)}`}
              originalNote={`Horario original: ${originalSchedule}.${source.orderType === 'service' ? ' Servicio: cantidad 1.' : ''}`}
              originalLine={originalLine} originalSchedule={originalSchedule} line={line}
              schedule={{ immediate: draft.scheduleChanged ? draft.immediate : source.needNow, date: draft.scheduleChanged ? draft.date : source.date, time: draft.scheduleChanged ? draft.time : source.time }}
              originalScheduleValue={{ immediate: source.needNow, date: source.date, time: source.time }}
              customBasePrice={line.selected.has('item') ? priceModes[index].custom : String(originalLine.customTotal ?? originalLine.price)}
              onEditorOpenChange={setEditing}
              selected={selected} quantityLocked={source.orderType !== 'product'} quantityMax={99}
              onApply={applyChange} onRemove={removeChange}
              message={draft.message} setMessage={updateMessage} messageMaxLength={1000}
              explanationHint="Obligatorio: explica los cambios en 3 a 1000 caracteres. Si cambia el precio, explica el motivo."
              photoFields={null} />}
            {line && <div className="mt-4"><LocalAlternativePhoto onFile={onConfirm ? (file, preview) => { setFile(file); setPreview(preview); } : undefined} /></div>}
          </fieldset>
          {reviewing && validation.review && <AlternativeReviewPanel source={source} draft={draft} review={validation.review} />}
          {reviewing && preview && <img src={preview} alt="Foto que acompañará esta propuesta al enviarla" className="mt-3 max-h-48 w-full rounded-xl object-contain" />}
        </div>
        <div data-alternative-footer className="shrink-0 border-t border-slate-200 px-5 py-3 dark:border-slate-700">
          {editing && <p className="mb-2 text-xs text-slate-500">Guarda o cierra la edición antes de revisar la alternativa.</p>}
          {showErrors && validation.error && <p role="alert" className="mb-2 text-sm text-red-700">{validation.error}</p>}
          {sendError && <p role="alert" className="mb-2 text-sm text-red-700">{sendError}</p>}
          <div className="grid grid-cols-2 gap-2">
            {reviewing ? <button type="button" disabled={sending} onClick={() => setReviewing(false)} className="min-h-12 rounded-xl border py-3 font-bold">Volver al formulario</button>
              : <Dialog.Close asChild><button type="button" className="min-h-12 rounded-xl border py-3 font-bold">Volver</button></Dialog.Close>}
            {reviewing ? <button type="button" disabled={sending || !current || !validation.review || !canSubmitAlternative(Boolean(sourceOverride && onConfirm))}
              onClick={onConfirm ? async () => {
                if (sendLock.current || !current || !validation.review) return;
                sendLock.current = true; setSending(true); setSendError('');
                try { await onConfirm(validation.review, file); close(); }
                catch (error) { setSendError(error instanceof Error ? error.message : 'No se pudo confirmar el envío. Reintenta la misma operación.'); }
                finally { sendLock.current = false; setSending(false); }
              } : undefined} className="zipco-confirm-action min-h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 py-3 font-bold text-white disabled:opacity-50">{sending ? 'Enviando…' : 'Confirmar y enviar'}</button>
              : <button type="button" disabled={!current || editing} onClick={() => { setShowErrors(true); if (current && !editing && validation.review) setReviewing(true); }} className="zipco-confirm-action min-h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 py-3 font-bold text-white disabled:opacity-50">Revisar alternativa</button>}
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

export default function PendingAlternativeActions({ order, business = false, disabled = false }: { order: Order; business?: boolean; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const allowed = canPrepareAlternative(order, business);
  if (!allowed && !open) return null;
  return <div className="mt-3" onClick={event => event.stopPropagation()}>
    <button type="button" disabled={!allowed || disabled} onClick={() => setOpen(true)} className="min-h-12 w-full rounded-[16px] border border-violet-200 bg-violet-50 py-2.5 text-xs font-black text-violet-700 dark:bg-violet-950/30 dark:text-violet-200">Proponer alternativa</button>
    {open && <AlternativeDraftDialog order={order} close={() => setOpen(false)} />}
  </div>;
}

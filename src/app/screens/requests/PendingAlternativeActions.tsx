import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ImagePlus, Trash2, X } from 'lucide-react';
import AlternativeProposalFields, { type ChangeKey } from './AlternativeProposalFields';
import { alternativeSource, alternativeSourceCurrent, canPrepareAlternative, canSubmitAlternative, newAlternativeDraft, reviewAlternative, type AlternativeDraft } from './alternativeDraft';
import type { BusinessRequest, MyOrder } from './types';

type Order = BusinessRequest | MyOrder;
const field = 'zipco-readable-field w-full rounded-xl border p-3 text-sm';
const pesos = (value: number) => `$${value.toLocaleString('es-CL')}`;

export function LocalAlternativePhoto() {
  const [photo, setPhoto] = useState('');
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo); }, [photo]);
  return <div>
    {photo ? <div className="relative overflow-hidden rounded-2xl border border-violet-300">
      <img src={photo} alt="Foto preparada para la alternativa" className="h-36 w-full object-cover" />
      <button type="button" aria-label="Quitar foto preparada" onClick={() => setPhoto('')} className="absolute right-2 top-2 rounded-full bg-slate-950/75 p-2 text-white"><Trash2 className="h-4 w-4" /></button>
    </div> : <button type="button" onClick={() => input.current?.click()} className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-violet-400 bg-violet-500/5 p-4 text-left text-violet-700 dark:text-violet-200">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15"><ImagePlus className="h-5 w-5" /></span>
      <span><span className="block text-sm font-black">Agregar foto de referencia</span><span className="block text-xs opacity-70">Opcional, úsala si ayuda a explicar la propuesta.</span></span>
    </button>}
    <p className="mt-1 text-xs text-slate-500">Foto solo en este formulario, sin subir ni guardar. JPG, PNG o WebP, hasta 8 MB.</p>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <input ref={input} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={event => {
      const file = event.target.files?.[0]; event.target.value = '';
      if (!file) return;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size < 1 || file.size > 8 * 1024 * 1024) {
        setError('Selecciona una imagen JPG, PNG o WebP de hasta 8 MB.'); return;
      }
      try { setPhoto(URL.createObjectURL(file)); setError(''); }
      catch { setError('No se pudo preparar la foto. Intenta con otra imagen.'); }
    }} />
  </div>;
}

export function AlternativeDraftDialog({ order, close }: { order: Order; close: () => void }) {
  const [source] = useState(() => alternativeSource(order));
  const [draft, setDraft] = useState<AlternativeDraft>(() => newAlternativeDraft(source));
  const [index, setIndex] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const current = alternativeSourceCurrent(source, order, true);
  const validation = reviewAlternative(source, draft);
  const line = draft.lines[index];
  const custom = line?.selected.has('item') ?? false;
  const update = (patch: Partial<AlternativeDraft>) => { setDraft(previous => ({ ...previous, ...patch })); setReviewing(false); };
  const updateLine = (patch: Partial<AlternativeDraft['lines'][number]>) => setDraft(previous => ({ ...previous,
    lines: previous.lines.map((value, i) => i === index ? { ...value, ...patch } : value),
  }));
  const selected = new Set<ChangeKey>(line?.selected ?? []);
  if (draft.scheduleChanged) selected.add('schedule');
  const changeSelection = (next: Set<ChangeKey>) => {
    const itemChanged = next.has('item') !== custom;
    const scheduleChanged = next.has('schedule'); next.delete('schedule');
    if (next.has('item')) next.add('price');
    setDraft(previous => ({ ...previous, scheduleChanged, lines: previous.lines.map((value, i) => i !== index ? value : {
      ...value, selected: next, ...(itemChanged ? { price: next.has('item') ? '' : String(source.items[index].price) } : {}),
    }) }));
  };
  return <Dialog.Root open onOpenChange={value => { if (!value) close(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[1000] bg-black/40" />
      <Dialog.Content className="zipco-action-dialog fixed bottom-4 left-1/2 z-[1001] max-h-[88dvh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 dark:bg-slate-900">
        <Dialog.Title className="pr-7 text-lg font-black">{reviewing ? 'Revisar alternativa' : 'Proponer una alternativa'}</Dialog.Title>
        <Dialog.Description className="mt-1 text-sm text-slate-600 dark:text-slate-300">Selecciona qué aspectos quieres modificar. La solicitud original se conserva.</Dialog.Description>
        <Dialog.Close asChild><button type="button" aria-label="Cerrar alternativa" className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full"><X className="h-5 w-5" /></button></Dialog.Close>
        {!current && <p role="alert" className="mt-3 text-sm font-bold text-red-700">La solicitud cambió. Cierra y actualiza su estado antes de preparar otra alternativa.</p>}
        <fieldset disabled={!current} className={reviewing ? 'hidden' : ''}>
          {source.items.length > 1 && <label className="mt-3 block text-sm font-bold">Artículo a modificar
            <select className={`mt-1 ${field}`} value={index} onChange={event => setIndex(Number(event.target.value))}>
              {source.items.map((item, i) => <option key={i} value={i}>{i + 1}. {item.name}</option>)}
            </select><span className="text-xs font-normal">Puedes ajustar cada línea; las demás se conservan.</span>
          </label>}
          {line && <AlternativeProposalFields
            original={`${source.items.map(item => `${item.quantity}x ${item.name}`).join(' · ')} · ${source.total === null ? 'Total no disponible' : pesos(source.total)}`}
            item={line.name} setItem={name => updateLine({ name })} price={line.price} setPrice={price => updateLine({ price })}
            quantity={line.quantity} setQuantity={quantity => updateLine({ quantity })} date={draft.date} setDate={date => update({ date })}
            time={draft.time} setTime={time => update({ time })} message={draft.message} setMessage={message => update({ message })}
            photo="" setPhoto={() => {}} selectedChanges={selected} onSelectedChange={changeSelection}
            priceRequired={custom} priceLabel={custom ? 'Precio total de esta línea' : 'Precio por unidad'} strictPrice
            quantityMax={99} quantityLocked={source.orderType !== 'product'} messageMaxLength={1000}
            explanationHint="Obligatorio: explica los cambios en 3 a 1000 caracteres. Si cambia el precio, explica el motivo."
            itemFields={<div className="space-y-2">
              <p className="text-xs text-violet-700">Escribe una opción fuera del catálogo. No se creará un artículo nuevo.</p>
              <label className="block text-sm font-bold">Nombre de la alternativa<input value={line.name} maxLength={120} onChange={event => updateLine({ name: event.target.value })} className={`mt-1 ${field}`} /></label>
              <label className="block text-sm font-bold">Descripción opcional<textarea value={line.description} maxLength={500} onChange={event => updateLine({ description: event.target.value })} className={`mt-1 ${field}`} /></label>
              <p className="text-xs text-slate-500">Indica el precio total de esta línea, no un precio unitario calculado.</p>
            </div>}
            scheduleFields={<div className="space-y-2">
              <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={draft.immediate} onChange={event => update({ immediate: event.target.checked })} />Lo antes posible</label>
              {!draft.immediate && <div className="grid grid-cols-2 gap-2">
                <label className="min-w-0 text-xs font-bold">Fecha<input type="date" value={draft.date} onChange={event => update({ date: event.target.value })} className={`mt-1 min-w-0 ${field}`} />{!draft.date && <span>Selecciona fecha</span>}</label>
                <label className="min-w-0 text-xs font-bold">Hora de Chile<input type="time" value={draft.time} onChange={event => update({ time: event.target.value })} className={`mt-1 min-w-0 ${field}`} />{!draft.time && <span>Selecciona hora</span>}</label>
              </div>}
            </div>}
            photoFields={<LocalAlternativePhoto />} />}
          <p className="mt-2 text-xs text-slate-500">Horario original: {source.needNow ? 'Lo antes posible' : `${source.date || 'Sin fecha disponible'} · ${source.time || 'Sin hora disponible'}`}. {source.orderType === 'service' ? 'Servicio: cantidad 1.' : ''}</p>
        </fieldset>
        {showErrors && validation.error && <p role="alert" className="mt-3 text-sm text-red-700">{validation.error}</p>}
        {reviewing && validation.review && <div className="mt-4 space-y-3 rounded-2xl border border-violet-200 bg-violet-50/60 p-3 text-sm dark:bg-violet-950/30">
          <p className="font-black">Comparación · Borrador sin enviar</p>
          {source.items.map((item, i) => {
            const proposed = draft.lines[i], changedItem = proposed.selected.has('item');
            const quantity = proposed.selected.has('quantity') ? Number(proposed.quantity) : item.quantity;
            const subtotal = changedItem ? Number(proposed.price) : (proposed.selected.has('price') ? Number(proposed.price) : item.price) * quantity;
            return <div key={i} className="border-t border-violet-200 pt-2">
              <p>Original: {item.quantity}x {item.name} · {pesos(item.price * item.quantity)}</p>
              <p className="font-bold">Alternativa: {quantity}x {changedItem ? proposed.name.trim() : item.name} · {pesos(subtotal)}</p>
              {changedItem && proposed.description.trim() && <p>{proposed.description.trim()}</p>}
            </div>;
          })}
          <p>Total original: {source.total === null ? 'No disponible' : pesos(source.total)}</p>
          <p className="font-black">Total propuesto: {pesos(validation.review.totalPriceClp)}</p>
          <p>Fecha y hora propuestas: {(draft.scheduleChanged ? draft.immediate : source.needNow) ? 'Lo antes posible' : `${draft.scheduleChanged ? draft.date : source.date} · ${draft.scheduleChanged ? draft.time : source.time} (Chile)`}</p>
          <p className="whitespace-pre-wrap break-words">Explicación: {validation.review.message}</p>
        </div>}
        <div className="mt-5 grid grid-cols-2 gap-2">
          {reviewing ? <button type="button" onClick={() => setReviewing(false)} className="min-h-12 rounded-xl border py-3 font-bold">Volver al formulario</button>
            : <Dialog.Close asChild><button type="button" className="min-h-12 rounded-xl border py-3 font-bold">Volver</button></Dialog.Close>}
          {reviewing ? <button type="button" disabled={!canSubmitAlternative()} className="zipco-confirm-action min-h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 py-3 font-bold text-white disabled:opacity-50">Confirmar y enviar</button>
            : <button type="button" disabled={!current} onClick={() => { setShowErrors(true); if (validation.review) setReviewing(true); }} className="zipco-confirm-action min-h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 py-3 font-bold text-white disabled:opacity-50">Revisar alternativa</button>}
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

import { useState } from 'react';
import { Calendar, Check, ChevronRight, Image as ImageIcon, Minus, RotateCcw, Trash2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import type { QuoteRequest } from '../quotes/quoteApi';
import type { BusinessRequest, MyOrder } from './types';
import { interactionKey, useUnreadInteractions, type InteractionKind } from '../../notifications/unreadInteractions';

type HistoryItem = {
  key: string;
  id: number;
  kind: InteractionKind;
  title: string;
  subtitle: string;
  date: string;
  image: string | null;
  status: 'completed' | 'cancelled' | 'rejected';
  price: number | null;
  details: string[];
  schedule: string;
  note: string;
  response: string;
  reason: string;
  referencePhoto: string | null;
};

const reasonLabels = {
  no_longer_needed: 'Ya no lo necesitaba.',
  business_took_too_long: 'El negocio tardó demasiado.',
  selected_by_mistake: 'Fue seleccionado por error.'
} as const;

const statusPresentation = {
  completed: { label: 'Completada', classes: 'bg-emerald-50 text-emerald-600', icon: Check },
  cancelled: { label: 'Cancelada', classes: 'bg-red-50 text-red-500', icon: X },
  rejected: { label: 'Rechazada', classes: 'bg-red-50 text-red-500', icon: Minus }
} as const;

const money = (value: number) => new Intl.NumberFormat('es-CL', {
  style: 'currency', currency: 'CLP', maximumFractionDigits: 0
}).format(value);

function formatDate(value: string | null) {
  if (!value) return 'Fecha no disponible';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(parsed);
}

function normalizeOrder(order: MyOrder | BusinessRequest, owner: 'customer' | 'business'): HistoryItem {
  const products = order.products.state === 'available' ? order.products.items : [];
  const status = order.recordState === 'available' && order.status === 'completed'
    ? 'completed'
    : order.recordState === 'available' && order.status === 'cancelled'
      ? 'cancelled'
      : 'rejected';
  const isCustomer = owner === 'customer';
  const identity = isCustomer ? order as MyOrder : order as BusinessRequest;
  return {
    key: order.clientKey,
    id: order.recordState === 'available' ? order.id : 0,
    kind: 'order',
    title: products.map((product) => product.name).join(', ') || 'Pedido',
    subtitle: isCustomer ? (identity as MyOrder).businessName : (identity as BusinessRequest).customerName,
    date: order.date || formatDate(order.createdAt),
    image: isCustomer ? (identity as MyOrder).businessImage : (identity as BusinessRequest).customerImage,
    status,
    price: order.total,
    details: products.map((product) => `${product.quantity}x ${product.name} — ${money(product.price * product.quantity)}`),
    schedule: order.needNow ? (isCustomer ? 'Lo necesitabas ahora' : 'Lo necesitaba ahora') : order.deliveryDate && order.deliveryTime ? `${order.deliveryDate} · ${order.deliveryTime}` : 'Horario no disponible',
    note: order.note,
    response: '',
    reason: order.cancellationReason && order.cancellationReason !== 'unavailable' ? reasonLabels[order.cancellationReason] : '',
    referencePhoto: order.referencePhoto
  };
}

function normalizeQuote(quote: QuoteRequest, owner: 'customer' | 'business'): HistoryItem {
  return {
    key: `quote-${quote.id}`,
    id: quote.id,
    kind: 'quote',
    title: quote.itemNameSnapshot,
    subtitle: owner === 'business' ? quote.customerName : 'Tu cotización',
    date: formatDate(quote.updatedAt || quote.createdAt),
    image: quote.referencePhoto,
    status: quote.status === 'cancelled' ? 'cancelled' : 'rejected',
    price: quote.quotedPriceClp ?? quote.startingPriceClpSnapshot,
    details: [],
    schedule: quote.needNow ? 'Lo necesita ahora' : quote.requestedDate && quote.requestedTime ? `${quote.requestedDate} · ${quote.requestedTime}` : 'Horario no disponible',
    note: quote.message,
    response: quote.businessMessage ?? '',
    reason: quote.status === 'cancelled' ? 'La solicitud fue cancelada.' : quote.status === 'declined' ? 'La cotización fue rechazada.' : '',
    referencePhoto: quote.referencePhoto
  };
}

export function OrderHistoryList({ orders, owner, deleted, onArchive }: { orders: Array<MyOrder | BusinessRequest>; owner: 'customer' | 'business'; deleted: boolean; onArchive: (id: number, archived: boolean) => void }) {
  return <CompactHistoryList items={orders.map((order) => normalizeOrder(order, owner))} deleted={deleted} onArchive={onArchive} />;
}

export function QuoteHistoryList({ quotes, owner, deleted, onArchive }: { quotes: QuoteRequest[]; owner: 'customer' | 'business'; deleted: boolean; onArchive: (quote: QuoteRequest, archived: boolean) => void }) {
  const byId = new Map(quotes.map((quote) => [quote.id, quote]));
  return <CompactHistoryList items={quotes.map((quote) => normalizeQuote(quote, owner))} deleted={deleted} onArchive={(id, archived) => { const quote = byId.get(id); if (quote) onArchive(quote, archived); }} />;
}

function CompactHistoryList({ items, deleted, onArchive }: { items: HistoryItem[]; deleted: boolean; onArchive: (id: number, archived: boolean) => void }) {
  const [selected, setSelected] = useState<HistoryItem | null>(null);
  const [pendingArchive, setPendingArchive] = useState<HistoryItem | null>(null);
  const [swipedKey, setSwipedKey] = useState<string | null>(null);
  const { unread, markRead } = useUnreadInteractions();
  return <>
    <div className="space-y-2.5">
      {items.map((item) => {
        const presentation = statusPresentation[item.status];
        const StatusIcon = presentation.icon;
        const isUnread = unread.has(interactionKey(item.kind, item.id));
        const isSwiped = swipedKey === item.key;
        return <div key={item.key} className="relative overflow-hidden rounded-2xl">
          <button type="button" onClick={() => setPendingArchive(item)} className={`absolute inset-y-0 right-0 flex w-24 flex-col items-center justify-center gap-1 text-xs font-black text-white ${deleted ? 'bg-emerald-600' : 'bg-red-500'}`}>
            {deleted ? <RotateCcw className="h-5 w-5" /> : <Trash2 className="h-5 w-5" />}
            {deleted ? 'Restaurar' : 'Eliminar'}
          </button>
          <motion.button
            id={`${item.kind}-${item.id}`}
            type="button"
            drag="x"
            dragConstraints={{ left: -96, right: 0 }}
            dragElastic={0.08}
            animate={{ x: isSwiped ? -96 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 38 }}
            onDragEnd={(_, info) => setSwipedKey(info.offset.x < -45 ? item.key : null)}
            onClick={() => {
              if (isSwiped) { setSwipedKey(null); return; }
              markRead(item.kind, item.id); setSelected(item);
            }}
            className={`relative grid w-full grid-cols-[64px_1fr_auto] items-center gap-3 rounded-2xl border p-3 text-left shadow-sm ${isUnread ? 'border-sky-300 bg-sky-50 ring-2 ring-sky-100' : 'border-slate-100 bg-white'}`}
          >
          {item.image
            ? <ImageWithFallback src={item.image} alt={item.title} className="h-16 w-16 rounded-xl object-cover" />
            : <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-slate-400"><ImageIcon className="h-6 w-6" /></span>}
          <span className="min-w-0">
            <span className="flex items-center gap-2"><span className="block truncate text-sm font-black text-slate-900">{item.title}</span>{isUnread && <span className="rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-black text-white">Nueva</span>}</span>
            <span className="mt-0.5 block truncate text-xs text-slate-500">{item.subtitle}</span>
            <span className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500"><Calendar className="h-3.5 w-3.5" />{item.date}</span>
          </span>
          <span className="flex min-w-[92px] flex-col items-end gap-2">
            <span
              role="button"
              tabIndex={0}
              aria-label={deleted ? 'Restaurar solicitud' : 'Mover solicitud a Eliminados'}
              onClick={(event) => {
                event.stopPropagation();
                setPendingArchive(item);
              }}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault(); event.stopPropagation();
                setPendingArchive(item);
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-full ${deleted ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}
            >{deleted ? <RotateCcw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${presentation.classes}`}><StatusIcon className="h-3.5 w-3.5" />{presentation.label}</span>
            <span className="flex items-center gap-1.5"><span className="text-sm font-black text-emerald-600">{item.price === null ? '—' : money(item.price)}</span><ChevronRight className="h-5 w-5 text-slate-600" /></span>
          </span>
          </motion.button>
        </div>;
      })}
    </div>
    {pendingArchive && <div className="absolute inset-0 z-[60] flex items-end bg-slate-950/45 p-3 sm:items-center">
      <div className="mx-auto w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${deleted ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
          {deleted ? <RotateCcw className="h-7 w-7" /> : <Trash2 className="h-7 w-7" />}
        </div>
        <h3 className="mt-4 text-center text-lg font-black text-slate-900">{deleted ? 'Restaurar solicitud' : 'Mover a Eliminados'}</h3>
        <p className="mt-2 text-center text-sm leading-5 text-slate-600">{deleted ? '¿Deseas restaurar esta solicitud para que vuelva al historial?' : '¿Deseas mover esta solicitud a Eliminados? Podrás restaurarla después.'}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setPendingArchive(null)} className="rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700">Cancelar</button>
          <button type="button" onClick={() => { onArchive(pendingArchive.id, !deleted); setPendingArchive(null); }} className={`rounded-xl py-3 text-sm font-bold text-white ${deleted ? 'bg-emerald-600' : 'bg-red-500'}`}>{deleted ? 'Restaurar' : 'Mover'}</button>
        </div>
      </div>
    </div>}
    {selected && <div className="absolute inset-0 z-50 flex items-end bg-slate-950/45 p-3">
      <div className="mx-auto max-h-[88vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-teal-600">Detalle del historial</p><h3 className="mt-1 text-xl font-black text-slate-900">{selected.title}</h3><p className="text-sm text-slate-500">{selected.subtitle}</p></div><button onClick={() => setSelected(null)} className="rounded-full bg-slate-100 p-2"><X className="h-5 w-5" /></button></div>
        <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4">
          <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${statusPresentation[selected.status].classes}`}>{statusPresentation[selected.status].label}</div>
          <p className="flex items-center gap-2 text-sm text-slate-600"><Calendar className="h-4 w-4" />{selected.date}</p>
          <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Entrega o atención</p><p className="mt-1 text-sm text-slate-700">{selected.schedule}</p></div>
          {selected.details.length > 0 && <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Detalle</p>{selected.details.map((detail, index) => <p key={`${detail}-${index}`} className="mt-1 text-sm text-slate-700">{detail}</p>)}</div>}
          {selected.note && <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Nota del cliente</p><p className="mt-1 rounded-xl bg-white p-3 text-sm italic text-slate-700">“{selected.note}”</p></div>}
          {selected.response && <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Respuesta del proveedor</p><p className="mt-1 rounded-xl bg-white p-3 text-sm text-slate-700">{selected.response}</p></div>}
          {selected.reason && <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Motivo</p><p className="mt-1 text-sm text-slate-700">{selected.reason}</p></div>}
          {selected.referencePhoto && <div><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Foto de referencia</p><ImageWithFallback src={selected.referencePhoto} alt="Foto de referencia" className="h-44 w-full rounded-xl object-cover" /></div>}
          <p className="pt-1 text-xl font-black text-emerald-600">{selected.price === null ? 'Precio no disponible' : money(selected.price)}</p>
        </div>
        <button onClick={() => setSelected(null)} className="mt-4 w-full rounded-xl bg-teal-600 py-3 font-bold text-white">Cerrar</button>
      </div>
    </div>}
  </>;
}

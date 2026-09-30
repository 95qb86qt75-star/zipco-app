import { useState } from 'react';
import { Calendar, Check, ChevronRight, Image as ImageIcon, Minus, Package, X } from 'lucide-react';
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
};

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
    details: products.map((product) => `${product.quantity}x ${product.name}`)
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
    details: [quote.message, quote.businessMessage].filter((value): value is string => Boolean(value))
  };
}

export function OrderHistoryList({ orders, owner }: { orders: Array<MyOrder | BusinessRequest>; owner: 'customer' | 'business' }) {
  return <CompactHistoryList items={orders.map((order) => normalizeOrder(order, owner))} />;
}

export function QuoteHistoryList({ quotes, owner }: { quotes: QuoteRequest[]; owner: 'customer' | 'business' }) {
  return <CompactHistoryList items={quotes.map((quote) => normalizeQuote(quote, owner))} />;
}

function CompactHistoryList({ items }: { items: HistoryItem[] }) {
  const [selected, setSelected] = useState<HistoryItem | null>(null);
  const { unread, markRead } = useUnreadInteractions();
  return <>
    <div className="space-y-2.5">
      {items.map((item) => {
        const presentation = statusPresentation[item.status];
        const StatusIcon = presentation.icon;
        const isUnread = unread.has(interactionKey(item.kind, item.id));
        return <button id={`${item.kind}-${item.id}`} key={item.key} type="button" onClick={() => { markRead(item.kind, item.id); setSelected(item); }} className={`grid w-full grid-cols-[64px_1fr_auto] items-center gap-3 rounded-2xl border p-3 text-left shadow-sm ${isUnread ? 'border-sky-300 bg-sky-50 ring-2 ring-sky-100' : 'border-slate-100 bg-white'}`}>
          {item.image
            ? <ImageWithFallback src={item.image} alt={item.title} className="h-16 w-16 rounded-xl object-cover" />
            : <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-slate-400"><ImageIcon className="h-6 w-6" /></span>}
          <span className="min-w-0">
            <span className="flex items-center gap-2"><span className="block truncate text-sm font-black text-slate-900">{item.title}</span>{isUnread && <span className="rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-black text-white">Nueva</span>}</span>
            <span className="mt-0.5 block truncate text-xs text-slate-500">{item.subtitle}</span>
            <span className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500"><Calendar className="h-3.5 w-3.5" />{item.date}</span>
          </span>
          <span className="flex min-w-[92px] flex-col items-end gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${presentation.classes}`}><StatusIcon className="h-3.5 w-3.5" />{presentation.label}</span>
            <span className="flex items-center gap-1.5"><span className="text-sm font-black text-emerald-600">{item.price === null ? '—' : money(item.price)}</span><ChevronRight className="h-5 w-5 text-slate-600" /></span>
          </span>
        </button>;
      })}
    </div>
    {selected && <div className="absolute inset-0 z-50 flex items-end bg-slate-950/45 p-3">
      <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-5">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-teal-600">Detalle del historial</p><h3 className="mt-1 text-xl font-black text-slate-900">{selected.title}</h3><p className="text-sm text-slate-500">{selected.subtitle}</p></div><button onClick={() => setSelected(null)} className="rounded-full bg-slate-100 p-2"><X className="h-5 w-5" /></button></div>
        <div className="mt-4 rounded-2xl bg-slate-50 p-4"><p className="flex items-center gap-2 text-sm text-slate-600"><Calendar className="h-4 w-4" />{selected.date}</p>{selected.details.map((detail, index) => <p key={`${detail}-${index}`} className="mt-2 text-sm text-slate-700">{detail}</p>)}<p className="mt-4 text-xl font-black text-emerald-600">{selected.price === null ? 'Precio no disponible' : money(selected.price)}</p></div>
        <button onClick={() => setSelected(null)} className="mt-4 w-full rounded-xl bg-teal-600 py-3 font-bold text-white">Cerrar</button>
      </div>
    </div>}
  </>;
}

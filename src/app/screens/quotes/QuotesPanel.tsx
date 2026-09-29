import { useState } from 'react';
import { Calendar, MessageSquareText } from 'lucide-react';
import type { QuoteRequest } from './quoteApi';

const labels = { requested: 'Esperando respuesta', quoted: 'Cotización recibida', accepted: 'Aceptada', declined: 'Rechazada', cancelled: 'Cancelada' } as const;
const money = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);

export function CustomerQuotes({ quotes, updating, onStatus, emptyText = "Tus cotizaciones aparecerán aquí" }: { quotes: QuoteRequest[]; updating: Set<number>; onStatus: (quote: QuoteRequest, status: 'accepted' | 'declined' | 'cancelled') => void; emptyText?: string }) {
  if (!quotes.length) return <Empty text={emptyText} />;
  return <div className="space-y-3">{quotes.map((quote) => <QuoteCard key={quote.id} quote={quote}>
    {quote.status === 'quoted' && <div className="mt-3 grid grid-cols-2 gap-2"><button disabled={updating.has(quote.id)} onClick={() => onStatus(quote, 'declined')} className="rounded-xl border border-red-200 py-2 text-sm font-bold text-red-600">Rechazar</button><button disabled={updating.has(quote.id)} onClick={() => onStatus(quote, 'accepted')} className="rounded-xl bg-emerald-500 py-2 text-sm font-bold text-white">Aceptar</button></div>}
    {(quote.status === 'requested' || quote.status === 'quoted') && <button disabled={updating.has(quote.id)} onClick={() => onStatus(quote, 'cancelled')} className="mt-2 w-full py-1 text-xs font-semibold text-slate-500">Cancelar solicitud</button>}
  </QuoteCard>)}</div>;
}

export function BusinessQuotes({ quotes, updating, onRespond, emptyText = "Las solicitudes de cotización aparecerán aquí" }: { quotes: QuoteRequest[]; updating: Set<number>; onRespond: (quote: QuoteRequest, price: number, message: string) => void; emptyText?: string }) {
  const [selected, setSelected] = useState<QuoteRequest | null>(null); const [price, setPrice] = useState(''); const [message, setMessage] = useState('');
  if (!quotes.length) return <Empty text={emptyText} />;
  return <><div className="space-y-3">{quotes.map((quote) => <QuoteCard key={quote.id} quote={quote}>{quote.status === 'requested' && <button onClick={() => { setSelected(quote); setPrice(''); setMessage(''); }} className="mt-3 w-full rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white">Responder con precio</button>}</QuoteCard>)}</div>
    {selected && <div className="absolute inset-0 z-50 flex items-end bg-slate-950/45 p-3"><div className="mx-auto w-full max-w-md rounded-3xl bg-white p-5"><h3 className="text-lg font-black">Responder cotización</h3><p className="mt-1 text-sm text-slate-500">{selected.itemNameSnapshot} · {selected.customerName}</p><label className="mt-4 block text-sm font-bold">Precio final<input inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value.replace(/\D/g, ''))} className="mt-2 w-full rounded-xl border p-3 font-normal" placeholder="Ej: 25000" /></label><label className="mt-3 block text-sm font-bold">Mensaje <span className="font-normal text-slate-400">(opcional)</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} className="mt-2 w-full rounded-xl border p-3 font-normal" rows={3} /></label><div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => setSelected(null)} className="rounded-xl border py-3 font-bold">Volver</button><button disabled={updating.has(selected.id) || Number(price) < 100} onClick={() => { onRespond(selected, Number(price), message); setSelected(null); }} className="rounded-xl bg-violet-600 py-3 font-bold text-white disabled:opacity-50">Enviar</button></div></div></div>}
  </>;
}

function QuoteCard({ quote, children }: { quote: QuoteRequest; children?: React.ReactNode }) {
  return <article className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-slate-900">{quote.itemNameSnapshot}</h3><p className="text-xs text-slate-500">{quote.customerName}</p></div><span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700">{labels[quote.status]}</span></div><p className="mt-3 text-sm text-slate-700">{quote.message}</p><div className="mt-2 flex items-center gap-2 text-xs text-slate-500"><Calendar className="h-3.5 w-3.5" />{quote.needNow ? 'Lo necesita ahora' : `${quote.requestedDate} · ${quote.requestedTime}`}</div>{quote.quotedPriceClp !== null && <p className="mt-3 text-xl font-black text-emerald-600">{money(quote.quotedPriceClp)}</p>}{quote.businessMessage && <p className="mt-2 flex gap-2 rounded-xl bg-slate-50 p-3 text-sm"><MessageSquareText className="h-4 w-4 shrink-0" />{quote.businessMessage}</p>}{children}</article>;
}
function Empty({ text }: { text: string }) { return <div className="py-16 text-center"><MessageSquareText className="mx-auto h-10 w-10 text-violet-300" /><p className="mt-3 text-sm font-semibold text-slate-500">{text}</p></div>; }

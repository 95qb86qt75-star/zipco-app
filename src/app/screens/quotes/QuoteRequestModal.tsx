import { type ChangeEvent, useRef, useState } from 'react';
import { Calendar, Camera, Clock, Trash2, X } from 'lucide-react';
import type { CatalogItem } from '../profile/business-config/types';
import { createQuote } from './quoteApi';
import { showAppToast } from '../Toast';
import { getCloudinarySecureImageUrl } from '../profile/business-config/catalogValidation';

export default function QuoteRequestModal({ businessId, item, onClose, onCreated, onSessionExpired }: {
  businessId: number; item: CatalogItem; onClose: () => void; onCreated: () => void; onSessionExpired?: () => void;
}) {
  const [message, setMessage] = useState('');
  const [needNow, setNeedNow] = useState(true);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [photo, setPhoto] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const key = useRef(crypto.randomUUID());

  const uploadPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Selecciona un archivo de imagen.'); event.target.value = ''; return; }
    if (file.size > 10 * 1024 * 1024) { setError('La foto no puede superar los 10 MB.'); event.target.value = ''; return; }
    setUploadingPhoto(true); setError('');
    try {
      const body = new FormData(); body.append('file', file); body.append('upload_preset', 'zipco_products');
      const response = await fetch('https://api.cloudinary.com/v1_1/dr6xu5xr9/image/upload', { method: 'POST', body });
      if (!response.ok) throw new Error();
      const imageUrl = getCloudinarySecureImageUrl(await response.json() as unknown);
      if (!imageUrl) throw new Error();
      setPhoto(imageUrl);
    } catch { setError('No se pudo subir la foto. Intenta nuevamente.'); }
    finally { setUploadingPhoto(false); event.target.value = ''; }
  };

  const submit = async () => {
    const token = localStorage.getItem('zipco-token');
    if (!token) { onSessionExpired?.(); return; }
    if (!message.trim()) { setError('Describe lo que necesitas.'); return; }
    if (!needNow && (!date || !time)) { setError('Selecciona fecha y hora.'); return; }
    if (submitting) return;
    setSubmitting(true); setError('');
    try {
      await createQuote({ businessId, catalogItemId: item.id, message: message.trim(), needNow, requestedDate: needNow ? undefined : date, requestedTime: needNow ? undefined : time, referencePhoto: photo.trim() || undefined }, token, key.current);
      showAppToast('Cotización enviada. Puedes seguirla en Solicitudes.');
      onCreated(); onClose();
    } catch (cause: any) {
      if (cause?.status === 401) onSessionExpired?.();
      setError(cause?.message || 'No se pudo enviar la cotización.');
    } finally { setSubmitting(false); }
  };

  return <div className="absolute inset-0 z-50 flex items-end bg-slate-950/45 p-3 sm:items-center">
    <div role="dialog" aria-modal="true" aria-labelledby="quote-title" className="mx-auto max-h-[88vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
      <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-violet-600">Solicitar cotización</p><h2 id="quote-title" className="text-xl font-black text-slate-950">{item.name}</h2></div><button type="button" onClick={onClose} disabled={submitting} className="rounded-full bg-slate-100 p-2"><X className="h-5 w-5" /></button></div>
      <label className="block text-sm font-bold text-slate-800">¿Qué necesitas?<textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1000} rows={4} className="mt-2 w-full resize-none rounded-2xl border border-slate-200 p-3 font-normal outline-none focus:border-violet-500" placeholder="Describe el trabajo, medidas o detalles importantes" /></label>
      <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => setNeedNow(true)} className={`rounded-xl border px-3 py-3 text-sm font-bold ${needNow ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-600'}`}>Lo necesito ahora</button><button type="button" onClick={() => setNeedNow(false)} className={`rounded-xl border px-3 py-3 text-sm font-bold ${!needNow ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-600'}`}>Agendar</button></div>
      {!needNow && <div className="mt-3 grid grid-cols-2 gap-2"><label className="text-xs font-bold text-slate-700"><span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Fecha</span><input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal" /></label><label className="text-xs font-bold text-slate-700"><span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Hora</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal" /></label></div>}
      <div className="mt-4"><p className="text-sm font-bold text-slate-800">Foto de referencia <span className="font-normal text-slate-400">(opcional)</span></p>{photo ? <div className="relative mt-2 overflow-hidden rounded-2xl border border-slate-200"><img src={photo} alt="Vista previa de referencia" className="h-40 w-full object-cover" /><button type="button" onClick={() => setPhoto('')} disabled={submitting} className="absolute right-2 top-2 rounded-full bg-white/95 p-2 text-red-600 shadow" aria-label="Eliminar foto"><Trash2 className="h-4 w-4" /></button></div> : <label className="mt-2 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-violet-300 bg-violet-50/60 p-3 text-center text-sm font-bold text-violet-700"><Camera className="mb-1 h-6 w-6" />{uploadingPhoto ? 'Subiendo foto…' : 'Seleccionar foto'}<span className="mt-1 text-xs font-normal text-slate-500">JPG, PNG o imagen del teléfono · máximo 10 MB</span><input type="file" accept="image/*" className="hidden" disabled={uploadingPhoto || submitting} onChange={(event) => void uploadPhoto(event)} /></label>}</div>
      {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      <button type="button" onClick={() => void submit()} disabled={submitting || uploadingPhoto} className="mt-5 w-full rounded-full bg-gradient-to-r from-violet-600 to-purple-600 py-3.5 font-bold text-white disabled:opacity-60">{submitting ? 'Enviando…' : uploadingPhoto ? 'Subiendo foto…' : 'Enviar cotización'}</button>
    </div>
  </div>;
}

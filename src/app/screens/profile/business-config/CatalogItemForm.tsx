import React, { useState, type ChangeEvent } from 'react';
import { ArrowRight, Briefcase, CheckCircle2, ChevronRight, Circle, Eye, FileText, ImageIcon, Info, Package, ReceiptText, ShoppingBag, Tag, X } from 'lucide-react';
import { buildCatalogItemPayload, formatClpInput, getCloudinarySecureImageUrl, validateCatalogItemForm, type CatalogFormErrors } from './catalogValidation';
import type { CatalogItem, CatalogItemFormState, CatalogItemPricingMode, CatalogItemWritePayload } from './types';

const emptyForm = (): CatalogItemFormState => ({ name: '', description: '', kind: 'product', pricingMode: 'fixed_price', priceClp: '', startingPriceClp: '', imageUrl: '' });
export type OptionalCatalogSections = { description: boolean; image: boolean };
export const PRICING_MODE_HELP: Record<CatalogItemPricingMode, string> = {
  fixed_price: 'El cliente verá un precio final.', quote: 'El precio se acuerda antes de confirmar.', view: 'Aparecerá sin opción de compra.'
};
export function initialOptionalCatalogSections(item: CatalogItem | null): OptionalCatalogSections { return { description: Boolean(item?.description), image: Boolean(item?.imageUrl) }; }
export function openOptionalCatalogSection(state: OptionalCatalogSections, section: keyof OptionalCatalogSections): OptionalCatalogSections { return { ...state, [section]: true }; }
export function toggleOptionalCatalogSection(state: OptionalCatalogSections, section: keyof OptionalCatalogSections): OptionalCatalogSections { return { ...state, [section]: !state[section] }; }
export function formFromCatalogItem(item: CatalogItem): CatalogItemFormState {
  return { name: item.name, description: item.description ?? '', kind: item.kind, pricingMode: item.pricingMode, priceClp: item.priceClp?.toString() ?? '', startingPriceClp: item.startingPriceClp?.toString() ?? '', imageUrl: item.imageUrl ?? '' };
}

type Props = { item: CatalogItem | null; isSaving: boolean; onCancel: () => void; onSubmit: (payload: CatalogItemWritePayload) => Promise<void>; onError: (message: string) => void; };

export default function CatalogItemForm({ item, isSaving, onCancel, onSubmit, onError }: Props) {
  const [form, setForm] = useState<CatalogItemFormState>(() => item ? formFromCatalogItem(item) : emptyForm());
  const [errors, setErrors] = useState<CatalogFormErrors>({});
  const [optionalSections, setOptionalSections] = useState(() => initialOptionalCatalogSections(item));
  const [isUploading, setIsUploading] = useState(false);
  const digits = (value: string) => value.replace(/\D/g, '');
  const update = <K extends keyof CatalogItemFormState>(key: K, value: CatalogItemFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const changePricingMode = (pricingMode: CatalogItemPricingMode) => {
    setForm((current) => ({ ...current, pricingMode, priceClp: pricingMode === 'fixed_price' ? current.priceClp : '', startingPriceClp: pricingMode === 'quote' ? current.startingPriceClp : '' }));
    setErrors((current) => ({ ...current, pricingMode: undefined, priceClp: undefined, startingPriceClp: undefined }));
  };
  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const body = new FormData();
      body.append('file', file); body.append('upload_preset', 'zipco_products');
      const response = await fetch('https://api.cloudinary.com/v1_1/dr6xu5xr9/image/upload', { method: 'POST', body });
      if (!response.ok) throw new Error();
      const candidate = getCloudinarySecureImageUrl(await response.json() as unknown);
      if (!candidate) throw new Error();
      update('imageUrl', candidate);
    } catch { onError('No se pudo subir la imagen. Intenta nuevamente.'); }
    finally { setIsUploading(false); event.target.value = ''; }
  };
  const submit = async () => {
    const nextErrors = validateCatalogItemForm(form);
    setErrors(nextErrors);
    if (nextErrors.description) setOptionalSections((current) => openOptionalCatalogSection(current, 'description'));
    if (nextErrors.imageUrl) setOptionalSections((current) => openOptionalCatalogSection(current, 'image'));
    if (Object.keys(nextErrors).length > 0) return;
    await onSubmit(buildCatalogItemPayload(form));
  };
  const modes: Array<[CatalogItemPricingMode, string]> = [['fixed_price', 'Precio fijo'], ['quote', 'Cotizar'], ['view', 'Solo mostrar']];
  const modeIcons = { fixed_price: Tag, quote: ReceiptText, view: Eye };
  const descriptionComplete = form.description.trim().length > 0;
  const imageComplete = form.imageUrl.length > 0;

  return <div className="absolute inset-0 z-[70] flex min-h-0 flex-col overflow-hidden bg-[#F5F8FD]">
    <header className="shrink-0 border-b border-slate-100 bg-white px-4 pb-3 shadow-sm" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600"><ShoppingBag aria-hidden="true" className="h-6 w-6" /></div>
        <div className="min-w-0 flex-1"><h4 className="text-xl font-bold text-slate-950">{item ? 'Editar artículo' : 'Nuevo artículo'}</h4><p className="mt-0.5 text-sm leading-5 text-slate-500">{item ? 'Actualiza la información de tu catálogo.' : 'Agrega un producto o servicio a tu catálogo.'}</p></div>
        <button type="button" aria-label="Cerrar editor" title="Cerrar" onClick={onCancel} disabled={isSaving} className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 disabled:opacity-50"><X aria-hidden="true" className="h-6 w-6" /></button>
      </div>
    </header>

    <div className="min-h-0 flex-1 touch-pan-y space-y-3 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-3">
      <label className="block text-sm font-semibold text-slate-800"><span className="flex items-center justify-between"><span>Nombre</span><span className="font-normal text-slate-400">{form.name.length}/120</span></span><span className="relative mt-2 block"><Tag aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input autoFocus maxLength={120} value={form.name} onChange={(event) => update('name', event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-3 font-normal text-slate-900 outline-none focus:border-teal-500" placeholder="Ej: Torta de chocolate" /></span>{errors.name && <span className="mt-1 block text-xs font-normal text-red-600">{errors.name}</span>}</label>

      <fieldset><legend className="mb-2 text-sm font-semibold text-slate-800">Tipo</legend><div className="grid grid-cols-2 gap-2">{(['product', 'service'] as const).map((kind) => {
        const selected = form.kind === kind; const Icon = kind === 'product' ? Package : Briefcase;
        return <button key={kind} type="button" onClick={() => update('kind', kind)} className={`flex min-h-[76px] items-center gap-2 rounded-xl border p-3 text-left ${selected ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-slate-200 bg-white text-slate-700'}`}><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${selected ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-500'}`}><Icon aria-hidden="true" className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{kind === 'product' ? 'Producto' : 'Servicio'}</span><span className="mt-0.5 block text-xs font-normal leading-4 text-slate-500">{kind === 'product' ? 'Un bien físico que vendes' : 'Un servicio que ofreces'}</span></span>{selected ? <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0 text-teal-600" /> : <Circle aria-hidden="true" className="h-5 w-5 shrink-0 text-slate-300" />}</button>;
      })}</div></fieldset>

      <fieldset><legend className="mb-2 text-sm font-semibold text-slate-800">Modalidad</legend><div className="grid grid-cols-3 gap-2">{modes.map(([mode, label]) => <button key={mode} type="button" onClick={() => changePricingMode(mode)} className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl border px-1.5 py-2 text-xs font-semibold ${form.pricingMode === mode ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-slate-200 bg-white text-slate-600'}`}>{React.createElement(modeIcons[mode], { 'aria-hidden': true, className: 'h-5 w-5' })}<span>{label}</span></button>)}</div><p className="mt-2 flex items-center gap-2 rounded-xl bg-teal-50 px-3 py-2.5 text-xs text-teal-900"><Info aria-hidden="true" className="h-4 w-4 shrink-0" />{PRICING_MODE_HELP[form.pricingMode]}</p></fieldset>

      {form.pricingMode === 'fixed_price' && <label className="block text-sm font-semibold text-slate-800">Precio final<input inputMode="numeric" value={formatClpInput(form.priceClp)} onChange={(event) => update('priceClp', digits(event.target.value))} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal" placeholder="Ej: 12000" />{errors.priceClp && <span className="text-xs text-red-600">{errors.priceClp}</span>}</label>}
      {form.pricingMode === 'quote' && <label className="block text-sm font-semibold text-slate-800">Precio desde (opcional)<input inputMode="numeric" value={formatClpInput(form.startingPriceClp)} onChange={(event) => update('startingPriceClp', digits(event.target.value))} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal" placeholder="Ej: 12000" />{errors.startingPriceClp && <span className="text-xs text-red-600">{errors.startingPriceClp}</span>}</label>}

      <section className={`overflow-hidden rounded-2xl border bg-white ${descriptionComplete ? 'border-emerald-200' : 'border-amber-200'}`}><button type="button" aria-expanded={optionalSections.description} onClick={() => setOptionalSections((current) => toggleOptionalCatalogSection(current, 'description'))} className="flex min-h-[72px] w-full items-center gap-3 p-3 text-left"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${descriptionComplete ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}><FileText aria-hidden="true" className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-900">{descriptionComplete ? 'Descripción' : 'Agregar descripción'}</span><span className={`mt-0.5 block text-xs ${descriptionComplete ? 'text-emerald-700' : 'text-amber-700'}`}>{descriptionComplete ? 'Completada' : 'Obligatoria · Pendiente'}</span></span><ChevronRight aria-hidden="true" className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${optionalSections.description ? 'rotate-90' : ''}`} /></button>{optionalSections.description && <label className="block border-t border-slate-100 px-3 pb-3 pt-3 text-sm font-semibold text-slate-700">Descripción (obligatoria)<textarea maxLength={500} rows={4} value={form.description} onChange={(event) => update('description', event.target.value)} className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal outline-none focus:border-teal-500" /><span className="mt-1 flex justify-between text-xs font-normal"><span className="text-red-600">{errors.description}</span><span className="text-slate-400">{form.description.length}/500</span></span></label>}</section>

      <section className={`overflow-hidden rounded-2xl border bg-white ${imageComplete ? 'border-emerald-200' : 'border-amber-200'}`}><button type="button" aria-expanded={optionalSections.image} onClick={() => setOptionalSections((current) => toggleOptionalCatalogSection(current, 'image'))} className="flex min-h-[72px] w-full items-center gap-3 p-3 text-left">{imageComplete ? <img src={form.imageUrl} alt="Miniatura del artículo" className="h-11 w-11 shrink-0 rounded-xl object-cover" /> : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600"><ImageIcon aria-hidden="true" className="h-5 w-5" /></span>}<span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-900">{imageComplete ? 'Imagen' : 'Agregar imagen'}</span><span className={`mt-0.5 block text-xs ${imageComplete ? 'text-emerald-700' : 'text-amber-700'}`}>{imageComplete ? 'Completada' : 'Obligatoria · Pendiente'}</span></span><ChevronRight aria-hidden="true" className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${optionalSections.image ? 'rotate-90' : ''}`} /></button>{optionalSections.image && <div className="border-t border-slate-100 px-3 pb-3 pt-3"><label className="flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-dashed border-teal-300 bg-teal-50 p-3 text-center text-sm font-semibold text-teal-700">{isUploading ? 'Subiendo imagen...' : form.imageUrl ? 'Cambiar imagen' : 'Subir imagen'}<input type="file" accept="image/*" className="hidden" disabled={isUploading || isSaving} onChange={(event) => { void uploadImage(event); }} /></label>{form.imageUrl && <p className="mt-2 text-xs text-emerald-700">Imagen obligatoria cargada. Puedes reemplazarla.</p>}{errors.imageUrl && <p className="mt-1 text-xs text-red-600">{errors.imageUrl}</p>}</div>}</section>
    </div>

    <footer className="shrink-0 border-t border-slate-200 bg-white px-4 pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.06)]" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}><div className="grid grid-cols-2 gap-2"><button type="button" disabled={isSaving} onClick={onCancel} className="min-h-11 rounded-xl bg-slate-100 px-3 font-semibold text-slate-700 disabled:opacity-50">Cancelar</button><button type="button" disabled={isSaving || isUploading} onClick={() => { void submit(); }} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 px-3 font-semibold text-white disabled:opacity-50"><span>{isSaving ? 'Guardando...' : item ? 'Guardar cambios' : 'Agregar al catálogo'}</span>{!isSaving && <ArrowRight aria-hidden="true" className="h-5 w-5" />}</button></div></footer>
  </div>;
}

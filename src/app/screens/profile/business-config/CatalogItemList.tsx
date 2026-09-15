import React from 'react';
import type { CatalogItem } from './types';

const priceLabel = (item: CatalogItem) => {
  if (item.pricingMode === 'view') return 'Solo informacion';
  if (item.pricingMode === 'quote') return item.startingPriceClp === null
    ? 'Precio a cotizar'
    : `Desde $${item.startingPriceClp.toLocaleString('es-CL')}`;
  return `$${item.priceClp?.toLocaleString('es-CL')}`;
};

type Props = {
  items: CatalogItem[];
  changingStatusId: number | null;
  isReordering: boolean;
  onEdit: (item: CatalogItem) => void;
  onSetActive: (item: CatalogItem) => void;
  onMove: (itemId: number, direction: -1 | 1) => void;
};

export default function CatalogItemList({ items, changingStatusId, isReordering, onEdit, onSetActive, onMove }: Props) {
  const isChangingStatus = changingStatusId !== null;

  return <div className="space-y-3">{items.map((item, index) => {
    const isCurrentStatusChange = changingStatusId === item.id;
    return <article key={item.id} className={`relative rounded-2xl border bg-white p-3 ${item.isActive ? 'border-gray-100' : 'border-gray-200 opacity-65'}`}>
      <div className="flex gap-3 pr-[104px]">
        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded-xl object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-xs text-gray-400">Sin foto</div>}
        <div className="min-w-0 flex-1">
          <div className="min-w-0"><p className="text-xs font-semibold uppercase text-teal-700">{item.kind === 'product' ? 'Producto' : 'Servicio'}</p><h5 className="truncate text-sm font-bold">{item.name}</h5></div>
          <p className="mt-1 text-xs font-semibold text-gray-700">{priceLabel(item)}</p>
        </div>
      </div>
      <div className="absolute right-3 top-3 flex min-h-11 max-w-[104px] items-center gap-1">
        <span className={`min-w-0 text-[11px] font-semibold ${item.isActive ? 'text-green-700' : 'text-gray-600'}`}>{isCurrentStatusChange ? 'Guardando...' : item.isActive ? 'Activo' : 'Inactivo'}</span>
        <button type="button" role="switch" aria-checked={item.isActive} aria-label={`${item.isActive ? 'Desactivar' : 'Activar'} ${item.name}`} disabled={isChangingStatus} onClick={() => onSetActive(item)} className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full disabled:cursor-wait disabled:opacity-50">
          <span className={`relative h-6 w-10 rounded-full transition-colors ${item.isActive ? 'bg-teal-500' : 'bg-gray-300'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${item.isActive ? 'translate-x-5' : 'translate-x-1'}`} /></span>
        </button>
      </div>
      <div className="mt-2 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-2">
        <button type="button" onClick={() => onEdit(item)} className="flex min-h-11 items-center justify-center rounded-full border border-teal-100 bg-teal-50 px-4 text-xs font-semibold text-teal-700 shadow-sm shadow-teal-100/70 transition-transform active:scale-95">Editar</button>
        <button type="button" aria-label={`Subir ${item.name}`} disabled={index === 0 || isReordering} onClick={() => onMove(item.id, -1)} className="flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition-transform active:scale-95 disabled:shadow-none disabled:opacity-40">Subir</button>
        <button type="button" aria-label={`Bajar ${item.name}`} disabled={index === items.length - 1 || isReordering} onClick={() => onMove(item.id, 1)} className="flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition-transform active:scale-95 disabled:shadow-none disabled:opacity-40">Bajar</button>
      </div>
    </article>;
  })}</div>;
}

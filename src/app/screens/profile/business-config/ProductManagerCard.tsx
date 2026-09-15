import { useState } from 'react';
import { showAppToast } from '../../Toast';
import CatalogItemForm from './CatalogItemForm';
import CatalogItemList from './CatalogItemList';
import { moveCatalogItemIds } from './catalogManagerState';
import type { CatalogManager } from './useCatalogManager';
import type { CatalogItem, CatalogItemWritePayload } from './types';

type Props = { catalog: CatalogManager };

export default function ProductManagerCard({ catalog }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const closeForm = () => { setEditingItem(null); setIsFormOpen(false); };
  const reportError = (error: unknown) => showAppToast(error instanceof Error ? error.message : 'No se pudo actualizar el catalogo.', 'error');

  const save = async (payload: CatalogItemWritePayload) => {
    try {
      const result = editingItem ? await catalog.update(editingItem.id, payload) : await catalog.create(payload);
      if (!result) return;
      showAppToast(editingItem ? 'Articulo actualizado.' : 'Articulo agregado al catalogo.', 'success');
      closeForm();
    } catch (error) { reportError(error); }
  };

  const changeStatus = async (item: CatalogItem) => {
    try {
      const result = await catalog.setActive(item.id, !item.isActive);
      if (!result) return;
      showAppToast(result.isActive ? 'El articulo vuelve a aparecer en el catalogo publico.' : 'El articulo ya no aparece en el catalogo publico.', 'success');
    } catch (error) { reportError(error); }
  };

  const move = async (itemId: number, direction: -1 | 1) => {
    const ids = moveCatalogItemIds(catalog.items, itemId, direction);
    if (!ids) return;
    try {
      if (await catalog.reorder(ids)) showAppToast('Orden del catalogo actualizado.', 'success');
    } catch (error) { reportError(error); }
  };

  if (isFormOpen) {
    return <CatalogItemForm key={editingItem?.id ?? 'new'} item={editingItem} isSaving={catalog.isSavingItem} onCancel={closeForm} onSubmit={save} onError={(message) => showAppToast(message, 'error')} />;
  }

  return (
    <section className="mb-2 rounded-2xl border border-white/50 bg-white/80 p-5 shadow-md">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div><h4 className="font-bold text-gray-900">Mi catalogo</h4><p className="text-xs text-gray-500">Administra productos y servicios.</p></div>
        <button type="button" onClick={() => { setEditingItem(null); setIsFormOpen(true); }} className="min-h-11 shrink-0 rounded-full bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700">
          + Agregar articulo
        </button>
      </div>
      {catalog.isLoading && <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">Cargando catalogo...</p>}
      {catalog.loadError && <div className="rounded-xl bg-red-50 p-4"><p className="text-sm text-red-700">{catalog.loadError}</p><button type="button" onClick={() => { void catalog.load(); }} className="mt-2 text-sm font-semibold text-teal-700">Intentar nuevamente</button></div>}
      {!catalog.isLoading && !catalog.loadError && catalog.items.length === 0 && <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">Tu catalogo esta vacio. Agrega tu primer producto o servicio.</p>}
      {!catalog.isLoading && !catalog.loadError && catalog.items.length > 0 && <CatalogItemList items={catalog.items} changingStatusId={catalog.changingStatusId} isReordering={catalog.isReordering} onEdit={(item) => { setEditingItem(item); setIsFormOpen(true); }} onSetActive={(item) => { void changeStatus(item); }} onMove={(id, direction) => { void move(id, direction); }} />}
    </section>
  );
}

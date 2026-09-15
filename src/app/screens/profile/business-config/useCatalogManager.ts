import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createCatalogItem,
  getManagedCatalog,
  reorderCatalogItems,
  setCatalogItemActive,
  updateCatalogItem
} from './catalogApi';
import { appendCatalogItem, createCatalogOperationRunner, replaceCatalogItem } from './catalogManagerState';
import type { CatalogItem, CatalogItemWritePayload } from './types';

export default function useCatalogManager(businessId: number | null, token: string | null) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [changingStatusId, setChangingStatusId] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const operations = useRef(createCatalogOperationRunner());

  const load = useCallback(async () => {
    if (businessId === null || !token) {
      setItems([]);
      setLoadError('No se pudo identificar el negocio o la sesion.');
      return false;
    }
    setIsLoading(true);
    setLoadError('');
    try {
      const loaded = await getManagedCatalog(businessId, token);
      setItems(loaded);
      return true;
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo cargar el catalogo.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [businessId, token]);

  useEffect(() => { void load(); }, [load]);

  const create = useCallback(async (payload: CatalogItemWritePayload) => {
    if (businessId === null || !token) throw new Error('No se pudo identificar el negocio o la sesion.');
    if (operations.current.isActive('save')) return null;
    setIsSavingItem(true);
    try {
      const created = await operations.current.run('save', () => createCatalogItem(businessId, token, payload));
      if (created) setItems((current) => appendCatalogItem(current, created));
      return created;
    } finally { setIsSavingItem(false); }
  }, [businessId, token]);

  const update = useCallback(async (itemId: number, payload: CatalogItemWritePayload) => {
    if (businessId === null || !token) throw new Error('No se pudo identificar el negocio o la sesion.');
    if (operations.current.isActive('save')) return null;
    setIsSavingItem(true);
    try {
      const updated = await operations.current.run('save', () => updateCatalogItem(businessId, itemId, token, payload));
      if (updated) setItems((current) => replaceCatalogItem(current, updated));
      return updated;
    } finally { setIsSavingItem(false); }
  }, [businessId, token]);

  const setActive = useCallback(async (itemId: number, isActive: boolean) => {
    if (businessId === null || !token) throw new Error('No se pudo identificar el negocio o la sesion.');
    if (operations.current.isActive('status')) return null;
    setChangingStatusId(itemId);
    try {
      const updated = await operations.current.run('status', () => setCatalogItemActive(businessId, itemId, token, isActive));
      if (updated) setItems((current) => replaceCatalogItem(current, updated));
      return updated;
    } finally { setChangingStatusId(null); }
  }, [businessId, token]);

  const reorder = useCallback(async (itemIds: number[]) => {
    if (businessId === null || !token) throw new Error('No se pudo identificar el negocio o la sesion.');
    if (operations.current.isActive('reorder')) return null;
    setIsReordering(true);
    try {
      const reordered = await operations.current.run('reorder', () => reorderCatalogItems(businessId, token, itemIds));
      if (reordered) setItems(reordered);
      return reordered;
    } finally { setIsReordering(false); }
  }, [businessId, token]);

  return {
    items, isLoading, loadError, isSavingItem, changingStatusId, isReordering,
    load, create, update, setActive, reorder
  };
}

export type CatalogManager = ReturnType<typeof useCatalogManager>;

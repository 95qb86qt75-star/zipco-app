import { API_BASE_URL } from '../../../api/apiConfig';
import { normalizeCatalogItem, normalizeCatalogItems } from './catalogValidation';
import type { CatalogItem, CatalogItemWritePayload } from './types';

export class CatalogApiError extends Error {
  constructor(message: string, readonly status: number | null) {
    super(message);
    this.name = 'CatalogApiError';
  }
}

const ERROR_MESSAGES: Record<number, string> = {
  400: 'Revisa los datos del articulo.',
  401: 'Tu sesion vencio. Ingresa nuevamente.',
  403: 'No tienes permiso para administrar este catalogo.',
  404: 'No se encontro el negocio o articulo.'
};

async function requestJson(
  path: string,
  options: RequestInit = {},
  fetchImpl: typeof fetch = fetch
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetchImpl(`${API_BASE_URL}${path}`, options);
  } catch {
    throw new CatalogApiError('No se pudo conectar. Intenta nuevamente.', null);
  }
  if (!response.ok) {
    throw new CatalogApiError(ERROR_MESSAGES[response.status] ?? 'No se pudo actualizar el catalogo.', response.status);
  }
  try {
    return await response.json();
  } catch {
    throw new CatalogApiError('La respuesta del catalogo no tiene un formato valido.', response.status);
  }
}

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
});

function ensureBusiness(item: CatalogItem, businessId: number): CatalogItem {
  if (item.businessId !== businessId) throw new CatalogApiError('La respuesta del catalogo no tiene un formato valido.', null);
  return item;
}

function ensureBusinessItems(items: CatalogItem[], businessId: number): CatalogItem[] {
  if (items.some((item) => item.businessId !== businessId)) {
    throw new CatalogApiError('La respuesta del catalogo no tiene un formato valido.', null);
  }
  return items;
}

export async function getPublicCatalog(businessId: number, fetchImpl?: typeof fetch): Promise<CatalogItem[]> {
  return ensureBusinessItems(normalizeCatalogItems(await requestJson(`/businesses/${businessId}/catalog-items`, {}, fetchImpl)), businessId);
}

export async function getManagedCatalog(businessId: number, token: string, fetchImpl?: typeof fetch): Promise<CatalogItem[]> {
  return ensureBusinessItems(normalizeCatalogItems(await requestJson(`/businesses/${businessId}/catalog-items/manage`, {
    headers: authHeaders(token)
  }, fetchImpl)), businessId);
}

export async function createCatalogItem(businessId: number, token: string, payload: CatalogItemWritePayload, fetchImpl?: typeof fetch): Promise<CatalogItem> {
  return ensureBusiness(normalizeCatalogItem(await requestJson(`/businesses/${businessId}/catalog-items`, {
    method: 'POST', headers: authHeaders(token), body: JSON.stringify(payload)
  }, fetchImpl)), businessId);
}

export async function updateCatalogItem(businessId: number, itemId: number, token: string, payload: CatalogItemWritePayload, fetchImpl?: typeof fetch): Promise<CatalogItem> {
  return ensureBusiness(normalizeCatalogItem(await requestJson(`/businesses/${businessId}/catalog-items/${itemId}`, {
    method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(payload)
  }, fetchImpl)), businessId);
}

export async function setCatalogItemActive(businessId: number, itemId: number, token: string, isActive: boolean, fetchImpl?: typeof fetch): Promise<CatalogItem> {
  return ensureBusiness(normalizeCatalogItem(await requestJson(`/businesses/${businessId}/catalog-items/${itemId}/status`, {
    method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ isActive })
  }, fetchImpl)), businessId);
}

export async function reorderCatalogItems(businessId: number, token: string, itemIds: number[], fetchImpl?: typeof fetch): Promise<CatalogItem[]> {
  return ensureBusinessItems(normalizeCatalogItems(await requestJson(`/businesses/${businessId}/catalog-items/order`, {
    method: 'PUT', headers: authHeaders(token), body: JSON.stringify({ itemIds })
  }, fetchImpl)), businessId);
}

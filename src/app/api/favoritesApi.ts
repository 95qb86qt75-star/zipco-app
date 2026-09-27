import { API_BASE_URL } from './apiConfig';

export type FavoriteRecord = { id: number; businessId: number; kind: 'business' | 'service'; business: any };

async function call(path: string, token: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init?.body ? { 'Content-Type': 'application/json' } : {}) } });
  if (!response.ok) throw Object.assign(new Error('No se pudo actualizar Favoritos.'), { status: response.status });
  return response.json();
}

export const loadFavorites = (token: string): Promise<FavoriteRecord[]> => call('/favorites', token);
export const addFavorite = (businessId: number, kind: 'business' | 'service', token: string) => call('/favorites', token, { method: 'POST', body: JSON.stringify({ businessId, kind }) });
export const removeFavorite = (businessId: number, token: string) => call(`/favorites/${businessId}`, token, { method: 'DELETE' });

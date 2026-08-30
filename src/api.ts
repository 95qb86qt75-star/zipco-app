import axios from 'axios';

const API_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Agregar el token automaticamente a cada solicitud
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('zipco_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// NEGOCIOS
export const getBusinesses = () =>
  api.get('/businesses');

export const createBusiness = (data: any) =>
  api.post('/businesses', data);

export const getNearbyBusinesses = (lat: number, lng: number, radius: number, categoryId?: number, search?: string) =>
  api.get('/businesses/nearby', { params: { lat, lng, radius, categoryId, search } });

export const getPendingBusinesses = () =>
  api.get('/businesses/pending');

export const approveBusiness = (id: number) =>
  api.patch(`/businesses/${id}/approve`);

export const rejectBusiness = (id: number) =>
  api.patch(`/businesses/${id}/reject`);

// CATEGORIAS
export const getCategories = () =>
  api.get('/categories');

// USUARIOS
export const getUser = (id: number) =>
  api.get(`/users/${id}`);

export const updateUser = (id: number, data: any) =>
  api.patch(`/users/${id}`, data);

export default api;

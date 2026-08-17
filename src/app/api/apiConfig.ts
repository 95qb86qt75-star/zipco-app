const PRODUCTION_API_URL =
  'https://zipco-backend-production.up.railway.app';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_BASE_URL = (
  configuredApiUrl || PRODUCTION_API_URL
).replace(/\/+$/, '');

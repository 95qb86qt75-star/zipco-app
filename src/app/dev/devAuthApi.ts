import { isDevAccount, type DevAccount, type DevAuthConfig } from './devAuthConfig';

export type DevAuthSessionResponse = {
  access_token: string;
  user: { id: number; name: string; email: string; role: 'user' | 'admin' };
  businessId: number | null;
};

export class DevAuthError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'DevAuthError';
    this.status = status;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasExactKeys = (value: Record<string, unknown>, keys: string[]) =>
  Object.keys(value).sort().join('|') === [...keys].sort().join('|');

const isNonEmptyUnpaddedString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value === value.trim();

export function parseDevAuthSession(value: unknown): DevAuthSessionResponse | null {
  if (!isRecord(value) || !hasExactKeys(value, ['access_token', 'user', 'businessId'])) return null;
  if (!isNonEmptyUnpaddedString(value.access_token) || !isRecord(value.user)) return null;
  if (!hasExactKeys(value.user, ['id', 'name', 'email', 'role'])) return null;
  const { id, name, email, role } = value.user;
  const validUser = typeof id === 'number' && Number.isSafeInteger(id) && id > 0
    && isNonEmptyUnpaddedString(name)
    && isNonEmptyUnpaddedString(email)
    && (role === 'user' || role === 'admin');
  const validBusinessId = value.businessId === null
    || (typeof value.businessId === 'number' && Number.isSafeInteger(value.businessId) && value.businessId > 0);
  return validUser && validBusinessId ? value as DevAuthSessionResponse : null;
}

function errorMessage(status: number): string {
  if (status === 400) return 'La cuenta de desarrollo no es válida.';
  if (status === 401) return 'La clave local de desarrollo fue rechazada.';
  if (status === 404) return 'El acceso de desarrollo no está disponible.';
  return 'No se pudo iniciar la sesión local.';
}

export async function requestDevSession(
  config: DevAuthConfig,
  account: DevAccount
): Promise<DevAuthSessionResponse> {
  if (config.state !== 'enabled' || !isDevAccount(account)) {
    throw new DevAuthError('El acceso de desarrollo no está habilitado.', 0);
  }

  let response: Response;
  try {
    response = await fetch(`${config.apiOrigin}/dev/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Dev-Auth-Key': config.key },
      body: JSON.stringify({ account })
    });
  } catch {
    throw new DevAuthError('No se pudo conectar con el backend local.', 0);
  }
  if (!response.ok) throw new DevAuthError(errorMessage(response.status), response.status);

  let data: unknown;
  try { data = await response.json(); } catch { data = null; }
  const parsed = parseDevAuthSession(data);
  if (!parsed) throw new DevAuthError('El backend local devolvió una respuesta inválida.', response.status);
  return parsed;
}

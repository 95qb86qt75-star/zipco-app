import { API_BASE_URL } from './apiConfig';

const AUTH_API_URL = `${API_BASE_URL}/auth`;

export type RequestCodeResponse = {
  message: string;
};

export type AuthenticatedResponse = {
  access_token: string;
  user: {
    id: number;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
};

export type RegistrationRequiredResponse = {
  needsRegistration: true;
};

export type VerifyCodeResponse =
  | AuthenticatedResponse
  | RegistrationRequiredResponse;

export class AuthSmsError extends Error {
  readonly status: number;
  readonly retryAfterSeconds: number | null;

  constructor(message: string, status: number, retryAfterSeconds: number | null = null) {
    super(message);
    this.name = 'AuthSmsError';
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isOptionalNullableString = (value: unknown) =>
  value === undefined || value === null || typeof value === 'string';

export const isRequestCodeResponse = (value: unknown): value is RequestCodeResponse =>
  isRecord(value) && typeof value.message === 'string';

export const isAuthenticatedResponse = (value: unknown): value is AuthenticatedResponse => {
  if (!isRecord(value) || typeof value.access_token !== 'string' || !isRecord(value.user)) {
    return false;
  }

  return (
    typeof value.user.id === 'number' &&
    isOptionalNullableString(value.user.name) &&
    isOptionalNullableString(value.user.email) &&
    isOptionalNullableString(value.user.role)
  );
};

export const isRegistrationRequiredResponse = (
  value: unknown
): value is RegistrationRequiredResponse =>
  isRecord(value) && value.needsRegistration === true;

const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const getRetryAfterSeconds = (response: Response): number | null => {
  const retryAfter = response.headers.get('Retry-After');
  if (!retryAfter) return null;

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.ceil(seconds);
  }

  const retryDate = Date.parse(retryAfter);
  if (Number.isNaN(retryDate)) return null;

  return Math.max(0, Math.ceil((retryDate - Date.now()) / 1000));
};

const getDefaultErrorMessage = (status: number) => {
  if (status === 429) return 'Has solicitado demasiados códigos. Intenta nuevamente más tarde.';
  if (status >= 500) return 'El servicio no está disponible en este momento. Intenta nuevamente.';
  return 'No pudimos completar la solicitud. Intenta nuevamente.';
};

const postAuth = async (path: string, body: Record<string, string>) => {
  let response: Response;

  try {
    response = await fetch(`${AUTH_API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch {
    throw new AuthSmsError('No pudimos conectar con el servidor. Revisa tu conexión.', 0);
  }

  const data = await readJson(response);

  if (!response.ok) {
    const message =
      isRecord(data) && typeof data.message === 'string'
        ? data.message
        : getDefaultErrorMessage(response.status);

    throw new AuthSmsError(message, response.status, getRetryAfterSeconds(response));
  }

  return { data, status: response.status };
};

export const requestSmsCode = async (phone: string): Promise<RequestCodeResponse> => {
  const { data, status } = await postAuth('/request-code', { phone });

  if (!isRequestCodeResponse(data)) {
    throw new AuthSmsError('El servidor devolvió una respuesta inesperada.', status);
  }

  return data;
};

export const verifySmsCode = async (
  phone: string,
  code: string
): Promise<VerifyCodeResponse> => {
  const { data, status } = await postAuth('/verify-code', { phone, code });

  if (isAuthenticatedResponse(data) || isRegistrationRequiredResponse(data)) {
    return data;
  }

  throw new AuthSmsError('El servidor devolvió una respuesta inesperada.', status);
};

export const completeSmsRegistration = async (
  phone: string,
  code: string,
  name: string
): Promise<AuthenticatedResponse> => {
  const { data, status } = await postAuth('/complete-registration', { phone, code, name });

  if (!isAuthenticatedResponse(data)) {
    throw new AuthSmsError('El servidor devolvió una respuesta inesperada.', status);
  }

  return data;
};

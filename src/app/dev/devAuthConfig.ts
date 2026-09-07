export const DEV_ACCOUNT_OPTIONS = [
  { account: 'customer', label: 'Cliente de prueba' },
  { account: 'business-owner', label: 'Dueño de negocio' },
  { account: 'unrelated-user', label: 'Usuario sin relación' },
  { account: 'admin', label: 'Administrador' }
] as const;

export type DevAccount = (typeof DEV_ACCOUNT_OPTIONS)[number]['account'];

type DevAuthEnvironment = {
  isDev: boolean;
  enabled: string | undefined;
  apiUrl: string | undefined;
  key: string | undefined;
};

export type DevAuthConfig =
  | { state: 'disabled' }
  | { state: 'misconfigured' }
  | { state: 'enabled'; apiOrigin: string; key: string };

const LOCAL_API_ORIGINS = new Set([
  'http://127.0.0.1:3000',
  'http://localhost:3000'
]);

export function resolveDevAuthConfig(environment: DevAuthEnvironment): DevAuthConfig {
  if (!environment.isDev || environment.enabled !== 'true') return { state: 'disabled' };
  if (!environment.apiUrl || !environment.key || environment.key !== environment.key.trim()) {
    return { state: 'misconfigured' };
  }

  try {
    const url = new URL(environment.apiUrl);
    const hasUnexpectedParts = url.username !== '' || url.password !== ''
      || (url.pathname !== '' && url.pathname !== '/') || url.search !== '' || url.hash !== '';
    if (hasUnexpectedParts || !LOCAL_API_ORIGINS.has(url.origin)) return { state: 'misconfigured' };
    return { state: 'enabled', apiOrigin: url.origin, key: environment.key };
  } catch {
    return { state: 'misconfigured' };
  }
}

export function isDevAccount(value: unknown): value is DevAccount {
  return typeof value === 'string'
    && DEV_ACCOUNT_OPTIONS.some((option) => option.account === value);
}

import { isIPv4 } from 'node:net';

export const LOCAL_QA_BACKEND = 'https://zipco-backend-qa.up.railway.app';
export const LOCAL_QA_PORT = 5173;

export function isPrivateLanAddress(address) {
  if (!isIPv4(address)) return false;
  const [first, second] = address.split('.').map(Number);
  return first === 10 || (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168);
}

export function selectLanAddress(interfaces, requested) {
  const candidates = Object.entries(interfaces).flatMap(([name, entries]) =>
    (entries || []).filter((entry) => !entry.internal && entry.family === 'IPv4' && isPrivateLanAddress(entry.address))
      .map((entry) => ({ name, address: entry.address })));
  if (requested) {
    if (!candidates.some((entry) => entry.address === requested)) {
      throw new Error('La dirección solicitada no pertenece a una interfaz LAN privada de este computador.');
    }
    return requested;
  }
  const selected = candidates.find((entry) => /wi-?fi|wireless|wlan/i.test(entry.name)) || candidates[0];
  if (!selected) throw new Error('Conecta el computador al Wi-Fi: no se encontró una dirección LAN privada.');
  return selected.address;
}

export function localQaOverrides(environment = process.env) {
  if (environment.VERCEL || environment.CI) {
    throw new Error('Vista local es exclusiva del computador, no de Vercel ni CI.');
  }
  // Only public configuration is returned. These override .env files and shell
  // values inside this process, so no production backend fallback is possible.
  return {
    NODE_ENV: 'production',
    VITE_API_URL: LOCAL_QA_BACKEND,
    VITE_ENABLE_QA_AUTH: 'true',
    VITE_ENABLE_DEV_AUTH: 'false',
    VITE_DEV_AUTH_KEY: '',
    ZIPCO_QA_LOAD_DIAGNOSTICS: '0',
  };
}

export async function checkLocalQaCors(origin, fetchImpl = fetch) {
  try {
    const response = await fetchImpl(`${LOCAL_QA_BACKEND}/qa/auth/session`, {
      method: 'OPTIONS',
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization,content-type,x-qa-auth-key',
      },
      signal: AbortSignal.timeout(8000),
    });
    return { reachable: true, httpStatus: response.status,
      originAllowed: response.ok && response.headers.get('access-control-allow-origin') === origin };
  } catch {
    return { reachable: false, httpStatus: null, originAllowed: false };
  }
}

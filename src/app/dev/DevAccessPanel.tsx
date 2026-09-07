import { useMemo, useState } from 'react';
import { requestDevSession } from './devAuthApi';
import { DEV_ACCOUNT_OPTIONS, resolveDevAuthConfig, type DevAccount } from './devAuthConfig';
import { persistDevSession } from './devSessionStorage';
import DevUnavailableOrderPreview from './DevUnavailableOrderPreview';

export default function DevAccessPanel({ onAuthenticated }: { onAuthenticated: () => void }) {
  const config = useMemo(() => resolveDevAuthConfig({
    isDev: import.meta.env.DEV,
    enabled: import.meta.env.VITE_ENABLE_DEV_AUTH,
    apiUrl: import.meta.env.VITE_API_URL,
    key: import.meta.env.VITE_DEV_AUTH_KEY
  }), []);
  const [pendingAccount, setPendingAccount] = useState<DevAccount | null>(null);
  const [error, setError] = useState('');
  const [showInvalidPreview, setShowInvalidPreview] = useState(false);

  if (config.state === 'disabled') return null;
  if (config.state === 'misconfigured') {
    return <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">Configuración local de desarrollo inválida.</p>;
  }

  const authenticate = async (account: DevAccount) => {
    if (pendingAccount) return;
    setPendingAccount(account);
    setError('');
    try {
      const session = await requestDevSession(config, account);
      persistDevSession(localStorage, session);
      onAuthenticated();
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'No se pudo iniciar la sesión local.');
    } finally {
      setPendingAccount(null);
    }
  };

  return (
    <section className="mt-5 border-t border-dashed border-amber-300 pt-4">
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Acceso de desarrollo</p>
        <p className="mt-1 text-xs text-amber-800">Solo para el laboratorio local de ZIPCO.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {DEV_ACCOUNT_OPTIONS.map((option) => (
            <button
              key={option.account}
              type="button"
              disabled={pendingAccount !== null}
              onClick={() => { void authenticate(option.account); }}
              className="rounded-xl border border-amber-300 bg-white px-2 py-2 text-xs font-semibold text-gray-800 disabled:opacity-50"
            >
              {pendingAccount === option.account ? 'Ingresando...' : option.label}
            </button>
          ))}
        </div>
        {error && <p role="alert" className="mt-3 text-xs font-semibold text-red-700">{error}</p>}
        <button
          type="button"
          onClick={() => setShowInvalidPreview((current) => !current)}
          className="mt-3 text-xs font-semibold text-amber-800 underline"
        >
          {showInvalidPreview ? 'Ocultar vista de estado inválido' : 'Revisar Estado no disponible'}
        </button>
      </div>
      {showInvalidPreview && <DevUnavailableOrderPreview />}
    </section>
  );
}

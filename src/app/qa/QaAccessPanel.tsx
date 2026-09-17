import { useMemo, useState } from "react";
import { persistDevSession } from "../dev/devSessionStorage";
import { requestQaSession } from "./qaAuthApi";
import {
  QA_ACCOUNT_OPTIONS,
  resolveQaAuthConfig,
  type QaAccount,
} from "./qaAuthConfig";

export default function QaAccessPanel({
  onAuthenticated,
}: {
  onAuthenticated: () => void;
}) {
  const config = useMemo(
    () =>
      resolveQaAuthConfig({
        isProd: import.meta.env.PROD,
        enabled: import.meta.env.VITE_ENABLE_QA_AUTH,
        apiUrl: import.meta.env.VITE_API_URL,
      }),
    [],
  );
  const [key, setKey] = useState("");
  const [pendingAccount, setPendingAccount] = useState<QaAccount | null>(null);
  const [error, setError] = useState("");

  if (config.state === "disabled") return null;
  if (config.state === "misconfigured") {
    return (
      <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
        Configuración QA inválida.
      </p>
    );
  }

  const authenticate = async (account: QaAccount) => {
    if (pendingAccount) return;
    setPendingAccount(account);
    setError("");
    try {
      const session = await requestQaSession(config, account, key);
      persistDevSession(localStorage, session);
      setKey("");
      onAuthenticated();
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "No se pudo iniciar la sesión QA.",
      );
    } finally {
      setPendingAccount(null);
    }
  };

  return (
    <section className="mt-5 border-t border-dashed border-violet-300 pt-4">
      <div className="rounded-2xl border border-violet-300 bg-violet-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
          Acceso QA
        </p>
        <p className="mt-1 text-xs text-violet-800">
          Solo para pruebas autorizadas. No envía SMS.
        </p>
        <label
          className="mt-3 block text-xs font-semibold text-gray-700"
          htmlFor="qa-access-key"
        >
          Clave QA
        </label>
        <input
          id="qa-access-key"
          type="password"
          autoComplete="off"
          value={key}
          onChange={(event) => {
            setKey(event.target.value);
            setError("");
          }}
          className="mt-1 h-11 w-full rounded-xl border border-violet-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-violet-400"
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          {QA_ACCOUNT_OPTIONS.map((option) => (
            <button
              key={option.account}
              type="button"
              disabled={pendingAccount !== null || key.length === 0}
              onClick={() => {
                void authenticate(option.account);
              }}
              className="min-h-11 rounded-xl border border-violet-300 bg-white px-2 py-2 text-xs font-semibold text-gray-800 disabled:opacity-50"
            >
              {pendingAccount === option.account
                ? "Ingresando..."
                : option.label}
            </button>
          ))}
        </div>
        {error && (
          <p role="alert" className="mt-3 text-xs font-semibold text-red-700">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

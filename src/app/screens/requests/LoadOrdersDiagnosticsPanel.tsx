import { useState, useSyncExternalStore } from 'react';
import { clearDiagnostics, diagnosticSnapshot, diagnosticText, subscribeDiagnostics } from './loadOrdersDiagnostics';
import { checkNotificationWorkerVersion } from '../../notifications/notificationWorkerVersion';
import QaNotificationClickTracePanel from '../../notifications/QaNotificationClickTracePanel';

export default function LoadOrdersDiagnostics({ refresh }: { refresh: () => unknown }) {
  const entries = useSyncExternalStore(subscribeDiagnostics, diagnosticSnapshot, diagnosticSnapshot);
  const [copyStatus, setCopyStatus] = useState('');
  const [workerVersion, setWorkerVersion] = useState('Sin comprobar.');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(diagnosticText());
      setCopyStatus('Diagnóstico copiado.');
    } catch { setCopyStatus('No se pudo copiar. Selecciona el texto del diagnóstico para copiarlo.'); }
  };
  return <details className="m-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-slate-900">
    <summary className="min-h-11 cursor-pointer font-bold">Diagnóstico temporal QA — Solicitudes ({entries.length})</summary>
    <p className="break-all">Versión frontend: {import.meta.env.QA_LOAD_DIAGNOSTICS_VERSION}</p>
    <p>Worker controlador: {workerVersion}</p>
    <button type="button" className="min-h-11 rounded border px-3" onClick={() => {
      void checkNotificationWorkerVersion().then(setWorkerVersion);
    }}>Comprobar versión del worker</button>
    {import.meta.env.QA_NOTIFICATION_TRACE && <QaNotificationClickTracePanel />}
    <p>Solo fallos de lectura; últimos 20 registros en memoria. Actualizar no repite acciones del pedido.</p>
    <div className="my-2 flex flex-wrap gap-2">
      <button type="button" className="min-h-11 rounded border px-3" onClick={() => { void refresh(); }}>Actualizar Solicitudes</button>
      <button type="button" className="min-h-11 rounded border px-3" onClick={() => void copy()}>Copiar diagnóstico</button>
      <button type="button" className="min-h-11 rounded border px-3" onClick={clearDiagnostics}>Limpiar diagnóstico</button>
    </div>
    <p role="status">{copyStatus}</p>
    <textarea aria-label="Diagnóstico saneado" readOnly className="w-full rounded border bg-white p-2 font-mono" rows={8} value={JSON.stringify(entries, null, 2)} />
  </details>;
}

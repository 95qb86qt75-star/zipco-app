import { useEffect, useRef, useState } from 'react';
import QaPushObservationPanel from './QaPushObservationPanel';

export default function QaNotificationClickTracePanel() {
  const [report, setReport] = useState('');
  const [status, setStatus] = useState('');
  const [active, setActive] = useState(false);
  const details = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const refresh = () => {
      let element: HTMLElement | null = details.current;
      while (element) {
        if (element.tagName === 'DETAILS' && !(element as HTMLDetailsElement).open) { setActive(false); return; }
        element = element.parentElement;
      }
      setActive(!!details.current);
    };
    // A closed outer diagnostic also hides this nested panel.
    document.addEventListener('toggle', refresh, true);
    refresh();
    return () => document.removeEventListener('toggle', refresh, true);
  }, []);
  const read = async (copy = false) => {
    try {
      const trace = await import('./qaNotificationClickTrace');
      const text = JSON.stringify(await trace.readClickTrace(), null, 2);
      setReport(text);
      if (copy) { await navigator.clipboard.writeText(text); setStatus('Recorrido copiado.'); }
      else setStatus('Recorrido leído. No se ejecutaron acciones del pedido.');
    } catch { setStatus('No se pudo copiar o leer. Si hay texto, selecciónalo para copiarlo.'); }
  };
  return <details ref={details} className="my-3 rounded border border-amber-300 p-2">
    <summary className="min-h-11 font-bold">Recorrido del clic externo QA</summary>
    <p>Temporal QA: espera las escrituras antes de copiar y consulta los avisos pendientes de los registros de esta instalación. Los próximos banners muestran «QA» y un código aleatorio que coincide con bannerCode; no contiene datos del pedido. Un aviso ya cerrado puede desaparecer del inventario. Hasta 50 etapas por origen durante una hora.</p>
    <div className="flex flex-wrap gap-2">
      <button type="button" className="min-h-11 rounded border px-3" onClick={() => void read()}>Leer recorrido</button>
      <button type="button" className="min-h-11 rounded border px-3" onClick={() => void read(true)}>Copiar recorrido</button>
      <button type="button" className="min-h-11 rounded border px-3" onClick={() => {
        void import('./qaNotificationClickTrace').then(async (trace) => {
          const cleared = await trace.clearClickTrace(); setReport('');
          setStatus(cleared ? 'Recorrido limpiado.' : 'Limpieza no confirmada en caché o worker. Comprueba las versiones antes de probar.');
        }).catch(() => setStatus('No se pudo limpiar el recorrido.'));
      }}>Limpiar recorrido</button>
    </div>
    <p role="status">{status}</p>
    <textarea aria-label="Recorrido saneado del clic externo" readOnly className="w-full rounded border bg-white p-2 font-mono" rows={9} value={report} />
    <QaPushObservationPanel active={active}/>
  </details>;
}

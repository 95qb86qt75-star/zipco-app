import type { RequestProcessSummary } from './requestProcess';
import useAgreement, { type AgreementState } from './useAgreement';

const money = (value: number) => new Intl.NumberFormat('es-CL', {
  style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
}).format(value);

export function AgreementContent({ state, retry }: { state: AgreementState; retry: () => void }) {
  if (state.status === 'absent') return <p role="status">Las condiciones aceptadas aún no están disponibles. Actualiza el pedido.</p>;
  if (state.status === 'loading') return <p role="status">Cargando condiciones aceptadas…</p>;
  if (state.status === 'error') return <div role="alert">
    <p>{state.message}</p>
    <button type="button" className="mt-2 rounded-xl border px-3 py-2 font-bold" onClick={retry}>Reintentar</button>
  </div>;
  if (state.status !== 'loaded') return null;
  const { agreement: a } = state;
  return <div className="space-y-3">
    <p className="font-bold">{a.subjectSnapshot.orderType === 'service' ? 'Servicio' : 'Productos'}</p>
    <ul className="space-y-2">
      {a.subjectSnapshot.items.map((item, index) => <li key={`${item.catalogItemId}-${index}`}>
        <p><strong>{item.quantity} × {item.nameSnapshot}</strong></p>
        {item.descriptionSnapshot && <p>{item.descriptionSnapshot}</p>}
        <p>{money(item.unitPriceClpSnapshot)} por unidad · Subtotal {money(item.subtotalClp)}</p>
      </li>)}
    </ul>
    <p className="font-black">Total: {money(a.totalPriceClp)}</p>
    {a.scheduledFor && <p>Fecha y hora: {new Intl.DateTimeFormat('es-CL', {
      timeZone: 'America/Santiago', dateStyle: 'medium', timeStyle: 'short',
    }).format(new Date(a.scheduledFor))}</p>}
    {a.subjectSnapshot.needNow && <p>Solicitado para ahora</p>}
    {a.subjectSnapshot.note && <p className="whitespace-pre-wrap">Nota: {a.subjectSnapshot.note}</p>}
    {a.subjectSnapshot.referencePhoto && <figure>
      <figcaption>Foto de referencia</figcaption>
      <a href={a.subjectSnapshot.referencePhoto} target="_blank" rel="noreferrer" aria-label="Abrir foto de referencia">
        <img src={a.subjectSnapshot.referencePhoto} alt="Foto de referencia" className="mt-2 max-h-64 w-full rounded-xl object-contain" />
      </a>
    </figure>}
  </div>;
}

export default function AcceptedConditions({ process }: { process: RequestProcessSummary | null | undefined }) {
  const { state, retry } = useAgreement(process);
  return <section aria-label="Condiciones aceptadas" className="mt-3 space-y-3 rounded-2xl border border-teal-200 bg-white p-4 text-sm text-slate-900 dark:bg-slate-900 dark:text-slate-100">
    <h4 className="font-black">Condiciones aceptadas</h4>
    <AgreementContent state={state} retry={retry} />
  </section>;
}

import type { RequestProcessSummary } from './requestProcess';
import useAgreement, { type AgreementState } from './useAgreement';
import OrderReferencePhoto from './OrderReferencePhoto';
import { OrderPricePanel } from './OrderCardPanels';

const money = (value: number) => new Intl.NumberFormat('es-CL', {
  style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
}).format(value);

export function AgreementContent({ state, retry, business = false }: { state: AgreementState; retry: () => void; business?: boolean }) {
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
    <OrderPricePanel price={a.totalPriceClp} label="Total:" />
    {a.scheduledFor && <p>Fecha y hora: {new Intl.DateTimeFormat('es-CL', {
      timeZone: 'America/Santiago', dateStyle: 'medium', timeStyle: 'short',
    }).format(new Date(a.scheduledFor))}</p>}
    {a.subjectSnapshot.needNow && <p>Solicitado para ahora</p>}
    {a.subjectSnapshot.note && <p className="whitespace-pre-wrap">Nota: {a.subjectSnapshot.note}</p>}
    <OrderReferencePhoto src={a.subjectSnapshot.referencePhoto} business={business} />
  </div>;
}

export default function AcceptedConditions({ process, business = false, history = false }: { process: RequestProcessSummary | null | undefined; business?: boolean; history?: boolean }) {
  const { state, retry } = useAgreement(process);
  return <AcceptedConditionsPanel state={state} retry={retry} business={business} history={history} />;
}

export function AcceptedConditionsPanel({ state, retry, business = false, history = false }: { state: AgreementState; retry: () => void; business?: boolean; history?: boolean }) {
  return <section aria-label="Condiciones aceptadas" className="mt-3 space-y-3 rounded-[16px] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/70 p-3 text-sm text-slate-900 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/40 dark:text-slate-100">
    <h4 className="font-black">Condiciones aceptadas</h4>
    {state.status === 'loaded' && <a className="inline-flex min-h-11 items-center font-bold text-teal-700" href={`/solicitudes/procesos/${state.agreement.requestProcessId}/acuerdo?participant=${business ? 'business' : 'customer'}${history ? '&volver=historial' : ''}`}>Abrir acuerdo</a>}
    <AgreementContent state={state} retry={retry} business={business} />
  </section>;
}

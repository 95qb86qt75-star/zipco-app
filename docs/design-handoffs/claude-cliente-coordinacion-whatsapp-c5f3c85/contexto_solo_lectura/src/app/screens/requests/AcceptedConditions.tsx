import type { RequestProcessSummary } from './requestProcess';
import useAgreement, { type AgreementState } from './useAgreement';
import OrderReferencePhoto from './OrderReferencePhoto';
import { OrderPricePanel } from './OrderCardPanels';
import { agreementLink } from './agreementNavigation';
import type { StatusView } from './requestStatusGrouping';
import AvailabilityPlanSummary from './AvailabilityPlanSummary';
import ProductPreviewControl from './ProductPreviewControl';

const money = (value: number) => new Intl.NumberFormat('es-CL', {
  style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
}).format(value);

export function AgreementContent({ state, retry, business = false, compact = false }: { state: AgreementState; retry: () => void; business?: boolean; compact?: boolean }) {
  if (state.status === 'absent') return <p role="status">Las condiciones aceptadas aún no están disponibles. Actualiza el pedido.</p>;
  if (state.status === 'loading') return <p role="status">Cargando condiciones aceptadas…</p>;
  if (state.status === 'error') return <div role="alert">
    <p>{state.message}</p>
    <button type="button" className="mt-2 rounded-xl border px-3 py-2 font-bold" onClick={retry}>Reintentar</button>
  </div>;
  if (state.status !== 'loaded') return null;
  const { agreement: a } = state;
  return <div className={compact ? 'space-y-1.5 text-[11px] leading-4' : 'space-y-3'}>
    <p className="font-bold">{a.subjectSnapshot.orderType === 'service' ? 'Servicio' : 'Productos'}</p>
    {a.subjectSnapshot.orderType==='product'&&<ProductPreviewControl preview={a.productPreview??null} caption="PRODUCTO ACORDADO"/>}
    <ul className={compact ? 'space-y-1.5' : 'space-y-2'}>
      {a.subjectSnapshot.items.map((item, index) => <li key={`${item.catalogItemId}-${index}`}>
        <p><strong>{item.quantity} × {item.nameSnapshot}</strong></p>
        {item.descriptionSnapshot && <p>{item.descriptionSnapshot}</p>}
        <p>{item.unitPriceClpSnapshot === null ? 'Precio total de esta línea' : `${money(item.unitPriceClpSnapshot)} por unidad`} · Subtotal {money(item.subtotalClp)}</p>
      </li>)}
    </ul>
    {!compact && <OrderPricePanel price={a.totalPriceClp} label="Total:" />}
    {a.scheduledFor && <p>Fecha y hora: {new Intl.DateTimeFormat('es-CL', {
      timeZone: 'America/Santiago', dateStyle: 'medium', timeStyle: 'short',
    }).format(new Date(a.scheduledFor))}</p>}
    {a.subjectSnapshot.needNow && <p>Solicitado para ahora</p>}
    {a.subjectSnapshot.note && <p className="whitespace-pre-wrap">Nota: {a.subjectSnapshot.note}</p>}
    <OrderReferencePhoto src={a.subjectSnapshot.referencePhoto} business={business} />
    {a.subjectSnapshot.proposalMessage && <p className="whitespace-pre-wrap break-words">Explicación de la propuesta aceptada: {a.subjectSnapshot.proposalMessage}</p>}
    {a.subjectSnapshot.proposalPhoto && <OrderReferencePhoto src={a.subjectSnapshot.proposalPhoto} business={business} />}
    {a.availability && <AvailabilityPlanSummary plan={a.availability}/>}
  </div>;
}

export default function AcceptedConditions({ process, business = false, history = false }: { process: RequestProcessSummary | null | undefined; business?: boolean; history?: boolean }) {
  const { state, retry } = useAgreement(process);
  return <AcceptedConditionsPanel state={state} retry={retry} business={business} history={history} />;
}

export function AcceptedConditionsPanel({ state, retry, business = false, history = false, embedded = false, returnView }: { state: AgreementState; retry: () => void; business?: boolean; history?: boolean; embedded?: boolean; returnView?: StatusView }) {
  const href = state.status === 'loaded' ? agreementLink(state.agreement.requestProcessId, business, history, returnView) : undefined;
  if (embedded) return <div role="region" aria-label="Detalle de condiciones aceptadas" className="border-t border-teal-200/50 px-3 pt-2 text-slate-800 dark:border-teal-600/30 dark:text-slate-100">
    <AgreementContent state={state} retry={retry} business={business} compact />
    {state.status === 'loaded' && <a className="inline-flex min-h-11 items-center text-[11px] font-bold text-teal-700 dark:text-teal-200" href={href}>Abrir acuerdo</a>}
  </div>;
  return <section aria-label="Condiciones aceptadas" className="mt-3 space-y-3 rounded-[16px] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/70 p-3 text-sm text-slate-900 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/40 dark:text-slate-100">
    <h4 className="font-black">Condiciones aceptadas</h4>
    {state.status === 'loaded' && <a className="inline-flex min-h-11 items-center font-bold text-teal-700" href={href}>Abrir acuerdo</a>}
    <AgreementContent state={state} retry={retry} business={business} />
  </section>;
}

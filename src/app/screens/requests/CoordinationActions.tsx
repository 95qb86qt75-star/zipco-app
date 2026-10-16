import { useState } from 'react';
import type { BusinessRequest, MyOrder } from './types';
import { ANNUL_REASONS, coordinationAllowed, type AnnulReason, type CoordinationAction } from './coordinationApi';
import useCoordination from './useCoordination';

const buttonClass = 'min-h-12 w-full rounded-xl border border-teal-300 bg-white px-3 py-2 text-sm font-bold text-teal-800 disabled:opacity-50';

export default function CoordinationActions({ order, business, service, refresh }: {
  order: BusinessRequest | MyOrder; business: boolean; service: boolean; refresh: () => void;
}) {
  const [confirm, setConfirm] = useState<CoordinationAction | null>(null);
  const [deferred, setDeferred] = useState(false);
  const [reason, setReason] = useState<AnnulReason>('COORDINATION_NOT_REACHED');
  const [detail, setDetail] = useState('');
  const operation = useCoordination(order, business, refresh);
  const process = order.requestProcess;
  const allowed = (action: CoordinationAction) => order.recordState === 'available' && coordinationAllowed(process, business, action);
  const pending = operation.pending();
  const recoveryOnly = operation.needsUpdate || operation.storageWarning() || operation.restored();
  const client = 'customerName' in order ? order.customerName || 'el cliente' : '';
  const businessName = 'businessName' in order ? order.businessName || 'el negocio' : '';
  const submit = async (action: CoordinationAction) => {
    if (await operation.run(action, reason, detail)) { setConfirm(null); setDetail(''); }
  };
  const needsBusinessConsent = business && process?.coordination?.businessContactAuthorized !== true;
  return <section aria-label="Acciones de coordinación" className="mt-3 space-y-3 rounded-2xl border border-teal-200 bg-teal-50/70 p-3"
    onClick={(event) => event.stopPropagation()}>
    <h4 className="text-sm font-black text-teal-900">Coordinación</h4>
    {operation.message && <p role="alert" className="text-sm text-slate-700">{operation.message}</p>}
    {recoveryOnly ? <>
      <p role="alert" className="text-sm">{operation.storageWarning() || (operation.restored()
        ? 'Se recuperó una operación anterior. Actualiza su estado antes de reintentar.' : 'La operación ya fue confirmada. Actualiza el estado sin repetirla.')}</p>
      <button type="button" className={buttonClass} disabled={operation.busy} onClick={() => void operation.update()}>Actualizar estado</button>
    </> : pending ? <>
      <p className="text-sm">Hay una operación pendiente de confirmación. Reintenta con las mismas condiciones antes de realizar otra acción.</p>
      <button type="button" className={buttonClass} disabled={operation.busy} onClick={() => void operation.retry()}>Reintentar operación pendiente</button>
    </> : <>
      {allowed('AUTHORIZE_CONTACT') && !process?.coordination?.customerContactAuthorized && !deferred && <div className="space-y-2">
        <p className="font-bold">Autorizar contacto para este pedido</p>
        <p className="text-sm">¿Autorizas compartir con {businessName} el teléfono de tu perfil para coordinar este pedido? La autorización corresponde únicamente a este pedido.</p>
        <button type="button" className={buttonClass} disabled={operation.busy} onClick={() => void submit('AUTHORIZE_CONTACT')}>Autorizar contacto</button>
        <button type="button" className={buttonClass} disabled={operation.busy} onClick={() => setDeferred(true)}>Ahora no</button>
      </div>}
      {deferred && allowed('AUTHORIZE_CONTACT') && <button type="button" className={buttonClass} disabled={operation.busy} onClick={() => setDeferred(false)}>Revisar autorización de contacto</button>}
      {allowed('OPEN_WHATSAPP') && <>
        {business && <p className="text-sm">Acuerda con {client} los detalles, el pago y {service ? 'la realización del servicio' : 'la entrega'}.</p>}
        <button type="button" className={buttonClass} disabled={operation.busy} onClick={() => {
          if (needsBusinessConsent) setConfirm('OPEN_WHATSAPP'); else void submit('OPEN_WHATSAPP');
        }}>Coordinar por WhatsApp</button>
      </>}
      {allowed('START_WORK') && <button type="button" className={buttonClass} disabled={operation.busy} onClick={() => void submit('START_WORK')}>Coordinación lista — comenzar pedido</button>}
      {allowed('ANNUL_COORDINATION') && <button type="button" className={buttonClass} disabled={operation.busy} onClick={() => setConfirm('ANNUL_COORDINATION')}>Anular solicitud</button>}
      {confirm === 'OPEN_WHATSAPP' && allowed('OPEN_WHATSAPP') && <div className="space-y-2" role="group" aria-label="Confirmar contacto por WhatsApp">
        <p className="text-sm">Compartirás con {client} el teléfono de tu perfil para coordinar este pedido por WhatsApp. ZIPCO no procesa ni verifica pagos.</p>
        <button type="button" className={buttonClass} disabled={operation.busy} onClick={() => void submit('OPEN_WHATSAPP')}>Continuar a WhatsApp</button>
        <button type="button" className={buttonClass} disabled={operation.busy} onClick={() => setConfirm(null)}>Volver</button>
      </div>}
      {confirm === 'ANNUL_COORDINATION' && allowed('ANNUL_COORDINATION') && <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); void submit('ANNUL_COORDINATION'); }}>
        <label className="block text-sm font-bold">Motivo de anulación
          <select className="mt-1 min-h-12 w-full rounded-xl border bg-white p-2" value={reason} disabled={operation.busy}
            onChange={(event) => { setReason(event.target.value as AnnulReason); setDetail(''); }}>
            {Object.entries(ANNUL_REASONS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {reason === 'OTHER' && <label className="block text-sm">Explicación obligatoria
          <textarea className="mt-1 min-h-24 w-full rounded-xl border p-2" required maxLength={1000} value={detail} disabled={operation.busy} onChange={(event) => setDetail(event.target.value)} />
        </label>}
        <p className="text-sm">¿Quieres anular esta solicitud? Pasará a Historial y conservará sus condiciones aceptadas.</p>
        <button type="submit" className={buttonClass} disabled={operation.busy || (reason === 'OTHER' && !detail.trim())}>Confirmar anulación</button>
        <button type="button" className={buttonClass} disabled={operation.busy} onClick={() => setConfirm(null)}>Volver</button>
      </form>}
    </>}
    {operation.busy && <p role="status" className="text-sm">Actualizando pedido…</p>}
  </section>;
}

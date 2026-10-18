import { useState } from 'react';
import { LockKeyhole, Trash2 } from 'lucide-react';
import type { BusinessRequest, MyOrder } from './types';
import { ANNUL_REASONS, coordinationAllowed, type AnnulReason, type CoordinationAction } from './coordinationApi';
import useCoordination from './useCoordination';
import WhatsAppMark from './WhatsAppMark';
import CustomerReceiptDialog from './CustomerReceiptDialog';

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
  const readyOnly = business && process?.state === 'IN_PROGRESS';
  const productReady = !service && process?.state === 'READY';
  const allowed = (action: CoordinationAction) => order.recordState === 'available' &&
    (!readyOnly || action === 'MARK_READY') &&
    (!(productReady && action === 'OPEN_WHATSAPP')) &&
    (!(service && (action === 'ACK_READY_NOTICE' || action === 'CONFIRM_RECEIPT'))) &&
    coordinationAllowed(process, business, action);
  const pending = operation.pending();
  const recoveryOnly = operation.needsUpdate || operation.storageWarning() || operation.restored();
  const client = 'customerName' in order ? order.customerName || 'el cliente' : '';
  const businessName = 'businessName' in order ? order.businessName || 'el negocio' : '';
  const submit = async (action: CoordinationAction) => {
    if (await operation.run(action, reason, detail)) { setConfirm(null); setDetail(''); }
  };
  const needsBusinessConsent = business && process?.coordination?.businessContactAuthorized !== true;
  return <section aria-label="Acciones de coordinación" className={`mt-3 rounded-2xl border border-teal-200 p-3 ${business ? 'space-y-3 bg-teal-50/70' : 'space-y-2 zipco-customer-coordination'}`}
    onClick={(event) => event.stopPropagation()}>
    <h4 className={business ? 'text-sm font-black text-teal-900' : 'text-[10px] font-black uppercase tracking-[0.16em] text-teal-800'}>{readyOnly || process?.state === 'READY' ? 'Estado del pedido' : 'Coordinación'}</h4>
    {business && ['COORDINATION_PENDING', 'COORDINATING'].includes(process?.state ?? '') &&
      process?.coordination?.customerContactAuthorized === false &&
      <p role="status" className="text-sm text-slate-700">Esperando autorización de contacto del cliente.</p>}
    {operation.message && <p role="alert" className="text-sm text-slate-700">{operation.message}</p>}
    {productReady && <p role="status" className="text-sm text-slate-700">
      {process.readyNoticeAcknowledged === true
        ? business ? 'El cliente confirmó el aviso. Pendiente de retiro.' : 'Aviso confirmado. Retira tu pedido según lo coordinado. Confirma la recepción solo cuando ya tengas el producto.'
        : process.readyNoticeAcknowledged === false
          ? business ? 'Esperando que el cliente confirme el aviso.' : 'Tu pedido está listo. Confirma que viste el aviso para continuar con el retiro.'
          : 'El estado del aviso no está disponible. Actualiza el estado del pedido.'}
    </p>}
    {recoveryOnly ? <>
      <p role="alert" className="text-sm">{operation.storageWarning() || (operation.restored()
        ? 'Se recuperó una operación anterior. Actualiza su estado antes de reintentar.' : 'La operación ya fue confirmada. Actualiza el estado sin repetirla.')}</p>
      <button type="button" className={buttonClass} disabled={operation.busy} onClick={() => void operation.update()}>Actualizar estado</button>
    </> : pending ? <>
      <p className="text-sm">Hay una operación pendiente de confirmación. Reintenta con las mismas condiciones antes de realizar otra acción.</p>
      <button type="button" className={buttonClass} disabled={operation.busy} onClick={() => void operation.retry()}>Reintentar operación pendiente</button>
    </> : <>
      {productReady && process.readyNoticeAcknowledged === undefined && <button type="button" className={buttonClass} disabled={operation.busy} onClick={() => void operation.update()}>Actualizar estado del aviso</button>}
      {allowed('ACK_READY_NOTICE') && <button type="button" className={buttonClass} disabled={operation.busy} onClick={() => setConfirm('ACK_READY_NOTICE')}>Confirmar aviso</button>}
      {allowed('CONFIRM_RECEIPT') && <button type="button" className={buttonClass} disabled={operation.busy} onClick={() => setConfirm('CONFIRM_RECEIPT')}>Confirmar recepción</button>}
      {allowed('AUTHORIZE_CONTACT') && !process?.coordination?.customerContactAuthorized && !deferred && <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100/80 text-teal-600"><WhatsAppMark className="h-7 w-7" /></span>
          <p className="flex items-start gap-1.5 text-sm font-black leading-tight text-slate-950"><LockKeyhole aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />Autorizar contacto para este pedido</p>
        </div>
        <p className="text-xs leading-[18px] text-slate-600">¿Autorizas compartir con {businessName} el teléfono de tu perfil para coordinar este pedido? La autorización corresponde únicamente a este pedido.</p>
        <button type="button" className="zipco-contact-consent" disabled={operation.busy} onClick={() => void submit('AUTHORIZE_CONTACT')}>
          <WhatsAppMark className="zipco-contact-consent-icon h-6 w-6 shrink-0" /><span>Autorizo iniciar coordinación</span>
        </button>
        <button type="button" className="zipco-coordination-glass" disabled={operation.busy} onClick={() => setDeferred(true)}>Ahora no</button>
      </div>}
      {deferred && allowed('AUTHORIZE_CONTACT') && <button type="button" className={buttonClass} disabled={operation.busy} onClick={() => setDeferred(false)}>Revisar autorización de contacto</button>}
      {allowed('OPEN_WHATSAPP') && <>
        {business && <p className="text-sm">Acuerda con {client} los detalles, el pago y {service ? 'la realización del servicio' : 'la entrega'}.</p>}
        <button type="button" className={buttonClass} disabled={operation.busy} onClick={() => {
          if (needsBusinessConsent) setConfirm('OPEN_WHATSAPP'); else void submit('OPEN_WHATSAPP');
        }}>Coordinar por WhatsApp</button>
      </>}
      {allowed('MARK_READY') && <button type="button" className={buttonClass} disabled={operation.busy} onClick={() => void submit('MARK_READY')}>Notificar pedido listo</button>}
      {allowed('START_WORK') && <button type="button" className={buttonClass} disabled={operation.busy} onClick={() => void submit('START_WORK')}>Coordinación lista — comenzar pedido</button>}
      {allowed('ANNUL_COORDINATION') && <button type="button" className={business ? buttonClass : 'zipco-coordination-glass zipco-coordination-glass-danger'} disabled={operation.busy} onClick={() => setConfirm('ANNUL_COORDINATION')}>
        {!business && <Trash2 aria-hidden="true" className="h-4 w-4" />}Anular solicitud</button>}
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
    {(confirm === 'ACK_READY_NOTICE' || confirm === 'CONFIRM_RECEIPT') && allowed(confirm) && !recoveryOnly && (!pending || operation.busy) &&
      <CustomerReceiptDialog action={confirm} busy={operation.busy} message={operation.message}
        onClose={() => setConfirm(null)} onConfirm={() => void submit(confirm)} />}
    {operation.busy && <p role="status" className="text-sm">Actualizando pedido…</p>}
  </section>;
}

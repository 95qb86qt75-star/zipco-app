import {useState} from 'react';
import {LockKeyhole,RefreshCw} from 'lucide-react';
import type {BusinessRequest,MyOrder} from './types';
import {availabilityAllowed} from './availabilityApi';
import {fulfillmentFromChoice} from './availabilityChoice';
import useAvailability from './useAvailability';
import {PendingRequestDesign,ConfirmAvailabilityDesign,AvailableRequestDesign,DesignConfirmation,type AvailabilityDesignChoice,type RequestDesignData} from './availability-design/AvailabilityDesign';
import AcceptGlassButton from './AcceptGlassButton';
import PendingRejectionActions from './PendingRejectionActions';
import ProposalNegotiation from './ProposalNegotiation';
import OrderReferencePhoto from './OrderReferencePhoto';
import {safePhoto} from './agreement';
import {formatDeliverySchedule} from './utils';
import {CUSTOMER_CONTACT_TEXT_VERSION} from '../createOrderApi';
import {AuroraProposalHeader} from './OrderCardAurora';

export default function AvailabilityFlowCard({order,business,expanded,onToggle,refresh,isUnread=false}:{
  order:BusinessRequest|MyOrder;business:boolean;expanded:boolean;onToggle:()=>void;refresh:()=>void;isUnread?:boolean;
}){
  const operation=useAvailability(order,business,refresh);
  const [sheet,setSheet]=useState(false),[decline,setDecline]=useState(false),[past,setPast]=useState(false);
  const [contact,setContact]=useState(true);
  const process=order.requestProcess,plan=process?.availability;
  const name=business?'customerName'in order?order.customerName:'Cliente':'businessName'in order?order.businessName:'Negocio';
  if(!process)return null;
  if(order.products.state!=='available'||order.total===null)return <article id={`order-${order.id}`} className="rounded-2xl border p-4"><p>No se pudieron verificar los datos de esta solicitud.</p><button onClick={refresh}>Actualizar pedido</button></article>;
  const data:RequestDesignData={counterpart:name,items:order.products.items.map(i=>({name:i.name,quantity:i.quantity,unitPrice:i.price})),
    total:order.total,immediate:order.needNow,schedule:formatDeliverySchedule(order,business?'business':'customer')??'Sin horario solicitado',note:order.note??undefined};
  const reference=order.referencePhoto&&safePhoto(order.referencePhoto)?<OrderReferencePhoto src={order.referencePhoto} business={business}/>:null;
  const originalDetail=<div className="zipco-av-original"><div className="zipco-av-items">{data.items.map((i,index)=><div key={index} className="zipco-av-item"><span className="zipco-av-quantity">{i.quantity}×</span><span className="zipco-av-item-name">{i.name}</span><b>${(i.quantity*i.unitPrice).toLocaleString('es-CL')}</b></div>)}</div>
    <p className="zipco-av-schedule">{data.schedule}</p>{order.note&&<p className="zipco-av-note">Nota: {order.note}</p>}{reference}</div>;
  const error=operation.error&&<div role="alert" className="zipco-av-error"><p>{operation.error}</p><button type="button" disabled={operation.busy} onClick={()=>void operation.update()}><RefreshCw/>Actualizar estado</button></div>;
  const confirm=async(choice:AvailabilityDesignChoice)=>{
    if(await operation.run('CONFIRM_AVAILABILITY',{proposalId:process.currentProposalId,fulfillment:fulfillmentFromChoice(choice)}))setSheet(false);
  };
  const continueRequest=async(acceptPast=false)=>{
    if(!plan)return;
    const ok=await operation.run('CONTINUE_REQUEST',{proposalId:process.currentProposalId,availabilityConfirmationId:plan.availabilityConfirmationId,
      conditionsAccepted:true,customerContactPreference:{allowed:plan.path==='LOCAL_PICKUP'&&!plan.allowCustomerWhatsapp?false:contact,textVersion:CUSTOMER_CONTACT_TEXT_VERSION},
      ...(acceptPast?{acceptPastSchedule:true}:{})});
    if(!ok)setPast(true);
  };
  const closeRequest=async()=>{if(plan&&await operation.run(business?'WITHDRAW_AVAILABILITY':'DECLINE_REQUEST',{
    proposalId:process.currentProposalId,availabilityConfirmationId:plan.availabilityConfirmationId}))setDecline(false);};
  return <div id={`order-${order.id}`} tabIndex={-1} data-aurora-state={process.state} data-unread={isUnread} className="scroll-mb-36 zipco-availability-real">
    {business&&process.state==='AWAITING_BUSINESS_RESPONSE'?<>
      <PendingRequestDesign data={data} expanded={expanded} onToggle={onToggle} business detail={originalDetail}
        contactIntent={process.customerContactPreference?.requiresReconfirmation?undefined:process.customerContactPreference?.allowed} actions={<div className="zipco-av-business-actions">
          {availabilityAllowed(process,true,'CONFIRM_AVAILABILITY')&&<AcceptGlassButton label={operation.busy?'Guardando…':'Confirmar disponibilidad'} price={data.total} disabled={operation.busy} onClick={()=>setSheet(true)}/>}
          <p className="zipco-av-fine"><LockKeyhole/>En el siguiente paso eliges cómo continuar y si compartes tu teléfono.</p>
          <div className="zipco-av-secondary-actions zipco-av-live-secondary"><ProposalNegotiation order={order} business refresh={refresh} variant="aurora"/><PendingRejectionActions order={order} refresh={refresh}/></div>
          {error}
        </div>}/>
      <ConfirmAvailabilityDesign open={sheet} onOpenChange={setSheet} onChoose={confirm} busy={operation.busy} error={operation.error||undefined}/>
    </>:!business&&plan?<>
      <AvailableRequestDesign data={data} expanded={expanded} onToggle={onToggle} contact={contact} onContactChange={setContact}
        pickup={plan.path==='LOCAL_PICKUP'?{message:plan.customerMessage??'',scheduleOrAddress:plan.scheduleOrAddress??'',allowsContact:plan.allowCustomerWhatsapp}:undefined}
        busy={operation.busy||!availabilityAllowed(process,false,'CONTINUE_REQUEST')||!availabilityAllowed(process,false,'DECLINE_REQUEST')}
        onContinue={()=>void continueRequest()} onDecline={()=>setDecline(true)} error={operation.error||undefined}
        extraDetails={<>{order.note&&<p className="zipco-av-note">Nota: {order.note}</p>}<p className="zipco-av-schedule">{data.schedule}</p>{reference}</>}/>
      {operation.error&&<button className="mt-2 rounded-xl border p-2" disabled={operation.busy} onClick={()=>void operation.update()}>Actualizar estado</button>}
    </>:<article className="zipco-aurora-card rounded-[24px] p-4">
      <AuroraProposalHeader name={name} image={'customerImage'in order?order.customerImage:undefined} price={data.total} priceLabel="Solicitado" statusLabel="Esperando respuesta del cliente" summaryText="Confirmaste disponibilidad. El cliente debe decidir si continúa."/>
      <button type="button" className="zipco-hide-order-detail" aria-expanded={expanded} onClick={onToggle}>{expanded?'Ocultar detalle':'Ver detalle'}</button>
      {expanded&&<>{originalDetail}<p className="mt-3 text-sm">{plan?.path==='LOCAL_PICKUP'?'Retiro en el local':'Coordinar por WhatsApp'}</p>{plan?.customerMessage&&<p>{plan.customerMessage}</p>}{plan?.scheduleOrAddress&&<p>{plan.scheduleOrAddress}</p>}
        {availabilityAllowed(process,true,'WITHDRAW_AVAILABILITY')&&<button type="button" className="mt-3 rounded-xl border p-2 text-sm" disabled={operation.busy} onClick={()=>setDecline(true)}>Retirar disponibilidad</button>}</>}{error}
    </article>}
    <DesignConfirmation open={decline} onOpenChange={setDecline} title={business?'¿Retirar la disponibilidad?':'¿No quieres continuar con la compra?'} description="La solicitud se conservará en Historial."
      confirmLabel={business?'Retirar disponibilidad':'No, gracias'} onConfirm={()=>void closeRequest()}/>
    <DesignConfirmation open={past&&operation.expired} onOpenChange={setPast} title="La fecha y hora solicitadas ya pasaron" description="Las condiciones conservarán la fecha original. ¿Quieres continuar igualmente?"
      confirmLabel="Sí, continuar igualmente" onConfirm={()=>void continueRequest(true)}/>
  </div>;
}

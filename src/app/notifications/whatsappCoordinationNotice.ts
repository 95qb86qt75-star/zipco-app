import type {ProcessOrder} from '../screens/requests/requestProcess';
export function whatsappCoordinationNotice(order:{id:number}&ProcessOrder,business:boolean){
  const p=order.requestProcess,c=p?.whatsappCoordination;
  if(!p||!c||c.status==='EXPIRED')return null;
  const self=business?'BUSINESS':'CUSTOMER';
  const kind=c.status==='PENDING'&&c.initiatedBy!==self&&p.state==='IN_PROGRESS'?'coordination-confirmed':c.initiatedBy===self&&c.status==='CONFIRMED'&&p.state==='IN_PROGRESS'?'coordination-accepted':c.initiatedBy===self&&c.status==='DECLINED'&&p.state==='COORDINATING'?'coordination-declined':null;
  if(!kind)return null;
  const notices={
    'coordination-confirmed':['¿Ya coordinaron por WhatsApp?','La otra parte indicó que ya coordinaron. Revisa el pedido y confirma si es correcto.'],
    'coordination-accepted':['Coordinación confirmada','La otra parte confirmó que ya coordinaron. El pedido sigue en curso.'],
    'coordination-declined':['Todavía falta coordinar','La otra parte indicó que aún no coordinaron. El pedido volvió a Por coordinar.'],
  } as const;
  return {key:'order-'+order.id+'-coordination-'+kind+'-'+p.version,notice:notices[kind]};
}

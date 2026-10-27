import type {ProcessOrder} from '../screens/requests/requestProcess';
export function lateInitialNotice(order:{id:number}&ProcessOrder,business:boolean){
  const late=order.requestProcess?.lateInitialResponse;
  if(!late)return null;
  const event=!business&&late.status==='AWAITING_CUSTOMER'?['ASK_LATE_REQUEST_NEED','¿Todavía necesitas este pedido?','El negocio te envió una consulta. Revisa la solicitud para responder.']:
    business&&late.status==='STILL_NEEDED'?['CONFIRM_LATE_REQUEST_NEED','El cliente aún necesita el pedido','Propón una nueva fecha y hora para que la revise.']:
    business&&late.status==='NO_LONGER_NEEDED'?['DECLINE_LATE_REQUEST_NEED','El cliente ya no necesita el pedido','La solicitud quedó en el historial de ambos.']:
    !business&&late.status==='BUSINESS_UNAVAILABLE'?['CLOSE_LATE_REQUEST_UNAVAILABLE','El negocio no podrá atender','La solicitud quedó en el historial de ambos.']:null;
  return event?{key:`order-${order.id}-late-${event[0].toLowerCase().replaceAll('_','-')}`,notice:[event[1],event[2]] as const}:null;
}

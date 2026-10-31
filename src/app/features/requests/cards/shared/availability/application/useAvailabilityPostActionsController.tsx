
import {useState} from 'react';

import type { BusinessRequest, MyOrder } from "../../../../domain/types";
import { availabilityAllowed } from "../../../../api/availabilityApi";
import { availabilityFlow } from "../../../../domain/availabilityContract";
import useAvailability from "../../../../application/useAvailability";
import useCoordination from "../../../../application/useCoordination";
import { coordinationAllowed, contactAuthorized } from "../../../../api/coordinationApi";


export function useAvailabilityPostActionsController({order,business,refresh}:{order:BusinessRequest|MyOrder;business:boolean;refresh:()=>void}){

  const operation=useAvailability(order,business,refresh),contact=useCoordination(order,business,refresh);
  const [dialog,setDialog]=useState<'cancel'|'revoke'|null>(null),[reason,setReason]=useState('');
  if(!availabilityFlow(order.requestProcess))return null;
  const process=order.requestProcess;
  const showContactControls=process?.state!=='READY'&&process?.reservation?.mode!=='PREPAYMENT';
  const canCancel=availabilityAllowed(process,business,'CANCEL_PICKUP'),canRevoke=showContactControls&&availabilityAllowed(process,business,'REVOKE_CONTACT_CONSENT');
  const canAuthorize=['IN_PROGRESS','READY'].includes(process?.state??'')&&coordinationAllowed(process,business,'AUTHORIZE_CONTACT')&&!contactAuthorized(process,business);
  const hasContact=canAuthorize||coordinationAllowed(process,business,'OPEN_WHATSAPP');
  const submit=async()=>{
    if(dialog==='cancel'&&(Array.from(reason.trim()).length<3||Array.from(reason.trim()).length>1000))return;
    if(await operation.run(dialog==='cancel'?'CANCEL_PICKUP':'REVOKE_CONTACT_CONSENT',dialog==='cancel'?{reasonDetail:reason.trim()}:{}))setDialog(null);
  };

return {business,canAuthorize,canCancel,canRevoke,contact,dialog,hasContact,operation,order,process,reason,refresh,setDialog,setReason,showContactControls,submit};
}
export type AvailabilityPostActionsModel=NonNullable<ReturnType<typeof useAvailabilityPostActionsController>>;

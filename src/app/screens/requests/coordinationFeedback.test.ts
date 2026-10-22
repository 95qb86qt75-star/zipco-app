import { expect,it } from 'vitest';
import { coordinationFeedback } from './coordinationFeedback';
import { rawOrder,coordinationProcess } from './requestProcessFixtures';
import { normalizeBusinessOrdersPayload } from './orderNormalization';
const latest=normalizeBusinessOrdersPayload([{...rawOrder,status:'accepted',requestProcess:{...coordinationProcess,coordination:{businessContactAuthorized:true,customerContactAuthorized:false}}}])[0];
const receipt={orderId:latest.id!,orderStatus:'accepted' as const,requestProcess:latest.requestProcess!};
it('only confirms the actor actually authorized on the current read',()=>{
 expect(coordinationFeedback('AUTHORIZE_CONTACT',receipt,latest,true)?.kind).toBe('authorized');
 expect(coordinationFeedback('AUTHORIZE_CONTACT',receipt,latest,false)).toBeNull();
 expect(coordinationFeedback('AUTHORIZE_CONTACT',receipt,null,true)).toBeNull();
 expect(coordinationFeedback('AUTHORIZE_CONTACT',{...receipt,requestProcess:{...receipt.requestProcess,version:receipt.requestProcess.version+1}},latest,true)).toBeNull();
});
it('never claims a navigation or success from an unrelated read',()=>{
 expect(coordinationFeedback('OPEN_WHATSAPP',receipt,latest,true)).toBeNull();
 expect(coordinationFeedback('MARK_READY',receipt,latest,true)).toBeNull();
 expect(coordinationFeedback('ANNUL_COORDINATION',receipt,latest,true)).toBeNull();
 expect(coordinationFeedback('AUTHORIZE_CONTACT',{...receipt,orderId:99999},latest,true)).toBeNull();
});
it.each([['MARK_READY','READY','ready'],['ANNUL_COORDINATION','COORDINATION_CANCELLED','annulled'],['START_WORK','IN_PROGRESS','started']] as const)('shows %s only after the corresponding current state', (action,state,kind)=>{
 const current={...latest,requestProcess:{...latest.requestProcess!,state}};
 expect(coordinationFeedback(action,{...receipt,requestProcess:current.requestProcess},current,true)?.kind).toBe(kind);
});

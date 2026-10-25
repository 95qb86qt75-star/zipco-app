import {afterEach,describe,expect,it,vi} from 'vitest';
import {normalizeAvailability} from './availabilityContract';
import {normalizeRequestProcess,isAvailabilityClosed,processStatusLabel} from './requestProcess';
import {statusViewFor} from './requestStatusGrouping';
import {normalizeAgreement} from './agreement';
import {normalizeProposals} from './proposalContract';
import {agreementFixture,pendingProcess} from './requestProcessFixtures';
import {sendProposalAction} from './proposalApi';
import {createOrder} from '../createOrderApi';
import {availabilityInitial,availabilityWaiting,availabilityAccepted,whatsappPlan,pickupPlan,availabilityConversation} from './availabilityFixtures';
import {availabilityAllowed,sendAvailabilityAction} from './availabilityApi';
import {createAvailabilityIntents} from './availabilityIntent';
import {AvailabilityError} from './availabilityApi';
import {fulfillmentFromChoice} from './availabilityChoice';
import {coordinationBody} from './coordinationApi';
import {processApiError,FLOW_UPDATE_MESSAGE} from './requestProcessErrors';
const key='123e4567-e89b-42d3-a456-426614174000';
afterEach(()=>vi.unstubAllGlobals());
describe('S2 read contract and separation from legacy',()=>{
  it('preserves omission for old processes and never infers S2 from preference',()=>{
    expect(normalizeRequestProcess(pendingProcess)).toEqual(pendingProcess);
    expect(normalizeRequestProcess({...pendingProcess,flowContract:'unknown'})).toBeNull();
    expect(normalizeRequestProcess({...availabilityInitial,flowContract:undefined})).toBeNull();
    expect(normalizeRequestProcess({...availabilityInitial,allowedActions:['ACCEPT_FIXED_ORDER']})).toBeNull();
  });
  it('preserves exact plans without retaining contact extras',()=>{
    expect(normalizeRequestProcess(availabilityWaiting)).toEqual(availabilityWaiting);
    expect(normalizeAvailability({...pickupPlan,phone:'not-a-real-contact',url:'not-a-navigation'},123)).toEqual(pickupPlan);
    for(const invalid of [{...whatsappPlan,allowCustomerWhatsapp:false},{...whatsappPlan,customerMessage:'extra'}, {...pickupPlan,proposalId:999},{...pickupPlan,customerMessage:''}, {...pickupPlan,scheduleOrAddress:'x'.repeat(81)}])expect(normalizeAvailability(invalid,123)).toBeNull();
    expect(normalizeRequestProcess({...availabilityWaiting,availability:undefined})).toBeNull();
  });
  it('retains the immutable plan in agreement and each proposal',()=>{
    expect(normalizeAgreement({...agreementFixture,availability:pickupPlan})?.availability).toEqual(pickupPlan);
    expect(normalizeProposals(availabilityConversation,7)?.proposals[0].availability).toEqual(whatsappPlan);
    expect(normalizeAgreement({...agreementFixture,availability:{...pickupPlan,proposalId:999}})).toBeNull();
  });
  it.each(['CUSTOMER_DECLINED_CONTINUATION','BUSINESS_WITHDREW_AVAILABILITY','PICKUP_CANCELLED'] as const)('groups %s in history without dropping the agreement for pickup',reasonCode=>{
    const pickup=reasonCode==='PICKUP_CANCELLED';
    const p=normalizeRequestProcess({...availabilityWaiting,state:'CLOSED',version:5,allowedActions:[],availability:pickup?pickupPlan:whatsappPlan,
      agreementPublicId:pickup?'agreement-test':null,closure:{reasonCode,reasonDetail:pickup?'No puedo retirar':null,actor:reasonCode==='BUSINESS_WITHDREW_AVAILABILITY'?'BUSINESS':'CUSTOMER',actorUserId:1,closedAt:'2026-10-25T06:00:00.000Z'}});
    expect(p).not.toBeNull();expect(isAvailabilityClosed(p)).toBe(true);expect(statusViewFor('orders','cancelled',p)).toBe('history');
    expect(p?.agreementPublicId).toBe(pickup?'agreement-test':null);
  });
  it('groups continuation in waiting and pickup in active with the D48 label',()=>{
    expect(statusViewFor('orders','pending',availabilityWaiting)).toBe('waiting');
    const pickup={...availabilityAccepted,state:'IN_PROGRESS',availability:pickupPlan};
    expect(statusViewFor('orders','accepted',pickup)).toBe('active');expect(processStatusLabel({requestProcess:pickup})).toBe('Pendiente de retiro en el local');
    expect(processApiError(409,{code:'FLOW_CONTRACT_REQUIRED'}).message).toBe(FLOW_UPDATE_MESSAGE);
  });
  it('uses each side own contact choice and keeps legacy contact bodies unchanged',()=>{
    expect(coordinationBody('AUTHORIZE_CONTACT',2)).toEqual({expectedVersion:2,consentAccepted:true});
    expect(coordinationBody('OPEN_WHATSAPP',4,undefined,'',availabilityAccepted)).toEqual({expectedVersion:4,consentAccepted:true,consentTextVersion:'availability-contact-v1'});
    expect(fulfillmentFromChoice({channel:'pickup',instructions:{message:'Retira aquí',scheduleOrAddress:'',allowsContact:false}})).not.toHaveProperty('businessContactConsent');
    expect(fulfillmentFromChoice({channel:'whatsapp'}).businessContactConsent).toEqual({accepted:true,textVersion:'availability-business-whatsapp-v1'});
  });
});
describe('S2 action receipts, actors and exact retries',()=>{
  it('confirms availability without an agreement and requires the business action',async()=>{
    const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({orderId:20,orderStatus:'pending',requestProcess:{...availabilityWaiting,allowedActions:[]}})));vi.stubGlobal('fetch',fetcher);
    const body={expectedVersion:1,proposalId:123,fulfillment:fulfillmentFromChoice({channel:'whatsapp'})};
    const receipt=await sendAvailabilityAction(availabilityInitial,20,true,'CONFIRM_AVAILABILITY',body,'test-only',key);
    expect(receipt.requestProcess.agreementPublicId).toBeNull();expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual(body);
    expect(availabilityAllowed(availabilityInitial,false,'CONFIRM_AVAILABILITY')).toBe(false);
    expect(availabilityAllowed(pendingProcess,true,'CONFIRM_AVAILABILITY')).toBe(false);
  });
  it.each(['WHATSAPP','LOCAL_PICKUP'] as const)('continues %s with its exact plan and expected destination',async(path)=>{
    const plan=path==='WHATSAPP'?whatsappPlan:pickupPlan,p={...availabilityWaiting,availability:plan};
    const result={...availabilityAccepted,state:path==='WHATSAPP'?'COORDINATION_PENDING':'IN_PROGRESS',availability:plan};
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({orderId:20,orderStatus:'accepted',requestProcess:result}))));
    const receipt=await sendAvailabilityAction(p,20,false,'CONTINUE_REQUEST',{expectedVersion:2,proposalId:123,availabilityConfirmationId:31,conditionsAccepted:true,customerContactPreference:{allowed:false,textVersion:'availability-customer-whatsapp-v1'}},'test-only',key);
    expect(receipt.requestProcess.state).toBe(result.state);expect(receipt.requestProcess.agreementPublicId).toBeTruthy();
    expect(availabilityAllowed(p,true,'CONTINUE_REQUEST')).toBe(false);
  });
  it('does not accept a premature agreement in the availability receipt',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({orderId:20,orderStatus:'accepted',requestProcess:availabilityAccepted}))));
    await expect(sendAvailabilityAction(availabilityInitial,20,true,'CONFIRM_AVAILABILITY',{expectedVersion:1,proposalId:123,fulfillment:fulfillmentFromChoice({channel:'whatsapp'})},'test-only',key)).rejects.toThrow('No se pudo verificar');
  });
  it('freezes an uncertain intention by its fingerprint, reuses the key and never repeats a confirmed POST',async()=>{
    const store=new Map<string,string>(),intents=createAvailabilityIntents({getItem:k=>store.get(k)??null,setItem:(k,v)=>{store.set(k,v);},removeItem:k=>{store.delete(k);}},()=>key);
    const body={expectedVersion:1,proposalId:123,fulfillment:fulfillmentFromChoice({channel:'whatsapp'})};
    const receipt={orderId:20,orderStatus:'pending' as const,requestProcess:{...availabilityWaiting,allowedActions:[]}};
    const send=vi.fn().mockRejectedValueOnce(new TypeError('network')).mockResolvedValue(receipt);
    await expect(intents.run('test:business',7,'CONFIRM_AVAILABILITY',body,send)).rejects.toThrow();
    await expect(intents.run('test:business',7,'CONFIRM_AVAILABILITY',{...body,proposalId:999},send)).rejects.toThrow('operación pendiente');
    await expect(intents.run('test:business',7,'CONFIRM_AVAILABILITY',body,send)).resolves.toEqual(receipt);
    await intents.run('test:business',7,'CONFIRM_AVAILABILITY',body,send);
    expect(send).toHaveBeenCalledTimes(2);expect(send.mock.calls[0][0]).toBe(key);expect(send.mock.calls[1][0]).toBe(key);
    expect([...store.values()].join('')).not.toContain('fulfillment');
  });
  it('retains a confirmed tombstone after reload and requires an authoritative newer version',async()=>{
    const store=new Map<string,string>(),storage={getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>{store.set(k,v);},removeItem:(k:string)=>{store.delete(k);}};
    const first=createAvailabilityIntents(storage,()=>key),body={expectedVersion:1,proposalId:123};
    await first.run('test:business',7,'CONFIRM_AVAILABILITY',body,async()=>({orderId:20,orderStatus:'pending',requestProcess:availabilityWaiting}));
    const restored=createAvailabilityIntents(storage,()=>key),send=vi.fn();
    await expect(restored.run('test:business',7,'CONFIRM_AVAILABILITY',body,send)).rejects.toThrow('ya está confirmada');expect(send).not.toHaveBeenCalled();
    await restored.reconcile('test:business',7,2);expect(store.size).toBe(0);
  });
  it('keeps an uncertain restored key even if the retry receives a validation error',async()=>{
    const store=new Map<string,string>(),storage={getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>{store.set(k,v);},removeItem:(k:string)=>{store.delete(k);}};
    const body={expectedVersion:1,proposalId:123};
    await expect(createAvailabilityIntents(storage,()=>key).run('test:business',7,'CONFIRM_AVAILABILITY',body,async()=>{throw new TypeError('network');})).rejects.toThrow();
    const restored=createAvailabilityIntents(storage,()=>key);
    await expect(restored.run('test:business',7,'CONFIRM_AVAILABILITY',body,async()=>{throw new AvailabilityError('Invalid',400);})).rejects.toThrow();
    expect(store.size).toBe(1);
    await expect(restored.run('test:business',7,'CONFIRM_AVAILABILITY',{...body,proposalId:999},vi.fn())).rejects.toThrow('operación pendiente');
  });
  it('requires no mutation when persistence cannot protect the key',async()=>{
    const intents=createAvailabilityIntents({getItem:()=>null,setItem:()=>{throw Error('storage');},removeItem:()=>undefined},()=>key),send=vi.fn();
    await expect(intents.run('test:business',7,'CONFIRM_AVAILABILITY',{expectedVersion:1},send)).rejects.toBeInstanceOf(AvailabilityError);expect(send).not.toHaveBeenCalled();
  });
  it.each(['DECLINE_REQUEST','WITHDRAW_AVAILABILITY'] as const)('closes %s without an agreement for the correct actor',async action=>{
    const business=action==='WITHDRAW_AVAILABILITY',reasonCode=business?'BUSINESS_WITHDREW_AVAILABILITY':'CUSTOMER_DECLINED_CONTINUATION';
    const process={...availabilityWaiting,allowedActions:[action]};
    const closed={...process,state:'CLOSED',version:3,allowedActions:[],closure:{reasonCode,reasonDetail:null,actor:business?'BUSINESS':'CUSTOMER',actorUserId:business?2:1,closedAt:'2026-10-25T06:00:00.000Z'}};
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({orderId:20,orderStatus:'cancelled',requestProcess:closed}))));
    expect((await sendAvailabilityAction(process,20,business,action,{expectedVersion:2,proposalId:123,availabilityConfirmationId:31},'test-only',key)).requestProcess.agreementPublicId).toBeNull();
    expect(availabilityAllowed(process,!business,action)).toBe(false);
  });
  it.each([true,false])('cancels pickup preserving the agreement and actor (business=%s)',async business=>{
    const process={...availabilityAccepted,state:'IN_PROGRESS',availability:pickupPlan,allowedActions:['CANCEL_PICKUP' as const]};
    const closed={...process,state:'CLOSED',version:5,allowedActions:[],closure:{reasonCode:'PICKUP_CANCELLED',reasonDetail:'No podré retirar',actor:business?'BUSINESS':'CUSTOMER',actorUserId:business?2:1,closedAt:'2026-10-25T06:00:00.000Z'}};
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({orderId:20,orderStatus:'cancelled',requestProcess:closed}))));
    expect((await sendAvailabilityAction(process,20,business,'CANCEL_PICKUP',{expectedVersion:4,reasonDetail:'No podré retirar'},'test-only',key)).requestProcess.agreementPublicId).toBe('agreement-test');
    expect(availabilityAllowed({...process,state:'READY'},business,'CANCEL_PICKUP')).toBe(false);
  });
  it('revokes only the actor own grant without changing the order state',async()=>{
    const process={...availabilityAccepted,allowedActions:['REVOKE_CONTACT_CONSENT' as const]};
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({orderId:20,orderStatus:'accepted',requestProcess:{...process,version:5,allowedActions:[]}}))));
    expect(availabilityAllowed(process,false,'REVOKE_CONTACT_CONSENT')).toBe(false);
    expect((await sendAvailabilityAction(process,20,true,'REVOKE_CONTACT_CONSENT',{expectedVersion:4},'test-only',key)).requestProcess.state).toBe('COORDINATION_PENDING');
  });
  it('accepts a negotiated pickup directly in progress with the same immutable plan',async()=>{
    const receipt={...availabilityAccepted,state:'IN_PROGRESS',availability:pickupPlan};
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({orderId:20,orderStatus:'accepted',requestProcess:receipt}))));
    expect((await sendProposalAction(7,20,'ACCEPT_PROPOSAL',{expectedVersion:2,proposalId:123,confirmationAccepted:true,customerContactPreference:{allowed:false,textVersion:'availability-customer-whatsapp-v1'}},'test-only',key,undefined,'AVAILABILITY_V1',31)).requestProcess.state).toBe('IN_PROGRESS');
    await expect(sendProposalAction(7,20,'ACCEPT_PROPOSAL',{expectedVersion:2,proposalId:123,confirmationAccepted:true},'test-only',key,undefined,'AVAILABILITY_V1',999)).rejects.toThrow('plan');
  });
  it('rejects a legacy creation response when the availability route was requested',async()=>{
    const payload={businessId:5,items:[{catalogItemId:5,quantity:1}],note:'',referencePhoto:null,needNow:true,deliveryDate:null,deliveryTime:null};
    const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({id:20,total:1000,items:[{id:1,orderId:20,catalogItemId:5,nameSnapshot:'Producto de prueba',unitPriceClpSnapshot:1000,quantity:1,subtotalClp:1000}],requestProcess:pendingProcess}),{status:201}));
    await expect(createOrder({url:'https://example.test/orders/availability-requests',token:'test-only',currentUserId:1,businessUserId:2,idempotencyKey:key,payload,expectedFlow:'AVAILABILITY_V1',fetchImpl:fetcher})).rejects.toThrow('flujo');
  });
});

import {afterEach,describe,it,expect,vi} from 'vitest';
import {normalizeRequestProcess} from './requestProcess';
import {normalizeReservationOffer,normalizeReservationFollowUp,processContractHeaders} from './reservationContract';
import {reservationInitial,reservationWaiting,reservationRequested,paidRequested,freeOffer,paidOffer} from './reservationFixtures';
import {normalizeAgreement} from './agreement';
import {agreementFixture,pendingProcess} from './requestProcessFixtures';
import {availabilityInitial} from './availabilityFixtures';
import {reservationAllowed,sendReservationAction,type ReservationBody} from './reservationApi';
import {createReservationIntents} from './reservationIntent';
import {AvailabilityError,sendAvailabilityAction} from './availabilityApi';
import {readReservationCapabilities} from './reservationCapabilities';
import {fulfillmentFromPlan} from './availabilityChoice';
import {coordinationAllowed,sendCoordination} from './coordinationApi';
import {processApiError} from './requestProcessErrors';
const key='123e4567-e89b-42d3-a456-426614174000';
afterEach(()=>vi.unstubAllGlobals());
const receipt=(p=paidRequested)=>({orderId:20,orderStatus:p.state==='CLOSED'?'cancelled':p.state==='READY'?'ready':'accepted',requestProcess:{id:p.id,state:p.state,version:p.version+1,currentProposalId:p.currentProposalId,agreementPublicId:p.agreementPublicId,flowContract:p.flowContract,availability:p.availability,allowedActions:[]}});
describe('Reservation V2 strict reads and compatibility',()=>{
  it.each([reservationInitial,reservationWaiting,reservationRequested,paidRequested])('reads valid V2 process %# without losing the variant',p=>{expect(normalizeRequestProcess(p)).toEqual(p);});
  it('does not infer V2 or accept reservation actions and offers on S2',()=>{
    expect(normalizeRequestProcess({...reservationRequested,flowContract:'AVAILABILITY_V1'})).toBeNull();
    expect(normalizeRequestProcess({...availabilityInitial,allowedActions:['CONFIRM_PICKUP_RESERVATION']})).toBeNull();
    expect(normalizeRequestProcess(pendingProcess)).toEqual(pendingProcess);
    expect(processContractHeaders(pendingProcess)).toEqual({});expect(processContractHeaders(reservationInitial)).toEqual({'X-Process-Contract':'availability-v2'});
  });
  it('rejects missing V2 pickup offers and incomplete requested reservation reads',()=>{
    expect(normalizeRequestProcess({...reservationWaiting,availability:{...reservationWaiting.availability,reservationOffer:undefined}})).toBeNull();
    expect(normalizeRequestProcess({...paidRequested,reservationFollowUp:undefined})).toBeNull();
    expect(normalizeRequestProcess({...reservationRequested,reservation:undefined})).toBeNull();
    expect(normalizeRequestProcess({...paidRequested,reservationChoice:{offerId:999,choice:'REQUEST_RESERVATION'}})).toBeNull();
  });
  it('accepts minimal mutation receipts without inventing following permissions or reservation state',()=>{
    const p=normalizeRequestProcess(receipt().requestProcess);expect(p).not.toBeNull();expect(p?.reservation).toBeUndefined();expect(p?.allowedActions).toEqual([]);
  });
  it('keeps only the actor own follow-up and whitelists declaration fields',()=>{
    const p=normalizeRequestProcess({...paidRequested,reservationFollowUp:{...paidRequested.reservationFollowUp,businessFollowUpClosedAt:'2026-10-25T21:00:00Z',phone:'private'},reservation:{...paidRequested.reservation,phone:'private'}});
    expect(JSON.stringify(p)).not.toContain('private');expect(JSON.stringify(p)).not.toContain('businessFollowUpClosedAt');
    expect(normalizeReservationFollowUp({ownFollowUpClosedAt:null,allowedActions:['UNKNOWN']})).toBeNull();
  });
  it('validates deadlines, deposit/full amounts, Unicode text and mode-specific fields',()=>{
    expect(normalizeReservationOffer(paidOffer,2000)).toEqual(paidOffer);
    expect(normalizeReservationOffer({...paidOffer,requiredAmountClp:2000},2000)).toBeNull();
    expect(normalizeReservationOffer({...paidOffer,paymentKind:'FULL',requiredAmountClp:2000},2000)?.mode).toBe('PREPAYMENT');
    expect(normalizeReservationOffer({...paidOffer,paymentDueAt:paidOffer.confirmationDueAt})).toBeNull();
    expect(normalizeReservationOffer({...freeOffer,requiredAmountClp:0})).toBeNull();
    expect(normalizeReservationOffer({...freeOffer,pickupBy:'2099-02-30T22:00:00Z'})).toBeNull();
    expect(normalizeReservationOffer({...paidOffer,paymentInstructions:'😀'.repeat(500)},2000)).not.toBeNull();
    expect(normalizeReservationOffer({...paidOffer,paymentInstructions:'😀'.repeat(501)},2000)).toBeNull();
  });
  it('retains the immutable choice in the agreement without using the old monetary reservation field',()=>{
    const a=normalizeAgreement({...agreementFixture,availability:reservationRequested.availability,reservationChoice:reservationRequested.reservationChoice});
    expect(a?.reservationChoice).toEqual(reservationRequested.reservationChoice);expect(a?.reservationAmountClp).toBeNull();
    expect(normalizeAgreement({...agreementFixture,reservationAmountClp:1000})).toBeNull();
    expect(fulfillmentFromPlan(paidRequested.availability)).toMatchObject({reservationOffer:paidOffer,path:'LOCAL_PICKUP',businessContactConsent:{accepted:true}});
  });
   it('requires confirmed reservation reads before enabling Listo without changing existing orders',()=>{
     expect(coordinationAllowed({...reservationRequested,allowedActions:['MARK_READY']},true,'MARK_READY')).toBe(false);
     expect(coordinationAllowed({...reservationRequested,reservation:{...reservationRequested.reservation!,effectiveStatus:'CONFIRMED'},allowedActions:['MARK_READY']},true,'MARK_READY')).toBe(true);
     expect(coordinationAllowed({...paidRequested,reservation:{...paidRequested.reservation!,effectiveStatus:'CONFIRMED'},allowedActions:['MARK_READY']},true,'MARK_READY')).toBe(false);
     expect(coordinationAllowed({...reservationRequested,reservationChoice:{offerId:31,choice:'NONE'},reservation:undefined,allowedActions:['MARK_READY']},true,'MARK_READY')).toBe(true);
     expect(coordinationAllowed({...reservationRequested,reservationChoice:undefined,reservation:undefined,allowedActions:['MARK_READY']},true,'MARK_READY')).toBe(false);
     expect(coordinationAllowed({...availabilityInitial,state:'IN_PROGRESS',agreementPublicId:'agreement',allowedActions:['MARK_READY']},true,'MARK_READY')).toBe(true);
   });
   it('suppresses ordinary WhatsApp in paid reservation without changing S2 coordination',()=>{
    expect(coordinationAllowed({...paidRequested,allowedActions:['OPEN_WHATSAPP']},false,'OPEN_WHATSAPP')).toBe(false);
    expect(coordinationAllowed({...availabilityInitial,state:'IN_PROGRESS',agreementPublicId:'agreement',allowedActions:['OPEN_WHATSAPP'],coordination:{customerContactAuthorized:true,businessContactAuthorized:true}},false,'OPEN_WHATSAPP')).toBe(true);
  });
});
describe('Reservation requests and recovery',()=>{
  it('reads the authenticated flag without treating a supported contract as activation',async()=>{
    const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({supportedContracts:['availability-v2'],reservationCreationEnabled:false})));vi.stubGlobal('fetch',fetcher);
    expect((await readReservationCapabilities('test-only')).reservationCreationEnabled).toBe(false);expect(fetcher.mock.calls[0][1].cache).toBe('no-store');
  });
  it('does not treat failed or malformed capability reads as enabled',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(new Response('{}',{status:401})).mockResolvedValueOnce(new Response(JSON.stringify({supportedContracts:[],reservationCreationEnabled:true}))));
    await expect(readReservationCapabilities('test-only')).rejects.toMatchObject({status:401});expect((await readReservationCapabilities('test-only')).reservationCreationEnabled).toBe(false);
  });
  it('adds the V2 header to the existing availability and coordination actions',async()=>{
    const fetcher=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({orderId:20,orderStatus:'pending',requestProcess:{...reservationWaiting,allowedActions:[]}}))).mockResolvedValueOnce(new Response(JSON.stringify({orderId:20,orderStatus:'ready',requestProcess:{...paidRequested,state:'READY',version:5,allowedActions:[]}})));vi.stubGlobal('fetch',fetcher);
    await sendAvailabilityAction(reservationInitial,20,true,'CONFIRM_AVAILABILITY',{expectedVersion:1,proposalId:123,fulfillment:fulfillmentFromPlan(reservationWaiting.availability)},'test-only',key);
    expect(fetcher.mock.calls[0][1].headers['X-Process-Contract']).toBe('availability-v2');
    await sendCoordination(7,20,'MARK_READY',{expectedVersion:4},'test-only',key,undefined,123,'AVAILABILITY_V2');expect(fetcher.mock.calls[1][1].headers['X-Process-Contract']).toBe('availability-v2');
  });
  it('confirms a paid reservation only as the business with exact declarations',async()=>{
    const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify(receipt())));vi.stubGlobal('fetch',fetcher);
    const body={expectedVersion:4,reservationId:801,entireOrderHeldDeclared:true as const,requiredPaymentReceivedDeclared:true as const};
    const result=await sendReservationAction(paidRequested,20,true,'CONFIRM_PICKUP_RESERVATION',body,'test-only',key);
    expect(result.receipt.requestProcess.version).toBe(5);expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual(body);expect(fetcher.mock.calls[0][1].headers['X-Process-Contract']).toBe('availability-v2');
    expect(reservationAllowed(paidRequested,false,'CONFIRM_PICKUP_RESERVATION')).toBe(false);
  });
  it('uses dedicated paid follow-up actions after cancellation without reopening the order',async()=>{
    const closed={...paidRequested,state:'CLOSED',allowedActions:[],closure:{reasonCode:'PICKUP_CANCELLED' as const,reasonDetail:'Cancelado por prueba',actor:'CUSTOMER' as const,actorUserId:1,closedAt:'2026-10-25T21:00:00Z'}};
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({result:receipt(closed),navigation:{url:'https://wa.me/56900000000?text=Reserva'}}))));
    const response=await sendReservationAction(closed,20,false,'OPEN_RESERVATION_WHATSAPP',{expectedVersion:4,reservationId:801,purpose:'CLARIFICATION'},'test-only',key);
    expect(response.receipt.requestProcess.state).toBe('CLOSED');expect(response.receipt.orderStatus).toBe('cancelled');expect(response.navigation).toMatch(/^https:\/\/wa.me\//);
    expect(reservationAllowed({...closed,reservationFollowUp:{ownFollowUpClosedAt:null,allowedActions:[]}},false,'OPEN_RESERVATION_WHATSAPP')).toBe(false);
  });
  it.each(['version','agreementPublicId','state'] as const)('rejects an unverifiable %s without manufacturing a success',async field=>{
    const response=receipt();(response.requestProcess as Record<string,unknown>)[field]=field==='version'?99:field==='state'?'READY':'wrong';
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify(response))));
    await expect(sendReservationAction(paidRequested,20,true,'CONFIRM_PICKUP_RESERVATION',{expectedVersion:4,reservationId:801,entireOrderHeldDeclared:true,requiredPaymentReceivedDeclared:true},'test-only',key)).rejects.toThrow('No se pudo verificar');
  });
  it('retains uncertain bodies and keys and never repeats a confirmed mutation',async()=>{
    const map=new Map<string,string>(),storage={getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{map.set(k,v);},removeItem:(k:string)=>{map.delete(k);}};
    const intentions=createReservationIntents(storage,()=>key),body:ReservationBody={expectedVersion:4,reservationId:801,reasonDetail:'No puedo apartar el pedido'};
    const send=vi.fn().mockRejectedValueOnce(new TypeError('network')).mockResolvedValue(receipt());
    await expect(intentions.run('test',7,'REPORT_RESERVATION_ISSUE',body,send)).rejects.toThrow();
    await expect(intentions.run('test',7,'REPORT_RESERVATION_ISSUE',{...body,reasonDetail:'Otro motivo'},send)).rejects.toThrow('operación pendiente');
    await intentions.run('test',7,'REPORT_RESERVATION_ISSUE',body,send);await intentions.run('test',7,'REPORT_RESERVATION_ISSUE',body,send);expect(send).toHaveBeenCalledTimes(2);expect(send.mock.calls[0][0]).toBe(send.mock.calls[1][0]);expect([...map.values()].join('')).not.toContain(body.reasonDetail);
    const restored=createReservationIntents(storage,()=>key);await expect(restored.run('test',7,'REPORT_RESERVATION_ISSUE',body,send)).rejects.toThrow('ya está confirmada');await restored.reconcile('test',7,5);expect(map.size).toBe(0);
  });
  it('does not release a restored uncertain key on an unrelated validation error',async()=>{
    const map=new Map<string,string>(),storage={getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{map.set(k,v);},removeItem:(k:string)=>{map.delete(k);}},body={expectedVersion:4,reservationId:801,confirmationAccepted:true as const};
    await expect(createReservationIntents(storage,()=>key).run('test',7,'FINISH_OWN_RESERVATION_FOLLOW_UP',body,async()=>{throw new TypeError();})).rejects.toThrow();
    await expect(createReservationIntents(storage,()=>key).run('test',7,'FINISH_OWN_RESERVATION_FOLLOW_UP',body,async()=>{throw new AvailabilityError('Invalid',400);})).rejects.toThrow();expect(map.size).toBe(1);
  });
  it('requires storage protection before sending and provides safe reservation conflict copy',async()=>{
    const send=vi.fn();await expect(createReservationIntents({getItem:()=>null,setItem:()=>{throw Error();},removeItem:()=>undefined},()=>key).run('test',7,'FINISH_OWN_RESERVATION_FOLLOW_UP',{expectedVersion:4,reservationId:801,confirmationAccepted:true},send)).rejects.toThrow('No enviamos');expect(send).not.toHaveBeenCalled();
    expect(processApiError(409,{code:'RESERVATION_NOT_CONFIRMED'}).message).toContain('antes de marcar Listo');
  });
});

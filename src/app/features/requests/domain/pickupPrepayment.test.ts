import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {PICKUP_PREPAYMENT_CONTRACT,PREPAYMENT_WAITING_MESSAGE,PREPAYMENT_PHASES,normalizePickupPrepayment,pickupPrepaymentFor,rememberPickupPrepaymentCapability,type PickupPrepayment} from './pickupPrepayment';
import {simplePaidPending,simpleReserved} from '../fixtures/simplifiedReservationFixtures';
import {normalizeRequestProcess,type RequestProcessSummary} from './requestProcess';
import {statusViewFor,countStatusViews,filterByStatusView} from './requestStatusGrouping';

let token='prepayment-test';
const capability={pickupPrepaymentStage:{contract:PICKUP_PREPAYMENT_CONTRACT,enabled:true}};
function projection(phase:PickupPrepayment['phase']='AWAITING_PAYMENT_AND_HOLD'):PickupPrepayment{
  const ready=phase==='READY_FOR_PREPARATION';
  return {contract:PICKUP_PREPAYMENT_CONTRACT,phase,reservationId:801,requiredAmountClp:1000,
    businessCategory:ready?'IN_PROGRESS':'WAITING_RESPONSE',customerCategory:ready?'IN_PROGRESS':'AWAITING_BUSINESS',
    customerMessage:ready?null:PREPAYMENT_WAITING_MESSAGE,canConfirmPaymentAndHold:!ready};
}
const pending=(phase?:PickupPrepayment['phase']):RequestProcessSummary=>({...simplePaidPending,pickupPrepayment:projection(phase)});
beforeEach(()=>{token='prepayment-test';vi.stubGlobal('localStorage',{getItem:()=>token});rememberPickupPrepaymentCapability(token,capability);});
afterEach(()=>vi.unstubAllGlobals());
it.each(PREPAYMENT_PHASES)('maps server phase %s consistently for list, counts and filters',phase=>{
  const process=pending(phase),ready=phase==='READY_FOR_PREPARATION';
  expect(normalizePickupPrepayment(projection(phase))).toEqual(projection(phase));
  expect(statusViewFor('orders','accepted',process,false,true)).toBe(ready?'active':'waiting');
  expect(statusViewFor('orders','accepted',process,false,false)).toBe(ready?'active':'awaiting-business');
  const rows=[{status:'accepted',requestProcess:process}];
  expect(countStatusViews(rows,'orders',false)[ready?'active':'awaiting-business']).toBe(1);
  expect(filterByStatusView(rows,'orders',ready?'active':'waiting','all',undefined,true)).toHaveLength(1);
});
it('preserves the additive projection through the real process normalizer and accepts old receipts without it',()=>{
  expect(normalizeRequestProcess(pending())?.pickupPrepayment).toEqual(projection());
  expect(normalizeRequestProcess(simplePaidPending)).not.toBeNull();
  expect(normalizeRequestProcess({...pending(),pickupPrepayment:{...projection(),reservationId:99}})).toBeNull();
});
it('ignores unknown contracts and rejects malformed recognized fields',()=>{
  expect(normalizePickupPrepayment({...projection(),contract:'future'})).toBeUndefined();
  for(const extra of [{phase:'OTHER'},{requiredAmountClp:-1},{reservationId:0},{customerCategory:'IN_PROGRESS'},{canConfirmPaymentAndHold:'true'},{customerMessage:'Invented'}]){
    expect(normalizePickupPrepayment({...projection(),...extra})).toBeNull();
  }
});
it('keeps legacy grouping when capability is missing, disabled, unknown or belongs to another session',()=>{
  for(const body of [{},{pickupPrepaymentStage:{contract:PICKUP_PREPAYMENT_CONTRACT,enabled:false}},{pickupPrepaymentStage:{contract:'future',enabled:true}}]){
    rememberPickupPrepaymentCapability(token,body);
    expect(pickupPrepaymentFor(pending())).toBeUndefined();
    expect(statusViewFor('orders','accepted',pending(),false,true)).toBe('active');
  }
  rememberPickupPrepaymentCapability(token,capability);token='other';
  expect(pickupPrepaymentFor(pending())).toBeUndefined();
});
it('does not project into other modalities, free reservations, terminal states, receipt or closure',()=>{
  expect(pickupPrepaymentFor({...simpleReserved,pickupPrepayment:projection()})).toBeUndefined();
  for(const extra of [{state:'READY'},{state:'CLOSED'},{availability:{...simplePaidPending.availability!,path:'WHATSAPP'}},{reservationChoice:{...simplePaidPending.reservationChoice!,choice:'NONE'}},{businessClosure:{}},{customerReceipt:{}},{localPickupInformation:{}}]){
    expect(pickupPrepaymentFor({...pending(),...extra} as RequestProcessSummary)).toBeUndefined();
  }
});

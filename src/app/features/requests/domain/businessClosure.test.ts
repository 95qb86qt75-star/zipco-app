import {describe,it,expect} from 'vitest';
import { BUSINESS_CLOSURE_CONTRACT, normalizeBusinessClosure, normalizeClosureOptions, validClosureDetail } from './businessClosure';
import {normalizeRequestProcess} from './requestProcess';
import {statusViewFor,countStatusViews} from './requestStatusGrouping';
import {coordinationProcess} from '../fixtures/requestProcessFixtures';
import {paidRequested} from '../fixtures/reservationFixtures';
import {declaredClosure} from '../fixtures/businessClosureFixtures';
describe('business closure reads and role categories',()=>{
 it('reads legacy product with an explicit delivery without customer receipt',()=>{
  const p=normalizeRequestProcess({...coordinationProcess,state:'READY',version:3,businessClosure:declaredClosure});
  expect(p?.businessClosure).toEqual(declaredClosure);
  expect(statusViewFor('orders','ready',p,false,true)).toBe('history');
  expect(statusViewFor('orders','ready',p,false,false)).toBe('active');
  expect(countStatusViews([{status:'ready',requestProcess:p}],'orders',true)).toMatchObject({history:1,ready:0,active:0});
 });
 it('both roles have history only after client finalization',()=>{
  const p=normalizeRequestProcess({...coordinationProcess,state:'COMPLETED',version:4,businessClosure:{...declaredClosure,customerCategory:'HISTORY'}});
  expect(p).not.toBeNull();for(const business of [true,false])expect(statusViewFor('orders','completed',p,false,business)).toBe('history');
 });
 it('closes both roles and preserves structured reason and agreement',()=>{
  const c={...declaredClosure,status:'CLOSED_WITHOUT_DELIVERY',customerCategory:'HISTORY',reasonCode:'OTHER',reasonDetail:'No se pudo concretar.'};
  const p=normalizeRequestProcess({...coordinationProcess,state:'CLOSED',version:3,businessClosure:c,
   closure:{reasonCode:'BUSINESS_CLOSED_WITHOUT_DELIVERY',reasonDetail:c.reasonDetail,actor:'BUSINESS',actorUserId:2,closedAt:c.declaredAt}});
  expect(p?.businessClosure?.reasonCode).toBe('OTHER');
  for(const business of [true,false])expect(statusViewFor('orders','cancelled',p,false,business)).toBe('history');
 });
 it.each(['IN_PROGRESS','CLOSED','AWAITING_BUSINESS_RESPONSE'])('rejects delivery in %s',state=>expect(normalizeBusinessClosure(declaredClosure,state)).toBeNull());
 it.each([{customerCategory:'HISTORY'},{eventId:0},{operationRef:'bad'},{actor:'CUSTOMER'},{reasonCode:'OTHER'},{declaredAt:'yesterday'}])('fails closed on malformed summary %o',patch=>expect(normalizeBusinessClosure({...declaredClosure,...patch},'READY')).toBeNull());
 it('validates reasons and reservation targets without granting permissions',()=>{
  expect(validClosureDetail('OTHER','  hi')).toBe(false);expect(validClosureDetail('OTHER','Hola')).toBe(true);
  expect(validClosureDetail('OTHER','bad\u0000text')).toBe(false);expect(validClosureDetail('OTHER','Dos\nlíneas')).toBe(true);expect(validClosureDetail('AGREED_NOT_TO_PROCEED','no')).toBe(false);
  expect(normalizeClosureOptions({deliveryBlock:{code:'BUSINESS_DELIVERY_RESERVATION_BLOCKED',cause:'RESERVATION_CONFIRMATION_REQUIRED',reservationId:123,target:'RESERVATION_DETAILS'},reasonCodes:['OTHER']})).toBeTruthy();
  expect(normalizeClosureOptions({deliveryBlock:null,reasonCodes:['invented']})).toBeNull();
 });
 it('retains old READY category without adoption',()=>expect(statusViewFor('orders','ready',{...coordinationProcess,state:'READY'},false,true)).toBe('ready'));
 it('preserves paid reservation evidence and follow-up actions in closed history',()=>{
  const c={...declaredClosure,status:'CLOSED_WITHOUT_DELIVERY',customerCategory:'HISTORY',reasonCode:'AGREED_NOT_TO_PROCEED',reasonDetail:null};
  const payment={actorUserId:2,declaredAt:'2026-10-25T20:05:00Z',amountClp:1000};
  const p=normalizeRequestProcess({...paidRequested,state:'CLOSED',version:9,businessClosure:c,allowedActions:[],
    reservation:{...paidRequested.reservation!,confirmedAt:payment.declaredAt,confirmedByUserId:2,paymentReceiptDeclaration:payment,status:'NEEDS_CLARIFICATION',effectiveStatus:'NEEDS_CLARIFICATION'}});
  expect(p?.reservationFollowUp?.allowedActions).toContain('REPORT_RESERVATION_ISSUE');
  expect(p?.reservation?.effectiveStatus).toBe('NEEDS_CLARIFICATION');
  expect(p?.reservation?.paymentReceiptDeclaration).toEqual(payment);
  expect(statusViewFor('orders','cancelled',p,false,true)).toBe('history');
 });
});

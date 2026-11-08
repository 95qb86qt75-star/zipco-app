import * as React from 'react';
import {describe,expect,it,vi} from 'vitest';
import CustomerReceiptFlowCardView from './CustomerReceiptFlowCardView';
import type {CustomerReceiptFlowCardModel} from './application/useCustomerReceiptFlowCardController';

// Inspect the composition boundary without mounting the controllers or sending actions.
const noop=vi.fn();
function compose({pickup=true,state='IN_PROGRESS',mode='FREE',status='CONFIRMED',advisory=true,ready=false}={}){
 const model={pickup,accepted:{subjectSnapshot:{items:[]}},operation:{busy:false},
  process:{state,...(mode==='NONE'?{reservationChoice:{choice:'NONE'}}:{reservation:{mode,effectiveStatus:status}}),availability:{reservationOffer:{mode,simplified:advisory?{hoursPolicy:'ADVISORY_ONLY'}:{}}},allowedActions:[]},
  order:{id:20},model:ready?{stage:'ready'}:undefined,setSheet:noop,setExpanded:noop,
 } as unknown as CustomerReceiptFlowCardModel;
 const root=CustomerReceiptFlowCardView({model});
 return root.props.children[0];
}
describe('confirmed free pickup composition',()=>{
 it('connects the same server-derived variant to the card and its detail',()=>{
  const card=compose();expect(card.props.confirmedFreeDesign).toBe(true);
  const details=card.props.children.props.render(null);
  expect(details.props.confirmedFreeDesign).toBe(true);
  expect(details.props.lineDesign).toBe(false);
 });
 it.each([
  {mode:'PREPAYMENT',status:'AWAITING_BUSINESS_CONFIRMATION'},
  {status:'CANCELLED'}, {state:'READY'}, {state:'CLOSED'},
  {advisory:false}, {ready:true},
 ])('excludes other reservation/stage combinations: %j',options=>{
  expect(compose(options).props.confirmedFreeDesign).toBe(false);
 });
 it('retains the payment-pending variant and WhatsApp composition',()=>{
  expect(compose({mode:'PREPAYMENT',status:'AWAITING_BUSINESS_CONFIRMATION'}).props.lineDesign).toBe(true);
  expect(compose({pickup:false}).props.confirmedFreeDesign).toBeUndefined();
 });
 it('reuses the ticket layout only for explicit no-reservation pickup',()=>{
  const card=compose({mode:'NONE'});
  expect(card.props.arrivalDesign).toBe(true);
  expect(card.props.confirmedFreeDesign).toBe(false);
  expect(card.props.children.props.render(null).props.arrivalDesign).toBe(true);
  expect(compose().props.arrivalDesign).toBe(false);
  expect(compose({mode:'NONE',ready:true}).props.arrivalDesign).toBe(false);
  expect(compose({mode:'NONE',state:'READY'}).props.arrivalDesign).toBe(false);
  expect(compose({mode:'NONE',pickup:false}).props.arrivalDesign).toBeUndefined();
 });
});

import {describe,it,expect} from 'vitest';
import {normalizeProductPreview} from './productPreview';
import {normalizeRequestProcess} from './requestProcess';
import {normalizeProposals} from './proposalContract';
import {normalizeAgreement} from './agreement';
import {pendingProcess,agreementFixture} from './requestProcessFixtures';
import {proposalsFixture} from './proposalFixtures';

const image='https://res.cloudinary.com/fixture/image/upload/v1/product.jpg';
const preview=(proposalId=123)=>({contract:'order-product-preview-v1',proposalId,items:[{lineIndex:0,catalogItemId:8,source:'CATALOG',name:'Pan',description:'Pan de masa madre',imageUrl:image,quantity:3,unitPriceClp:4000,subtotalClp:12000}]});
const fromSnapshot=(proposalId:number,items:readonly Record<string,unknown>[])=>({contract:'order-product-preview-v1',proposalId,items:items.map((item,lineIndex)=>({lineIndex,catalogItemId:item.catalogItemId,source:item.source??'CATALOG',name:item.nameSnapshot,description:item.descriptionSnapshot,imageUrl:item.source==='CUSTOM'?null:image,quantity:item.quantity,unitPriceClp:item.unitPriceClpSnapshot,subtotalClp:item.subtotalClp}))});

describe('product preview optional contract',()=>{
 it('preserves the unit price separately from quantity and line subtotal',()=>{
  const normalized=normalizeProductPreview(preview(),123)!;
  expect(normalized.items[0]).toMatchObject({quantity:3,unitPriceClp:4000,subtotalClp:12000,imageUrl:image});
 });
 it.each([null,{}, {contract:'another'}, {...preview(),proposalId:999}, {...preview(),items:[]}, {...preview(),items:[{...preview().items[0],lineIndex:1}]}, {...preview(),items:[{...preview().items[0],subtotalClp:13000}]}])('omits invalid visuals without blocking the process: %j',raw=>{
  const process=normalizeRequestProcess({...pendingProcess,productPreview:raw})!;
  expect(process).toBeTruthy();expect(process.productPreview).toBeUndefined();expect(process.allowedActions).toEqual(pendingProcess.allowedActions);
 });
 it('drops unsafe images but keeps the text and original prices',()=>{
  const raw=preview();raw.items[0].imageUrl='javascript:alert(1)';
  expect(normalizeProductPreview(raw,123)?.items[0]).toMatchObject({imageUrl:null,unitPriceClp:4000,name:'Pan'});
 });
 it('never inherits an image or derives a unit price for a custom product',()=>{
  const raw={...preview(),items:[{...preview().items[0],source:'CUSTOM',catalogItemId:null,unitPriceClp:null,imageUrl:image,subtotalClp:12500}]};
  expect(normalizeProductPreview(raw,123)?.items[0]).toMatchObject({imageUrl:null,unitPriceClp:null,subtotalClp:12500});
 });
 it('keeps current and original previews separate and rejects a current-id mismatch',()=>{
  const current=preview(124),original=preview(123);
  const p=normalizeRequestProcess({...pendingProcess,currentProposalId:124,productPreview:current,requestedProductPreview:original})!;
  expect(p.productPreview?.proposalId).toBe(124);expect(p.requestedProductPreview?.proposalId).toBe(123);
  expect(normalizeRequestProcess({...pendingProcess,productPreview:current})?.productPreview).toBeUndefined();
 });
 it('keeps each proposal preview tied to its own immutable text and prices',()=>{
  const raw=proposalsFixture(1);
  for(const p of raw.proposals)Object.assign(p,{productPreview:fromSnapshot(p.id,p.subjectSnapshot.items)});
  const read=normalizeProposals(raw,raw.process.id)!;
  expect(read.proposals.map(p=>p.productPreview?.proposalId)).toEqual([123,124]);
  expect(read.proposals.map(p=>p.productPreview?.items[0].unitPriceClp)).toEqual([1000,1500]);
  Object.assign(raw.proposals[1],{productPreview:fromSnapshot(123,raw.proposals[0].subjectSnapshot.items)});
  const mismatch=normalizeProposals(raw,raw.process.id)!;
  expect(mismatch.proposals[1].productPreview).toBeUndefined();expect(mismatch.process.allowedActions).toEqual(raw.process.allowedActions);
 });
 it('ignores a preview whose text disagrees with its proposal snapshot',()=>{
  const raw=proposalsFixture(1),p=raw.proposals[1],visual=fromSnapshot(p.id,p.subjectSnapshot.items);visual.items[0].name='Wrong product';Object.assign(p,{productPreview:visual});
  expect(normalizeProposals(raw,raw.process.id)?.proposals[1].productPreview).toBeUndefined();
 });
 it('takes the accepted preview from acceptedProposalId and keeps old agreements valid',()=>{
  const raw={...agreementFixture,productPreview:fromSnapshot(agreementFixture.acceptedProposalId,agreementFixture.subjectSnapshot.items)};
  expect(normalizeAgreement(raw)?.productPreview?.proposalId).toBe(agreementFixture.acceptedProposalId);
  raw.productPreview.proposalId=999;expect(normalizeAgreement(raw)?.productPreview).toBeUndefined();expect(normalizeAgreement(agreementFixture)).toBeTruthy();
 });
 it('omits contradictory summary prices without disabling the proposal',()=>{
  const raw=proposalsFixture(1).process;
  const p=normalizeRequestProcess({...raw,productPreview:preview(raw.currentProposalId)})!;
  expect(p.productPreview).toBeUndefined();expect(p.state).toBe(raw.state);
 });
 it('retains line identity and individual unit prices for a multi-product preview',()=>{
  const raw=preview();raw.items.push({...raw.items[0],lineIndex:1,catalogItemId:9,name:'Otro pan',quantity:2,unitPriceClp:2500,subtotalClp:5000});
  expect(normalizeProductPreview(raw,123)?.items.map(item=>[item.lineIndex,item.unitPriceClp,item.subtotalClp])).toEqual([[0,4000,12000],[1,2500,5000]]);
 });
});

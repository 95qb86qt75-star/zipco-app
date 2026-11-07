import {participantHeaders} from '/src/app/features/requests/api/participantContractHeaders';
import {lateProcess} from '/src/app/features/requests/fixtures/lateInitialFixtures';
// @ts-nocheck
// Explicit fixture preserving the checkout/status adapter and short-list geometry.
// @ts-nocheck
// Explicit fixture preserving the checkout/status adapter and short-list geometry.
import StatusToast from "/src/app/features/requests/shared/feedback/StatusToast.tsx";
import { StatusChangeHost, useStatusChangeRecords } from "/src/app/features/requests/shared/feedback/StatusChangeFlow.tsx";
import { statusViewFor, countStatusViews } from "/src/app/features/requests/domain/requestStatusGrouping.ts";

import React,{useState,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import ProcessOrderCard from "/src/app/features/requests/cards/shared/layout/ProcessOrderCard.tsx";
import CheckoutScreen from "/src/app/features/checkout/product/CheckoutScreen.tsx";
import { normalizeMyOrdersPayload, normalizeBusinessOrdersPayload } from "/src/app/features/requests/domain/orderNormalization.ts";
import { availabilityInitial, pickupPlan, whatsappPlan } from "/src/app/features/requests/fixtures/availabilityFixtures.ts";
import { agreementFixture } from "/src/app/features/requests/fixtures/requestProcessFixtures.ts";
import ProcessHistoryCard from "/src/app/features/requests/cards/shared/history/ProcessHistoryCard.tsx";
import ActionHologramHost, { dismissAction } from "/src/app/features/requests/shared/feedback/ActionHologram.tsx";
import '/src/styles/index.css';
import {freeOffer,paidOffer,freeReservation} from '/src/app/features/requests/fixtures/reservationFixtures';
import {simpleFree,simplePaid,simpleReserved,simplePaidPending} from '/src/app/features/requests/fixtures/simplifiedReservationFixtures';
window.flowCalls=[]; window.testDriverReady=false;
const fixtureParams=new URLSearchParams(location.search),availableDesign=fixtureParams.has('available-design');
const informationScenario=fixtureParams.get('information');
const lateScenario=fixtureParams.get('late-query');
localStorage.setItem('zipco-token','customer-test-only');
localStorage.setItem('zipco-user-id','1');
sessionStorage.clear();
let state={...availabilityInitial,productPreview:{contract:'order-product-preview-v1',proposalId:123,items:[{lineIndex:0,catalogItemId:5,source:'CATALOG',name:'Producto QA',description:'Producto de prueba',quantity:1,unitPriceClp:12000,subtotalClp:12000,imageUrl:null}]},allowedActions:[],coordination:{customerContactAuthorized:false,businessContactAuthorized:false}};
let status='pending',plan=null,proposals=[];
let raw={id:20,businessId:5,customerName:'Cliente QA',businessName:'ZIPCO Negocio QA',products:[{name:'Producto QA',quantity:1,price:12000}],total:12000,createdAt:'2026-10-25T05:00:00.000Z',needNow:true,note:'Hola necesito esto de prueba',referencePhoto:null,deliveryDate:null,deliveryTime:null};
if(availableDesign&&fixtureParams.has('reference-photo'))raw.referencePhoto=location.origin+'/icon-192.png';
function processFor(business,receipt=false){
 if(lateScenario){const p={...state,allowedActions:fixtureParams.has('no-answer')?[]:lateProcess(state.lateInitialResponse.status,business).allowedActions};return receipt?{...p,allowedActions:[]}:p;}
 const actions=state.state==='AWAITING_BUSINESS_RESPONSE'?(business?['CONFIRM_AVAILABILITY','REJECT_PENDING_REQUEST','PROPOSE_ALTERNATIVE']:['CANCEL_PENDING_REQUEST'])
  :state.state==='AWAITING_CUSTOMER_CONTINUATION'?(business?['WITHDRAW_AVAILABILITY']:['CONTINUE_REQUEST','DECLINE_REQUEST'])
  :state.state==='AWAITING_CUSTOMER_DECISION'||state.state==='AWAITING_CUSTOMER_FINAL_DECISION'?(business?[]:['ACCEPT_PROPOSAL','REJECT_PROPOSAL',...(state.state==='AWAITING_CUSTOMER_DECISION'?['COUNTER_PROPOSAL']:[])])
  :state.state==='AWAITING_BUSINESS_COUNTER_RESPONSE'?(business?['ACCEPT_COUNTER_PROPOSAL','REJECT_COUNTER_PROPOSAL','PROPOSE_FINAL']:[])
  :state.state==='IN_PROGRESS'?(business?['MARK_READY',...(plan.path==='LOCAL_PICKUP'?['CANCEL_PICKUP']:[])]:plan.path==='LOCAL_PICKUP'?['CANCEL_PICKUP']:[])
  :state.state==='READY'?(business?[]:['ACK_READY_NOTICE']):[];
 const informationActions=state.localPickupInformation?.status==='AWAITING_CUSTOMER_DECISION'?(business?['WITHDRAW_AVAILABILITY']:['CONTINUE_REQUEST','DECLINE_REQUEST']):state.localPickupInformation?.status==='AWAITING_CUSTOMER_ACK'&&!business?['ACK_LOCAL_PICKUP_INFORMATION']:[];
 return {...state,...(plan?{availability:plan}:{}),allowedActions:receipt?[]:state.localPickupInformation?informationActions:actions};
}
function orderFor(business){return {...raw,status,requestProcess:processFor(business)};}
const subject={orderType:'product',items:[{catalogItemId:5,nameSnapshot:'Producto QA',descriptionSnapshot:'Producto de prueba',quantity:1,unitPriceClpSnapshot:12000,subtotalClp:12000}],needNow:true,note:raw.note,referencePhoto:null};
proposals=[{id:123,sequence:0,type:'ORIGINAL_REQUEST',authorActor:'CUSTOMER',authorUserId:1,createdAt:raw.createdAt,subjectSchemaVersion:1,subjectSnapshot:subject,totalPriceClp:12000,scheduledFor:null,reservationAmountClp:null}];
if(availableDesign){plan=fixtureParams.has('pickup')?pickupPlan:whatsappPlan;state={...state,state:'AWAITING_CUSTOMER_CONTINUATION',version:2};proposals[0]={...proposals[0],availability:plan};}
const reservationVariant=availableDesign?fixtureParams.get('reservation'):null;
if(reservationVariant){
 const simple=reservationVariant.startsWith('simple')||reservationVariant==='none',paid=reservationVariant.endsWith('paid');
 let offer=reservationVariant==='none'?{mode:'NONE'}:simple?paid?simplePaid:simpleFree:paid?paidOffer:freeOffer;
 if(reservationVariant.includes('advisory'))offer={...offer,simplified:{...offer.simplified,hoursPolicy:'ADVISORY_ONLY',opensAt:null,closesAt:null,holdMinutes:null,scheduledFor:null}};
 plan={...pickupPlan,reservationOffer:offer,allowCustomerWhatsapp:!fixtureParams.has('no-contact'),...(fixtureParams.has('no-message')?{customerMessage:'',scheduleOrAddress:null}:{})};
 state={...state,flowContract:simple?'AVAILABILITY_V3':'AVAILABILITY_V2',serverNow:new Date().toISOString()};proposals[0]={...proposals[0],availability:plan};
}
if(informationScenario){
 state={...state,flowContract:'AVAILABILITY_V3'};
 plan={...pickupPlan,reservationOffer:{mode:'NONE'}};proposals[0]={...proposals[0],availability:plan};
 const information={contract:'local-pickup-information-v1',status:'AWAITING_CUSTOMER_DECISION',availabilityConfirmationId:31,informedAt:'2026-11-04T04:00:00.000Z',acknowledgementId:null,acknowledgedAt:null};
 if(informationScenario==='initial'){state={...state,state:'AWAITING_BUSINESS_RESPONSE',version:1};plan=null;proposals[0]={...proposals[0],availability:undefined};}
 else state={...state,localPickupInformation:information};
 if(informationScenario==='active'){state={...state,state:'IN_PROGRESS',version:4,agreementPublicId:'agreement-test',reservationChoice:{offerId:31,choice:'NONE',noReservationAcknowledged:true},localPickupInformation:{...information,status:'AWAITING_CUSTOMER_ACK'}};status='accepted';}
}
if(lateScenario){
 state={...lateProcess(lateScenario==='still'?'STILL_NEEDED':'AWAITING_CUSTOMER',false),productPreview:state.productPreview};plan=null;
 raw={...raw,needNow:false,deliveryDate:'2026-10-26',deliveryTime:'17:45'};
 if(lateScenario==='long'){raw.businessName='Negocio de nombre extenso para comprobar la tarjeta del cliente';raw.products=[1,2,3].map((quantity,index)=>({name:'Producto de nombre largo '+index,quantity,price:1000}));raw.total=6000;state.productPreview={...state.productPreview,items:raw.products.map((item,lineIndex)=>({lineIndex,catalogItemId:5+lineIndex,source:'CATALOG',name:item.name,description:'Descripción de prueba',quantity:item.quantity,unitPriceClp:item.price,subtotalClp:item.price*item.quantity,imageUrl:location.origin+'/icon-192.png'}))};}
}
let informationVisibleOrders=informationScenario?{customer:structuredClone(orderFor(false)),business:structuredClone(orderFor(true))}:null;
window.fetch=async (url,init)=>{
 if(String(url).endsWith('/request-process-capabilities'))return new Response(JSON.stringify({supportedContracts:['availability-v1','availability-v2'],reservationCreationEnabled:false,...(informationScenario?{localPickupInformation:{contract:'local-pickup-information-v1',enabled:true,creationEnabled:false}}:{})}));
 const body=init?.body?JSON.parse(init.body):null,business=String(init?.headers?.Authorization).includes('business-test-only');
 window.flowCalls.push({url:String(url),method:init?.method??'GET',body});
 const json=(v,status=200)=>new Response(JSON.stringify(v),{status});
 if(String(url).endsWith('/orders/availability-requests')){
  if(!body.customerContactPreference)throw Error('Preference required');
  state={...state,customerContactPreference:{...body.customerContactPreference,recordedAt:'2026-10-25T05:00:00.000Z',effective:false,requiresReconfirmation:false}};
  return json({...orderFor(false),items:[{id:1,orderId:20,catalogItemId:5,nameSnapshot:'Producto QA',unitPriceClpSnapshot:12000,quantity:1,subtotalClp:12000}]},201);
 }
 if((init?.method??'GET')==='GET'){
  if(!String(url).includes('processContract=availability-v3'))throw Error('Missing S2 read opt-in');
  if(String(url).includes('/reservation-options'))return json({serverNow:new Date().toISOString(),version:state.version,offerId:31,reservationOffer:plan.reservationOffer,...(plan.reservationOffer.mode!=='NONE'?{previewTiming:{holdStartsAt:'2099-10-25T14:00:00Z',pickupBy:plan.reservationOffer.simplified?.hoursPolicy==='ADVISORY_ONLY'?null:'2099-10-25T14:30:00Z',paymentDueAt:plan.reservationOffer.mode==='PREPAYMENT'&&plan.reservationOffer.simplified?.hoursPolicy!=='ADVISORY_ONLY'?'2099-10-25T14:15:00Z':null}}:{})});
  if(String(url).includes('/orders/')){if(informationScenario)informationVisibleOrders={customer:structuredClone(orderFor(false)),business:structuredClone(orderFor(true))};return json([orderFor(business)]);}
  if(String(url).includes('/agreement')){const latest=proposals.at(-1);return json({...agreementFixture,totalPriceClp:latest.totalPriceClp,acceptedProposalId:latest.id,subjectSchemaVersion:latest.subjectSchemaVersion,scheduledFor:null,subjectSnapshot:latest.subjectSnapshot,availability:plan});}
  if(String(url).includes('/proposals'))return json({process:processFor(business),proposals});
 }
 const action=String(url).split('/actions/')[1];
 if(body.expectedVersion!==state.version)return json({code:'STALE_VERSION'},409);
 if(lateScenario&&['confirm-late-request-need','decline-late-request-need'].includes(action)){
  if(business||body.queryId!==42)return json({code:'INCOMPATIBLE_STATE'},409);
  state={...lateProcess(action==='confirm-late-request-need'?'STILL_NEEDED':'NO_LONGER_NEEDED',false),productPreview:state.productPreview};status=action==='confirm-late-request-need'?'pending':'cancelled';
  return json({orderId:20,orderStatus:status,requestProcess:processFor(business,true)});
 }
 if(action==='confirm-availability'){
  const f=body.fulfillment;
  plan={...(f.path==='LOCAL_PICKUP'?pickupPlan:whatsappPlan),customerMessage:f.path==='LOCAL_PICKUP'?f.customerMessage||pickupPlan.customerMessage:null,scheduleOrAddress:f.path==='LOCAL_PICKUP'?f.scheduleOrAddress||null:null,allowCustomerWhatsapp:f.path==='WHATSAPP'||f.allowCustomerWhatsapp===true};
  state={...state,state:'AWAITING_CUSTOMER_CONTINUATION',version:2};
  if(informationScenario&&plan.path==='LOCAL_PICKUP'&&f.reservationOffer?.mode==='NONE'){plan={...plan,reservationOffer:{mode:'NONE'}};state={...state,localPickupInformation:{contract:'local-pickup-information-v1',status:'AWAITING_CUSTOMER_DECISION',availabilityConfirmationId:31,informedAt:'2026-11-04T04:00:00.000Z',acknowledgementId:null,acknowledgedAt:null}};}
  proposals[0]={...proposals[0],availability:plan};
 }else if(['propose-alternative','counter-proposal','propose-final'].includes(action)){
  const sequence=proposals.length,id=123+sequence,previous=proposals.at(-1),f=body.fulfillment;
  if(action==='counter-proposal'&&(!body.customerContactPreference||f))throw Error('Counter must keep the business plan with independent preference');
  if(action!=='counter-proposal'&&!f)throw Error('Business proposal requires fulfillment');
  if(f)plan={...(f.path==='LOCAL_PICKUP'?pickupPlan:whatsappPlan),customerMessage:f.path==='LOCAL_PICKUP'?f.customerMessage||pickupPlan.customerMessage:null,scheduleOrAddress:f.path==='LOCAL_PICKUP'?f.scheduleOrAddress||null:null,allowCustomerWhatsapp:f.path==='WHATSAPP'||f.allowCustomerWhatsapp===true};
  plan={...plan,availabilityConfirmationId:31+sequence,proposalId:id};
  const items=previous.subjectSnapshot.items.map((item,index)=>{const change=body.lineChanges?.find(c=>c.originalLineIndex===index);const unitPrice=change?.unitPriceClp??item.unitPriceClpSnapshot,quantity=change?.quantity??item.quantity;return {...item,source:'CATALOG',publishedUnitPriceClp:12000,quantity,unitPriceClpSnapshot:unitPrice,subtotalClp:unitPrice*quantity};});
  proposals.push({id,sequence,type:['ORIGINAL_REQUEST','BUSINESS_PROPOSAL','CUSTOMER_COUNTER','BUSINESS_FINAL'][sequence],authorActor:business?'BUSINESS':'CUSTOMER',authorUserId:business?2:1,createdAt:'2026-10-25T06:00:00.000Z',subjectSchemaVersion:2,subjectSnapshot:{...previous.subjectSnapshot,items,proposalMessage:body.message,proposalPhoto:body.photo??null},totalPriceClp:body.totalPriceClp,scheduledFor:null,reservationAmountClp:null,availability:plan});
  state={...state,state:action==='propose-alternative'?'AWAITING_CUSTOMER_DECISION':action==='counter-proposal'?'AWAITING_BUSINESS_COUNTER_RESPONSE':'AWAITING_CUSTOMER_FINAL_DECISION',version:state.version+1,currentProposalId:id,proposalSummary:{type:proposals.at(-1).type,subjectSchemaVersion:2,totalPriceClp:body.totalPriceClp,scheduledFor:null}};status='alternative_proposed';
 }else if(['accept-proposal','accept-counter-proposal'].includes(action)){
  if(action==='accept-proposal'&&!body.customerContactPreference)throw Error('Customer final preference required');
  if(action==='accept-counter-proposal'&&plan.allowCustomerWhatsapp&&!body.businessContactConsent)throw Error('Business explicit consent required');
  if(action==='accept-counter-proposal'&&!plan.allowCustomerWhatsapp&&body.businessContactConsent)throw Error('Pickup without contact must omit consent');
  state={...state,state:plan.path==='LOCAL_PICKUP'?'IN_PROGRESS':'COORDINATION_PENDING',version:state.version+2,agreementPublicId:'agreement-test'};status='accepted';
 }else if(action==='continue-request'){
  if(!body.conditionsAccepted||body.availabilityConfirmationId!==31)throw Error('Exact continuation required');
  state={...state,state:plan.path==='LOCAL_PICKUP'?'IN_PROGRESS':'COORDINATION_PENDING',version:4,agreementPublicId:'agreement-test',coordination:{businessContactAuthorized:plan.allowCustomerWhatsapp,customerContactAuthorized:plan.allowCustomerWhatsapp&&body.customerContactPreference.allowed}};status='accepted';
  if(state.localPickupInformation)state={...state,reservationChoice:{offerId:31,choice:'NONE',noReservationAcknowledged:true},localPickupInformation:{...state.localPickupInformation,status:'AWAITING_CUSTOMER_ACK'}};
 }else if(action==='ack-local-pickup-information'){
  if(!informationScenario||business||state.localPickupInformation?.status!=='AWAITING_CUSTOMER_ACK'||body.confirmationAccepted!==true||Object.keys(body).sort().join(',')!=='confirmationAccepted,expectedVersion'||init.headers['X-Local-Pickup-Information-Contract']!=='local-pickup-information-v1')return json({code:'INCOMPATIBLE_STATE'},409);
  state={...state,version:state.version+1,localPickupInformation:{...state.localPickupInformation,status:'ACKNOWLEDGED',acknowledgementId:901,acknowledgedAt:'2026-11-04T04:05:00.000Z'}};
 }else if(['decline-request','withdraw-availability','cancel-pickup'].includes(action)){
  const reasonCode=action==='decline-request'?'CUSTOMER_DECLINED_CONTINUATION':action==='withdraw-availability'?'BUSINESS_WITHDREW_AVAILABILITY':'PICKUP_CANCELLED';
  state={...state,state:'CLOSED',version:state.version+1,closure:{reasonCode,reasonDetail:body.reasonDetail??null,actor:business?'BUSINESS':'CUSTOMER',actorUserId:business?2:1,closedAt:'2026-10-25T06:00:00.000Z'}};status='cancelled';
 }else throw Error('Unexpected action '+action);
 return json({orderId:20,orderStatus:status,requestProcess:processFor(business,true)});
};
function Harness(){const [actor,setActor]=useState(availableDesign?'customer':'checkout'),[revision,setRevision]=useState(0),[expanded,setExpanded]=useState(fixtureParams.has('expanded')),[view,setView]=useState(availableDesign?'waiting':'pending');
 useEffect(()=>{window.switchRole=async role=>{dismissAction();localStorage.setItem('zipco-token',role==='business'?'business-test-only':'customer-test-only');localStorage.setItem('zipco-user-id',role==='business'?'2':'1');if(role==='business')localStorage.setItem('zipco-business-id','5');else localStorage.removeItem('zipco-business-id');if(informationScenario)await participantHeaders(role==='business'?'business-test-only':'customer-test-only',true);window.dispatchEvent(new Event('zipco-session-changed'));setView(statusViewFor('orders',status,processFor(role==='business'),false,role==='business'));setActor(role);};if(informationScenario)void participantHeaders('customer-test-only',true).then(()=>{window.testDriverReady=true;});else window.testDriverReady=true;const navigate=e=>{setView(e.detail.view);setRevision(v=>v+1);};window.addEventListener('zipco-availability-view',navigate);return()=>window.removeEventListener('zipco-availability-view',navigate);},[]);
 const business=actor==='business',current=business?normalizeBusinessOrdersPayload([informationVisibleOrders?.business??orderFor(true)])[0]:normalizeMyOrdersPayload([informationVisibleOrders?.customer??orderFor(false)])[0];
 const visual=useStatusChangeRecords([current],business),order=visual[0],refresh=()=>{setRevision(r=>r+1);},visible=statusViewFor('orders',order.status,order.requestProcess,false,business)===view;
 window.currentView=view;window.liveCounts=countStatusViews([current],'orders',business);
 return <><StatusToast/><StatusChangeHost business={business} view={view} orders={actor!=='checkout'}/><header style={{position:"fixed",top:0,height:180,left:0,right:0,background:"white",zIndex:20}}>Solicitudes · Mis Pedidos</header><main data-requests-scroll data-view={view} style={{padding:16,paddingBottom:160,position:'fixed',top:180,bottom:70,left:0,right:0,overflowY:'auto',background:'#f1f3fa'}}><div data-fixture-list-controls style={{height:320}}>Resumen de solicitudes</div>{actor==='checkout'?<div style={{height:'100dvh'}}><CheckoutScreen business={{id:5,userId:2,name:'ZIPCO Negocio QA'}} currentUserId={1} selectedProducts={[5]} products={[{id:5,businessId:5,name:'Producto QA',description:'Producto de prueba',kind:'product',pricingMode:'fixed_price',priceClp:12000,isActive:true,imageUrl:''}]} onBack={()=>{}} onOrderComplete={()=>{dismissAction();setActor('customer');setView('pending');}} onCatalogConflict={()=>{}} onSessionExpired={()=>{}}/></div>:!visible?<p>Sin pedidos en esta categoría</p>:(order.requestProcess.state==='CLOSED'||informationScenario&&view==='history')?<ProcessHistoryCard key={actor+'history'} order={order}/>:<ProcessOrderCard key={actor} order={order} business={business} expanded={availableDesign||business&&order.requestProcess.state==='AWAITING_CUSTOMER_CONTINUATION'?expanded:true} onToggle={()=>setExpanded(v=>!v)} isUpdating={false} onRetry={refresh}/>}<div data-summary-scroll-space aria-hidden="true"/></main><ActionHologramHost/></>;
}createRoot(document.getElementById('root')).render(<Harness/>);

// @ts-nocheck
// Explicit fixture preserving the checkout/status adapter and short-list geometry.
import StatusToast from '/src/app/screens/requests/StatusToast.tsx';
import {StatusChangeHost,useStatusChangeRecords} from '/src/app/screens/requests/StatusChangeFlow.tsx';
import {statusViewFor,countStatusViews} from '/src/app/screens/requests/requestStatusGrouping.ts';

import React,{useState,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import ProcessOrderCard from '/src/app/screens/requests/ProcessOrderCard.tsx';
import CheckoutScreen from '/src/app/screens/CheckoutScreen.tsx';
import {normalizeMyOrdersPayload,normalizeBusinessOrdersPayload} from '/src/app/screens/requests/orderNormalization.ts';
import {availabilityInitial,pickupPlan,whatsappPlan} from '/src/app/screens/requests/availabilityFixtures.ts';
import {agreementFixture} from '/src/app/screens/requests/requestProcessFixtures.ts';
import ProcessHistoryCard from '/src/app/screens/requests/ProcessHistoryCard.tsx';
import ActionHologramHost,{dismissAction} from '/src/app/screens/requests/ActionHologram.tsx';
import '/src/styles/index.css';
window.flowCalls=[]; window.testDriverReady=false;
localStorage.setItem('zipco-token','customer-test-only');
localStorage.setItem('zipco-user-id','1');
sessionStorage.clear();
let state={...availabilityInitial,productPreview:{contract:'order-product-preview-v1',proposalId:123,items:[{lineIndex:0,catalogItemId:5,source:'CATALOG',name:'Producto QA',description:'Producto de prueba',quantity:1,unitPriceClp:12000,subtotalClp:12000,imageUrl:null}]},allowedActions:[],coordination:{customerContactAuthorized:false,businessContactAuthorized:false}};
let status='pending',plan=null,proposals=[];
let raw={id:20,businessId:5,customerName:'Cliente QA',businessName:'ZIPCO Negocio QA',products:[{name:'Producto QA',quantity:1,price:12000}],total:12000,createdAt:'2026-10-25T05:00:00.000Z',needNow:true,note:'Hola necesito esto de prueba',referencePhoto:null,deliveryDate:null,deliveryTime:null};
function processFor(business,receipt=false){
 const actions=state.state==='AWAITING_BUSINESS_RESPONSE'?(business?['CONFIRM_AVAILABILITY','REJECT_PENDING_REQUEST','PROPOSE_ALTERNATIVE']:['CANCEL_PENDING_REQUEST'])
  :state.state==='AWAITING_CUSTOMER_CONTINUATION'?(business?['WITHDRAW_AVAILABILITY']:['CONTINUE_REQUEST','DECLINE_REQUEST'])
  :state.state==='AWAITING_CUSTOMER_DECISION'||state.state==='AWAITING_CUSTOMER_FINAL_DECISION'?(business?[]:['ACCEPT_PROPOSAL','REJECT_PROPOSAL',...(state.state==='AWAITING_CUSTOMER_DECISION'?['COUNTER_PROPOSAL']:[])])
  :state.state==='AWAITING_BUSINESS_COUNTER_RESPONSE'?(business?['ACCEPT_COUNTER_PROPOSAL','REJECT_COUNTER_PROPOSAL','PROPOSE_FINAL']:[])
  :state.state==='IN_PROGRESS'?(business?['MARK_READY',...(plan.path==='LOCAL_PICKUP'?['CANCEL_PICKUP']:[])]:plan.path==='LOCAL_PICKUP'?['CANCEL_PICKUP']:[])
  :state.state==='READY'?(business?[]:['ACK_READY_NOTICE']):[];
 return {...state,...(plan?{availability:plan}:{}),allowedActions:receipt?[]:actions};
}
function orderFor(business){return {...raw,status,requestProcess:processFor(business)};}
const subject={orderType:'product',items:[{catalogItemId:5,nameSnapshot:'Producto QA',descriptionSnapshot:'Producto de prueba',quantity:1,unitPriceClpSnapshot:12000,subtotalClp:12000}],needNow:true,note:raw.note,referencePhoto:null};
proposals=[{id:123,sequence:0,type:'ORIGINAL_REQUEST',authorActor:'CUSTOMER',authorUserId:1,createdAt:raw.createdAt,subjectSchemaVersion:1,subjectSnapshot:subject,totalPriceClp:12000,scheduledFor:null,reservationAmountClp:null}];
window.fetch=async (url,init)=>{
 if(String(url).endsWith('/request-process-capabilities'))return new Response(JSON.stringify({supportedContracts:['availability-v1','availability-v2'],reservationCreationEnabled:false}));
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
  if(String(url).includes('/orders/'))return json([orderFor(business)]);
  if(String(url).includes('/agreement')){const latest=proposals.at(-1);return json({...agreementFixture,totalPriceClp:latest.totalPriceClp,acceptedProposalId:latest.id,subjectSchemaVersion:latest.subjectSchemaVersion,scheduledFor:null,subjectSnapshot:latest.subjectSnapshot,availability:plan});}
  if(String(url).includes('/proposals'))return json({process:processFor(business),proposals});
 }
 const action=String(url).split('/actions/')[1];
 if(body.expectedVersion!==state.version)return json({code:'STALE_VERSION'},409);
 if(action==='confirm-availability'){
  const f=body.fulfillment;
  plan={...(f.path==='LOCAL_PICKUP'?pickupPlan:whatsappPlan),customerMessage:f.path==='LOCAL_PICKUP'?f.customerMessage||pickupPlan.customerMessage:null,scheduleOrAddress:f.path==='LOCAL_PICKUP'?f.scheduleOrAddress||null:null,allowCustomerWhatsapp:f.path==='WHATSAPP'||f.allowCustomerWhatsapp===true};
  state={...state,state:'AWAITING_CUSTOMER_CONTINUATION',version:2};
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
 }else if(['decline-request','withdraw-availability','cancel-pickup'].includes(action)){
  const reasonCode=action==='decline-request'?'CUSTOMER_DECLINED_CONTINUATION':action==='withdraw-availability'?'BUSINESS_WITHDREW_AVAILABILITY':'PICKUP_CANCELLED';
  state={...state,state:'CLOSED',version:state.version+1,closure:{reasonCode,reasonDetail:body.reasonDetail??null,actor:business?'BUSINESS':'CUSTOMER',actorUserId:business?2:1,closedAt:'2026-10-25T06:00:00.000Z'}};status='cancelled';
 }else throw Error('Unexpected action '+action);
 return json({orderId:20,orderStatus:status,requestProcess:processFor(business,true)});
};
function Harness(){const [actor,setActor]=useState('checkout'),[revision,setRevision]=useState(0),[expanded,setExpanded]=useState(false),[view,setView]=useState('pending');
 useEffect(()=>{window.switchRole=role=>{dismissAction();localStorage.setItem('zipco-token',role==='business'?'business-test-only':'customer-test-only');localStorage.setItem('zipco-user-id',role==='business'?'2':'1');if(role==='business')localStorage.setItem('zipco-business-id','5');else localStorage.removeItem('zipco-business-id');window.dispatchEvent(new Event('zipco-session-changed'));setView(statusViewFor('orders',status,processFor(role==='business'),false,role==='business'));setActor(role);};window.testDriverReady=true;const navigate=e=>{setView(e.detail.view);setRevision(v=>v+1);};window.addEventListener('zipco-availability-view',navigate);return()=>window.removeEventListener('zipco-availability-view',navigate);},[]);
 const business=actor==='business',current=business?normalizeBusinessOrdersPayload([orderFor(true)])[0]:normalizeMyOrdersPayload([orderFor(false)])[0];
 const visual=useStatusChangeRecords([current],business),order=visual[0],refresh=()=>{setRevision(r=>r+1);},visible=statusViewFor('orders',order.status,order.requestProcess,false,business)===view;
 window.currentView=view;window.liveCounts=countStatusViews([current],'orders',business);
 return <><StatusToast/><StatusChangeHost business={business} view={view} orders={actor!=='checkout'}/><header style={{position:"fixed",top:0,height:180,left:0,right:0,background:"white",zIndex:20}}>Solicitudes · Mis Pedidos</header><main data-requests-scroll data-view={view} style={{padding:16,paddingBottom:160,position:'fixed',top:180,bottom:70,left:0,right:0,overflowY:'auto',background:'#f1f3fa'}}><div data-fixture-list-controls style={{height:320}}>Resumen de solicitudes</div>{actor==='checkout'?<div style={{height:'100dvh'}}><CheckoutScreen business={{id:5,userId:2,name:'ZIPCO Negocio QA'}} currentUserId={1} selectedProducts={[5]} products={[{id:5,businessId:5,name:'Producto QA',description:'Producto de prueba',kind:'product',pricingMode:'fixed_price',priceClp:12000,isActive:true,imageUrl:''}]} onBack={()=>{}} onOrderComplete={()=>{dismissAction();setActor('customer');setView('pending');}} onCatalogConflict={()=>{}} onSessionExpired={()=>{}}/></div>:!visible?<p>Sin pedidos en esta categoría</p>:order.requestProcess.state==='CLOSED'?<ProcessHistoryCard key={actor+'history'} order={order}/>:<ProcessOrderCard key={actor} order={order} business={business} expanded={business&&order.requestProcess.state==='AWAITING_CUSTOMER_CONTINUATION'?expanded:true} onToggle={()=>setExpanded(v=>!v)} isUpdating={false} onRetry={refresh}/>}<div data-summary-scroll-space aria-hidden="true"/></main><ActionHologramHost/></>;
}createRoot(document.getElementById('root')).render(<Harness/>);

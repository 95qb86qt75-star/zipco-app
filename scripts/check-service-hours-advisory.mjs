// Real checkout + V3 cards, synthetic HTTP and accounts only. No QA mutations.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';

const directory = path.resolve('node_modules/.cache/service-hours-advisory');
fs.mkdirSync(directory, { recursive: true });
const harness = `
import React,{useState,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import ProcessOrderCard from '/src/app/screens/requests/ProcessOrderCard.tsx';
import QuoteRequestModal from '/src/app/screens/quotes/QuoteRequestModal.tsx';
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
const v3=!new URL(location.href).searchParams.has('disabled'),v2=true;
const advisory=!new URL(location.href).searchParams.has('legacy');
const scheduled=new URL(location.href).searchParams.has('scheduled');
const base=Date.now()+(scheduled?86400000:0);const terms={version:3,termsVersion:'a'.repeat(64),scheduleHash:'b'.repeat(64),opensAt:new Date(base-3600000).toISOString(),closesAt:new Date(base+14400000).toISOString(),scheduledFor:scheduled?new Date(base+3600000).toISOString():null,timeZone:'America/Santiago',holdMinutes:30};if(advisory)Object.assign(terms,{hoursPolicy:'ADVISORY_ONLY',opensAt:null,closesAt:null,holdMinutes:null});
const publicOffer=o=>!v3||o.mode==='NONE'?o:{mode:o.mode,simplified:terms,...(o.mode==='PREPAYMENT'?{requiredAmountClp:o.requiredAmountClp,paymentKind:o.requiredAmountClp===12000?'FULL':'DEPOSIT'}:{})};
const timing=paid=>advisory?{holdStartsAt:terms.scheduledFor??new Date().toISOString(),pickupBy:null,paymentDueAt:null}:({holdStartsAt:terms.scheduledFor??new Date().toISOString(),pickupBy:paid?terms.closesAt:new Date(Math.min(Date.parse(terms.scheduledFor??new Date().toISOString())+1800000,Date.parse(terms.closesAt))).toISOString(),paymentDueAt:paid?new Date(Date.now()+1800000).toISOString():null});
let state={...availabilityInitial,...(v2?{flowContract:v3?'AVAILABILITY_V3':'AVAILABILITY_V2',serverNow:new Date().toISOString()}:{}),allowedActions:[],coordination:{customerContactAuthorized:false,businessContactAuthorized:false}};
let status='pending',plan=null,proposals=[],reserve=null,ownClosed={business:null,customer:null},counterChoice=null;
let raw={id:20,businessId:5,customerName:'Cliente QA',businessName:'ZIPCO Negocio QA',products:[{name:'Producto QA',quantity:1,price:12000}],total:12000,createdAt:'2026-10-25T05:00:00.000Z',needNow:true,note:'Hola necesito esto de prueba',referencePhoto:null,deliveryDate:null,deliveryTime:null};
function processFor(business,receipt=false){
 let actions=state.state==='AWAITING_BUSINESS_RESPONSE'?(business?['CONFIRM_AVAILABILITY','REJECT_PENDING_REQUEST','PROPOSE_ALTERNATIVE']:['CANCEL_PENDING_REQUEST'])
  :state.state==='AWAITING_CUSTOMER_CONTINUATION'?(business?['WITHDRAW_AVAILABILITY']:['CONTINUE_REQUEST','DECLINE_REQUEST'])
  :state.state==='AWAITING_CUSTOMER_DECISION'||state.state==='AWAITING_CUSTOMER_FINAL_DECISION'?(business?[]:['ACCEPT_PROPOSAL','REJECT_PROPOSAL',...(state.state==='AWAITING_CUSTOMER_DECISION'?['COUNTER_PROPOSAL']:[])])
  :state.state==='AWAITING_BUSINESS_COUNTER_RESPONSE'?(business?['ACCEPT_COUNTER_PROPOSAL','REJECT_COUNTER_PROPOSAL','PROPOSE_FINAL']:[])
  :state.state==='IN_PROGRESS'?(business?['MARK_READY',...(plan.path==='LOCAL_PICKUP'?['CANCEL_PICKUP']:[])]:plan.path==='LOCAL_PICKUP'?['CANCEL_PICKUP']:[])
  :state.state==='READY'?(business?[]:['ACK_READY_NOTICE']):[];
 let extra={};
 if(reserve){
  if(!reserve.continuedWithoutReservationAt&&reserve.effectiveStatus!=='CONFIRMED')actions=actions.filter(a=>a!=='MARK_READY');
  const ra=[];
  if(state.state==='IN_PROGRESS'&&!reserve.continuedWithoutReservationAt){if(business&&!reserve.confirmedAt&&['REQUESTED','AWAITING_BUSINESS_CONFIRMATION','NEEDS_CLARIFICATION'].includes(reserve.effectiveStatus))ra.push('CONFIRM_PICKUP_RESERVATION');if(reserve.mode==='FREE'&&business){if(!v3&&reserve.effectiveStatus==='REQUESTED')ra.push('DECLINE_PICKUP_RESERVATION');if(v3&&reserve.effectiveStatus==='CONFIRMED')ra.push('CANCEL_PICKUP_RESERVATION');}if(reserve.mode==='FREE'&&!business&&['EXPIRED','DECLINED','CANCELLED'].includes(reserve.effectiveStatus))ra.push('CONTINUE_WITHOUT_RESERVATION');}
  if(reserve.mode==='PREPAYMENT'&&['IN_PROGRESS','READY','CLOSED'].includes(state.state)){
    if(state.state!=='CLOSED')ra.push('REPORT_RESERVATION_ISSUE');
    const own=state.coordination[business?'businessContactAuthorized':'customerContactAuthorized'],other=state.coordination[business?'customerContactAuthorized':'businessContactAuthorized'];
    ra.push(own?'REVOKE_RESERVATION_CONTACT':'AUTHORIZE_RESERVATION_CONTACT');if(own&&other)ra.push('OPEN_RESERVATION_WHATSAPP');if(!ownClosed[business?'business':'customer'])ra.push('FINISH_OWN_RESERVATION_FOLLOW_UP');
    extra.reservationFollowUp={ownFollowUpClosedAt:ownClosed[business?'business':'customer'],allowedActions:ra,...(v3?{paymentConfirmationReminder:{eligible:ra.includes('CONFIRM_PICKUP_RESERVATION'),reservationId:801,expectedVersion:state.version}}:{})};
  }else actions.push(...ra);
  extra.reservation=reserve;
 }
 if(receipt)return {id:state.id,state:state.state,version:state.version,currentProposalId:state.currentProposalId,agreementPublicId:state.agreementPublicId,flowContract:state.flowContract,...(plan?{availability:plan}:{}),...(state.closure?{closure:state.closure}:{}),allowedActions:[]};return {...state,...(plan?{availability:plan}:{}),...extra,serverNow:new Date().toISOString(),allowedActions:actions};
}
function orderFor(business){return {...raw,status,requestProcess:processFor(business)};}
const subject={orderType:'product',items:[{catalogItemId:5,nameSnapshot:'Producto QA',descriptionSnapshot:'Producto de prueba',quantity:1,unitPriceClpSnapshot:12000,subtotalClp:12000}],needNow:true,note:raw.note,referencePhoto:null};
proposals=[{id:123,sequence:0,type:'ORIGINAL_REQUEST',authorActor:'CUSTOMER',authorUserId:1,createdAt:raw.createdAt,subjectSchemaVersion:1,subjectSnapshot:subject,totalPriceClp:12000,scheduledFor:null,reservationAmountClp:null}];
function save(){localStorage.setItem('mock-only-reservation-state',JSON.stringify({state,status,plan,proposals,reserve,ownClosed,counterChoice}));}
function requestReservation(choice,pref){
 if(v2&&plan.path==='LOCAL_PICKUP'&&!choice)throw Error('Exact reservation choice required');
 if(v3&&plan.path==='LOCAL_PICKUP'&&(choice?.choice==='NONE'&&!choice.noReservationAcknowledged||plan.reservationOffer.mode!=='NONE'&&choice?.termsVersion!==terms.termsVersion))throw Error('Current terms and explicit acknowledgement required');
  if(v2)state.reservationChoice=choice??{offerId:plan.availabilityConfirmationId,choice:'NONE'};
 if(choice?.choice==='REQUEST_RESERVATION'){
  const paid=plan.reservationOffer.mode==='PREPAYMENT';if(paid&&!pref.allowed)throw Error('Independent customer permission required');
  reserve={id:801,mode:paid?'PREPAYMENT':'FREE',status:paid?'AWAITING_BUSINESS_CONFIRMATION':'REQUESTED',effectiveStatus:paid?'AWAITING_BUSINESS_CONFIRMATION':'REQUESTED',requestedAt:new Date().toISOString(),confirmedAt:null,confirmedByUserId:null,paymentReceiptDeclaration:null,pickupCancellation:null,reasonDetail:null,continuedWithoutReservationAt:null,...(v3?{timing:timing(paid),confirmationSource:paid?null:'AUTO_BUSINESS_OFFER',...(!paid?{status:'CONFIRMED',effectiveStatus:'CONFIRMED',confirmedAt:new Date().toISOString()}:{} )}:{})};
 }
}
window.fetch=async (url,init)=>{
 const advice=(status='IN_SERVICE_HOURS',checkedAt=new Date().toISOString())=>({contract:'request-submission-advisory-v1',businessId:5,businessName:'ZIPCO Negocio QA',checkedAt,timeZone:'America/Santiago',localDate:'2026-10-27',status,reason:status==='UNKNOWN'?'INVALID_SCHEDULE':status==='IN_SERVICE_HOURS'?'WITHIN_WINDOW':'AFTER_CLOSING',requiresConfirmation:status==='OUTSIDE_SERVICE_HOURS',todayWindow:{opensAt:'2026-10-27T11:00:00Z',closesAt:'2026-10-27T20:30:00Z'},activeWindow:null,nextWindow:null});
 if(String(url).includes('/submission-advisory')){window.advisoryReads=(window.advisoryReads??0)+1;const mode=window.submissionMode??'IN_SERVICE_HOURS';if(mode==='network')throw new TypeError('Synthetic advisory failure');if(mode==='404')return new Response('{}',{status:404});return new Response(JSON.stringify(advice(mode)));}
 if(String(url).includes('/response-advisory')){const params=new URL(String(url)).searchParams;const requestedFor=params.has('requestedDate')?'2099-10-25T20:35:00Z':null;return new Response(JSON.stringify({contract:'business-response-hours-advisory-v1',current:advice(window.currentHours??'IN_SERVICE_HOURS'),requested:requestedFor?{requestedFor,advisory:advice('OUTSIDE_SERVICE_HOURS',requestedFor)}:null,canContinue:true}));}

 if(String(url).endsWith('/request-process-capabilities'))return new Response(JSON.stringify({supportedContracts:['availability-v1','availability-v2','availability-v3'],reservationCreationEnabled:true,simplifiedReservationCreationEnabled:v3,serviceHoursAdvisory:{contract:'service-hours-advisory-v1',reservationCreationEnabled:advisory}}));
 if(String(url).endsWith('/quotes')&&init?.method==='POST'){window.flowCalls.push({url:String(url),method:'POST',body:JSON.parse(init.body)});return new Response(JSON.stringify({id:40}));}
 const body=init?.body?JSON.parse(init.body):null,business=String(init?.headers?.Authorization).includes('business-test-only');
 window.flowCalls.push({url:String(url),method:init?.method??'GET',body,headers:init?.headers});
 const json=(v,status=200)=>new Response(JSON.stringify(v),{status});
 if((init?.method??'GET')==='POST'&&v2&&init.headers['X-Process-Contract']!==(v3?'availability-v3':'availability-v2'))throw Error('Missing V2 write contract');
 if(String(url).endsWith(v3?'/orders/availability-reservation-v3-requests':'/orders/availability-reservation-requests')){
  if(!body.customerContactPreference)throw Error('Preference required');
  state={...state,customerContactPreference:{...body.customerContactPreference,recordedAt:'2026-10-25T05:00:00.000Z',effective:false,requiresReconfirmation:false}};
  save();return json({...orderFor(false),items:[{id:1,orderId:20,catalogItemId:5,nameSnapshot:'Producto QA',unitPriceClpSnapshot:12000,quantity:1,subtotalClp:12000}]},201);
 }
 if((init?.method??'GET')==='GET'){
  if(!String(url).includes('processContract=availability-v3'))throw Error('Missing S2 read opt-in');
   if(String(url).includes('/reservation-options')){if(!business&&new URL(location.href).searchParams.has('options-expired'))return json({code:'RESERVATION_PAYMENT_WINDOW_UNAVAILABLE'},409);return json({serverNow:new Date().toISOString(),version:state.version,...(business?{reservationOffer:publicOffer({mode:'FREE'}),paymentAvailable:true}:{offerId:plan.availabilityConfirmationId,reservationOffer:plan.reservationOffer,...(plan.reservationOffer.mode!=='NONE'?{previewTiming:timing(plan.reservationOffer.mode==='PREPAYMENT')}:{})})});}
   if(String(url).includes('/orders/')){if(window.failListRead){window.failListRead=false;return json({code:'TEMPORARY_FAILURE'},503);}return json([orderFor(business)]);}
  if(String(url).includes('/agreement')){const latest=proposals.at(-1);return json({...agreementFixture,totalPriceClp:latest.totalPriceClp,acceptedProposalId:latest.id,subjectSchemaVersion:latest.subjectSchemaVersion,scheduledFor:null,subjectSnapshot:latest.subjectSnapshot,availability:plan,...(v2?{reservationChoice:state.reservationChoice}:{})});}
  if(String(url).includes('/proposals'))return json({process:processFor(business),proposals});
 }
 const action=String(url).split('/actions/')[1];
 if(body.expectedVersion!==state.version)return json({code:'STALE_VERSION'},409);
 if(action==='confirm-availability'){
   const loss=new URL(location.href).searchParams.get('lost-confirm');
   if(loss==='before'&&window.flowCalls.filter(c=>c.url.includes('/actions/confirm-availability')&&c.method==='POST').length===1)throw TypeError('simulated network');
   const reject=new URL(location.href).searchParams.get('offer-rejection');
   if(reject&&window.flowCalls.filter(c=>c.url.includes('/actions/confirm-availability')&&c.method==='POST').length===1)return json({code:reject},409);
   const f=body.fulfillment;
  plan={...(f.path==='LOCAL_PICKUP'?pickupPlan:whatsappPlan),customerMessage:f.path==='LOCAL_PICKUP'?f.customerMessage||pickupPlan.customerMessage:null,scheduleOrAddress:f.path==='LOCAL_PICKUP'?f.scheduleOrAddress||null:null,allowCustomerWhatsapp:f.path==='WHATSAPP'||f.allowCustomerWhatsapp===true};
  if(v2&&f.path==='LOCAL_PICKUP'){if(!f.reservationOffer)throw Error('V2 pickup offer required');plan.reservationOffer=publicOffer(f.reservationOffer);}
  state={...state,state:'AWAITING_CUSTOMER_CONTINUATION',version:2};
  proposals[0]={...proposals[0],availability:plan};
 }else if(['propose-alternative','counter-proposal','propose-final'].includes(action)){
  const sequence=proposals.length,id=123+sequence,previous=proposals.at(-1),f=body.fulfillment;
  if(action==='counter-proposal'&&(!body.customerContactPreference||f))throw Error('Counter must keep the business plan with independent preference');
  if(action!=='counter-proposal'&&!f)throw Error('Business proposal requires fulfillment');
  if(f)plan={...(f.path==='LOCAL_PICKUP'?pickupPlan:whatsappPlan),customerMessage:f.path==='LOCAL_PICKUP'?f.customerMessage||pickupPlan.customerMessage:null,scheduleOrAddress:f.path==='LOCAL_PICKUP'?f.scheduleOrAddress||null:null,allowCustomerWhatsapp:f.path==='WHATSAPP'||f.allowCustomerWhatsapp===true};
  if(v2&&f?.path==='LOCAL_PICKUP'){if(!f.reservationOffer)throw Error('V2 proposal offer required');plan.reservationOffer=publicOffer(f.reservationOffer);}
  if(action==='counter-proposal')counterChoice=body.reservationChoice;
  plan={...plan,availabilityConfirmationId:31+sequence,proposalId:id};
  const items=previous.subjectSnapshot.items.map((item,index)=>{const change=body.lineChanges?.find(c=>c.originalLineIndex===index);const unitPrice=change?.unitPriceClp??item.unitPriceClpSnapshot,quantity=change?.quantity??item.quantity;return {...item,source:'CATALOG',publishedUnitPriceClp:12000,quantity,unitPriceClpSnapshot:unitPrice,subtotalClp:unitPrice*quantity};});
  proposals.push({id,sequence,type:['ORIGINAL_REQUEST','BUSINESS_PROPOSAL','CUSTOMER_COUNTER','BUSINESS_FINAL'][sequence],authorActor:business?'BUSINESS':'CUSTOMER',authorUserId:business?2:1,createdAt:'2026-10-25T06:00:00.000Z',subjectSchemaVersion:2,subjectSnapshot:{...previous.subjectSnapshot,items,proposalMessage:body.message,proposalPhoto:body.photo??null},totalPriceClp:body.totalPriceClp,scheduledFor:null,reservationAmountClp:null,availability:plan});
  state={...state,state:action==='propose-alternative'?'AWAITING_CUSTOMER_DECISION':action==='counter-proposal'?'AWAITING_BUSINESS_COUNTER_RESPONSE':'AWAITING_CUSTOMER_FINAL_DECISION',version:state.version+1,currentProposalId:id,proposalSummary:{type:proposals.at(-1).type,subjectSchemaVersion:2,totalPriceClp:body.totalPriceClp,scheduledFor:null}};status='alternative_proposed';
 }else if(['accept-proposal','accept-counter-proposal'].includes(action)){
  if(action==='accept-proposal'&&!body.customerContactPreference)throw Error('Customer final preference required');
  if(action==='accept-counter-proposal'&&plan.allowCustomerWhatsapp&&!body.businessContactConsent)throw Error('Business explicit consent required');
  if(action==='accept-counter-proposal'&&!plan.allowCustomerWhatsapp&&body.businessContactConsent)throw Error('Pickup without contact must omit consent');
  state={...state,state:plan.path==='LOCAL_PICKUP'?'IN_PROGRESS':'COORDINATION_PENDING',version:state.version+2,agreementPublicId:'agreement-test'};status='accepted';
  state.coordination={businessContactAuthorized:plan.allowCustomerWhatsapp,customerContactAuthorized:plan.allowCustomerWhatsapp&&(body.customerContactPreference?.allowed??true)};
  requestReservation(action==='accept-counter-proposal'?counterChoice&&{...counterChoice,offerId:plan.availabilityConfirmationId}:body.reservationChoice,body.customerContactPreference??{allowed:true});
 }else if(action==='continue-request'){
  if(!body.conditionsAccepted||body.availabilityConfirmationId!==31)throw Error('Exact continuation required');
  state={...state,state:plan.path==='LOCAL_PICKUP'?'IN_PROGRESS':'COORDINATION_PENDING',version:4,agreementPublicId:'agreement-test',coordination:{businessContactAuthorized:plan.allowCustomerWhatsapp,customerContactAuthorized:plan.allowCustomerWhatsapp&&body.customerContactPreference.allowed}};status='accepted';
  requestReservation(body.reservationChoice,body.customerContactPreference);
 }else if(['decline-request','withdraw-availability','cancel-pickup'].includes(action)){
  const reasonCode=action==='decline-request'?'CUSTOMER_DECLINED_CONTINUATION':action==='withdraw-availability'?'BUSINESS_WITHDREW_AVAILABILITY':'PICKUP_CANCELLED';
  state={...state,state:'CLOSED',version:state.version+1,closure:{reasonCode,reasonDetail:body.reasonDetail??null,actor:business?'BUSINESS':'CUSTOMER',actorUserId:business?2:1,closedAt:'2026-10-25T06:00:00.000Z'}};status='cancelled';
  if(reserve){reserve.pickupCancellation={actorUserId:business?2:1,cancelledAt:new Date().toISOString(),reasonDetail:body.reasonDetail};reserve.reasonDetail=body.reasonDetail;reserve.status=reserve.effectiveStatus=reserve.mode==='PREPAYMENT'?'NEEDS_CLARIFICATION':'CANCELLED';}
 }else if(['cancel-pickup-reservation','confirm-pickup-reservation','decline-pickup-reservation','continue-without-reservation','report-reservation-issue','finish-own-reservation-follow-up','open-reservation-whatsapp','authorize-reservation-contact','revoke-reservation-contact'].includes(action)){
  if(!reserve||body.reservationId!==801)throw Error('Exact reservation required');
  if(action==='confirm-pickup-reservation'){if(!business||!body.entireOrderHeldDeclared||reserve.mode==='PREPAYMENT'&&!body.requiredPaymentReceivedDeclared)throw Error('Own explicit declarations required');reserve.status=reserve.effectiveStatus='CONFIRMED';reserve.confirmedAt=new Date().toISOString();reserve.confirmedByUserId=2;if(v3)reserve.confirmationSource='BUSINESS_ACTION';if(reserve.mode==='PREPAYMENT')reserve.paymentReceiptDeclaration={actorUserId:2,declaredAt:new Date().toISOString(),amountClp:plan.reservationOffer.requiredAmountClp};}
  if(action==='cancel-pickup-reservation'){reserve.status=reserve.effectiveStatus='CANCELLED';reserve.reasonDetail=body.reasonDetail;}
   if(action==='decline-pickup-reservation'){reserve.status=reserve.effectiveStatus='DECLINED';reserve.reasonDetail=body.reasonDetail;}
  if(action==='continue-without-reservation')reserve.continuedWithoutReservationAt=new Date().toISOString();
  if(action==='report-reservation-issue'){reserve.status=reserve.effectiveStatus='NEEDS_CLARIFICATION';reserve.reasonDetail=body.reasonDetail;}
  if(action==='finish-own-reservation-follow-up')ownClosed[business?'business':'customer']=new Date().toISOString();
  if(action==='authorize-reservation-contact'||action==='revoke-reservation-contact')state.coordination[business?'businessContactAuthorized':'customerContactAuthorized']=action==='authorize-reservation-contact';
  state.version++;save();
  const result={orderId:20,orderStatus:status,requestProcess:{id:state.id,state:state.state,version:state.version,currentProposalId:state.currentProposalId,agreementPublicId:state.agreementPublicId,flowContract:state.flowContract,availability:plan,allowedActions:[]}};
  return json(action==='open-reservation-whatsapp'?{result,navigation:{url:'https://wa.me/56900000000?text=Reserva'}}:result);
 }else if(action==='mark-ready'){state.state='READY';state.version++;status='ready';}else throw Error('Unexpected action '+action);
 save();if(action==='confirm-availability'&&new URL(location.href).searchParams.get('lost-confirm')==='after'&&window.flowCalls.filter(c=>c.url.includes('/actions/confirm-availability')&&c.method==='POST').length===1)throw TypeError('simulated lost response after commit');return json({orderId:20,orderStatus:status,requestProcess:processFor(business,true)});
};
if(new URL(location.href).searchParams.has('resume')){const recovered=JSON.parse(localStorage.getItem('mock-only-reservation-state')??'null');if(recovered)({state,status,plan,proposals,reserve,ownClosed,counterChoice}=recovered);}
window.scheduleForTest=()=>{raw={...raw,needNow:false,deliveryDate:'2099-10-25',deliveryTime:'17:35'};};
window.mockState=()=>({state,status,plan,reserve,ownClosed});
window.expireMockReservation=()=>{reserve.status=reserve.effectiveStatus='EXPIRED';state.version++;save();};
function Harness(){const [actor,setActor]=useState('checkout'),[revision,setRevision]=useState(0);
 useEffect(()=>{const refresh=()=>setRevision(r=>r+1);window.addEventListener('zipco-requests-refresh',refresh);return()=>window.removeEventListener('zipco-requests-refresh',refresh);},[]);
 useEffect(()=>{window.switchRole=role=>{dismissAction();localStorage.setItem('zipco-token',role==='business'?'business-test-only':'customer-test-only');localStorage.setItem('zipco-user-id',role==='business'?'2':'1');if(role==='business')localStorage.setItem('zipco-business-id','5');else localStorage.removeItem('zipco-business-id');window.dispatchEvent(new Event('zipco-session-changed'));setActor(role);};window.testDriverReady=true;},[]);
 const business=actor==='business',order=business?normalizeBusinessOrdersPayload([orderFor(true)])[0]:normalizeMyOrdersPayload([orderFor(false)])[0];
 const refresh=()=>setRevision(r=>r+1);
 return <><main style={{padding:16,paddingTop:70,minHeight:'100dvh',background:'#f1f3fa'}}>{actor==='quote'?<QuoteRequestModal businessId={5} item={{id:5,name:'Servicio QA'}} onClose={()=>setActor('results')} onCreated={()=>{}}/>:actor==='results'?<button onClick={()=>setActor(window.returnActor??'checkout')}>Volver al borrador</button>:actor==='checkout'?<div style={{height:'100dvh'}}><CheckoutScreen business={{id:5,userId:2,name:'ZIPCO Negocio QA'}} currentUserId={1} selectedProducts={[5]} products={[{id:5,businessId:5,name:'Producto QA',description:'Producto de prueba',kind:'product',pricingMode:'fixed_price',priceClp:12000,isActive:true,imageUrl:''}]} onBack={()=>{window.returnActor='checkout';setActor('results');}} onOrderComplete={()=>{dismissAction();setActor('customer');}} onCatalogConflict={()=>{}} onSessionExpired={()=>{}}/></div>:state.state==='CLOSED'?<ProcessHistoryCard key={actor+'history'} order={order}/>:<ProcessOrderCard key={actor} order={order} business={business} expanded={true} onToggle={()=>{}} isUpdating={false} onRetry={refresh}/>}</main><ActionHologramHost/></>;
}
createRoot(document.getElementById('root')).render(<Harness/>);
`;
const server = await createServer({ mode: 'qa', plugins: [{
  name: 'checkout-browser-harness',
  resolveId(id) { if(id === '/__checkout-test.tsx') return id; },
  load(id) { if(id === '/__checkout-test.tsx') return harness; },
  configureServer(server) {
    server.middlewares.use(async (req,res,next) => {
      if (!req.url?.startsWith('/__checkout-test?')) return next();
      res.setHeader('Content-Type','text/html');
      res.end(await server.transformIndexHtml('/__checkout-test', '<html><meta name="viewport" content="width=device-width,initial-scale=1"><body><div id="root" style="height:100dvh"></div><script type="module" src="/__checkout-test.tsx"></script></body></html>'));
    });
  },
}], server: { host: '127.0.0.1', port: 0, strictPort: false } });
await server.listen();
const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
const profile = path.join(directory, `profile-${Date.now()}`);
const browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
try {
  const portFile = path.join(profile, 'DevToolsActivePort');
  for (let i = 0; !fs.existsSync(portFile) && i < 200; i++) await delay(50);
  const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
  let serial = 0;
  const pending = new Map(), requests = [], exceptions = [];
  socket.addEventListener('message', event => {
    const value = JSON.parse(event.data);
    if (value.method === 'Network.requestWillBeSent') requests.push(value.params.request.url);
    if (value.method === 'Runtime.exceptionThrown') exceptions.push(value.params.exceptionDetails);
    if (!pending.has(value.id)) return;
    const { resolve, reject } = pending.get(value.id); pending.delete(value.id);
    value.error ? reject(Error(value.error.message)) : resolve(value.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++serial; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const wait = async expression => {
    for (let i = 0; i < 200; i++) { if (await evaluate(expression)) return; await delay(50); }
    throw Error(`Timeout: ${expression}\n${JSON.stringify(exceptions)}\n${await evaluate('document.body.textContent')}`);
  };
  const click = async selector => { await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); await delay(100); };
  const button = async label => { await evaluate(`(()=>{const root=document.querySelector('[role=alertdialog]')??[...document.querySelectorAll('[role=dialog]')].at(-1)??document;const b=[...root.querySelectorAll('button')].find(b=>(b.querySelector(".zipco-accept-label")?.textContent??b.textContent).trim()===${JSON.stringify(label)});if(!b)throw Error('Missing button '+${JSON.stringify(label)});b.click()})()`); await delay(100); };
  const visit = async (query, width = 390) => {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
    await send('Page.navigate', { url: `${origin}/__checkout-test?${query}` });
    await wait('window.testDriverReady===true');
    await delay(180);
  };
  const shot = async name => {
    const result = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(directory, `${name}.png`), Buffer.from(result.data, 'base64'));
  };
  const check = async (expression, message) => assert.equal(await evaluate(expression), true, message);

  await send('Runtime.enable'); await send('Network.enable');
  await send('Network.setBlockedURLs', { urls: ['https://*'] });
  const role=async value=>{await evaluate(`window.switchRole(${JSON.stringify(value)})`);await delay(250);};
  const create=async width=>{await visit('',width);await button('Ahora');await button('Requiero este producto');await button('Enviar solicitud');await wait('document.body.textContent.includes("EN ESPERA")');await role('business');await wait('document.body.textContent.includes("NUEVO PEDIDO")');};
  const confirmButton=async()=>{await evaluate(`document.querySelector('.zipco-av-business-actions .zipco-accept-btn').click()`);await wait('!!document.querySelector("[role=dialog]")');};
  const results=[];
  const fill=async(selector,value)=>{await evaluate('(()=>{const t=document.querySelector('+JSON.stringify(selector)+');if(!t)throw Error("Missing field");const proto=t.tagName==="TEXTAREA"?HTMLTextAreaElement.prototype:t.tagName==="SELECT"?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,"value").set.call(t,'+JSON.stringify(value)+');t.dispatchEvent(new Event(t.tagName==="SELECT"?"change":"input",{bubbles:true}))})()');await delay(80);};
  const expand=async()=>{await evaluate('window.dispatchEvent(new CustomEvent("zipco-notification-card-open",{detail:{id:"order-20"}}))');await delay(100);await evaluate('document.querySelector(".zipco-co-colrow[data-folded=true]")?.click()');await delay(100);};
  const offer=async(mode,width=390,query='')=>{if(query){await visit(query,width);await button('Ahora');await button('Requiero este producto');await button('Enviar solicitud');await wait('document.body.textContent.includes("EN ESPERA")');await role('business');}else await create(width);await confirmButton();await click('.zipco-av-channel-pickup');await click('[aria-label="'+(mode==='FREE'?'Sí, sin pago previo':mode==='PREPAYMENT'?'Sí, con un pago previo':'No, será por orden de llegada')+'"]');
    await check('!document.querySelector("input[type=datetime-local]")','no business date fields or duration chips');
    if(mode==='PREPAYMENT'){await fill('[aria-label="Monto de reserva"]','5000');await check('document.querySelector(".zipco-av-button-row .zipco-av-primary").disabled','paid does not silently grant contact');await button('Sí, permitir');}
    await shot('business-'+mode+'-'+width);await button('Confirmar disponibilidad');await wait('document.body.textContent.includes("Esperando respuesta del cliente")');await role('customer');await wait('document.body.textContent.includes("DISPONIBLE")');await check('window.flowCalls.filter(c=>c.url.includes("continue-request")).length===0','reading available conditions is not acceptance');await button('Sí, continuar con la compra');await wait('!!document.querySelector("[role=dialog]")');await wait('!document.body.textContent.includes("Verificando condiciones")');
  };

  for(const width of [320,390,430]){
    await create(width);await evaluate('window.scheduleForTest();window.dispatchEvent(new Event("zipco-requests-refresh"))');await role('business');await confirmButton();
    await wait('!!document.querySelector("[data-response-hours]")');
    await check('document.querySelector("[data-response-hours]").textContent.includes("La hora solicitada está fuera")&&!document.querySelector("[data-response-hours]").textContent.includes("Estás respondiendo fuera")','requested hour differs from current hour');
    await click('.zipco-av-channel-pickup');await click('[aria-label="Sí, sin pago previo"]');await wait('document.body.textContent.includes("No tiene vencimiento automático")');await shot('business-requested-outside-'+width);
    await button('Confirmar disponibilidad');await wait('window.mockState().plan?.reservationOffer.mode==="FREE"');
    await check('window.flowCalls.find(c=>c.url.includes("confirm-availability")).body.fulfillment.reservationOffer.hoursPolicy==="ADVISORY_ONLY"','new offer opts in only after capability');
    await role('customer');await button('Sí, continuar con la compra');await wait('!document.body.textContent.includes("Verificando condiciones")');await check('document.body.textContent.includes("no tiene vencimiento automático")&&!document.body.textContent.includes("hasta el cierre")','customer knows new conditions');await button('Reservar');await wait('!!document.querySelector("[data-reservation-panel]")');await expand();
    await check('window.mockState().reserve.timing.pickupBy===null&&window.mockState().reserve.status==="CONFIRMED"','free automatic without deadline');
    await check('!document.body.textContent.includes("1970")&&!document.body.textContent.includes("Reservado hasta")','no null date formatting');
    await shot('customer-free-'+width);results.push('new-free-both-roles-'+width);
  }
  await offer('PREPAYMENT');await button('Reservar · coordinar pago de $5.000');await delay(300);await visit('resume=1');await role('business');await expand();
  await button('Recibí el pago y aparté el pedido');await check('!document.querySelector("[role=dialog]").textContent.includes("hasta")','manual payment declaration invents no deadline');
  await button('Sí, confirmar');await wait('window.mockState().reserve.status==="CONFIRMED"');
  await check('window.mockState().reserve.paymentReceiptDeclaration!==null&&window.mockState().reserve.timing.pickupBy===null','paid stock held only after business declaration');results.push('paid-explicit-declaration');
  await role('customer');await expand();await check('document.body.textContent.includes("Reserva confirmada")&&!document.body.textContent.includes("Reservado hasta")','customer paid remains confirmed without date');results.push('paid-customer-confirmed');
  const headerCalls=await evaluate('window.flowCalls.filter(c=>c.method==="POST"&&c.url.includes("/actions/")).map(c=>c.headers["X-Service-Hours-Contract"])');assert.equal(headerCalls.every(v=>v==='service-hours-advisory-v1'),true);results.push('write-headers');
  for(const mode of ['OUTSIDE_SERVICE_HOURS','network','404']){
    await visit('',390);await evaluate('window.submissionMode='+JSON.stringify(mode));await button('Ahora');await button('Requiero este producto');await button('Enviar solicitud');
    await wait('document.body.textContent.includes("Fuera del horario informado")||document.body.textContent.includes("Horario no disponible")');await check('!window.flowCalls.some(c=>c.method==="POST")','advisory alone never submits');
    if(mode==='404'){await check('document.body.textContent.includes("El negocio no está disponible")&&!document.body.textContent.includes("Enviar sin verificar")','unavailable business is not a closed-hours advisory');await button('Prefiero buscar otra opción');}
    else{await button(mode==='network'?'Enviar sin verificar el horario':'Enviar de todas formas');await wait('document.body.textContent.includes("EN ESPERA")');await check('window.flowCalls.filter(c=>c.method==="POST").length===1','one deliberate submission');}
    results.push('customer-submit-'+mode);
  }
  await visit('',390);await evaluate('window.submissionMode="OUTSIDE_SERVICE_HOURS"');await button('Agregar nota opcional');await fill('textarea','Borrador conservado');await button('Ahora');await button('Requiero este producto');await button('Enviar solicitud');await wait('document.body.textContent.includes("Fuera del horario informado")');await button('Prefiero buscar otra opción');await button('Volver al borrador');await button('Agregar nota opcional');await check('document.querySelector("textarea").value==="Borrador conservado"','leaving preserves draft');results.push('cancel-preserves-draft');
  await visit('',390);await evaluate('window.submissionMode="OUTSIDE_SERVICE_HOURS"');await role('quote');await fill('textarea','Servicio solicitado');await button('Enviar solicitud de cotización');await wait('document.body.textContent.includes("Fuera del horario informado")');await check('!window.flowCalls.some(c=>c.method==="POST")','quote also waits');await button('Enviar de todas formas');await wait('window.flowCalls.some(c=>c.url.endsWith("/quotes")&&c.method==="POST")');await check('window.flowCalls.filter(c=>c.method==="POST").length===1','quote submitted once');results.push('quote-advisory');
  assert.equal(exceptions.length,0,JSON.stringify(exceptions));
  console.log(JSON.stringify({passed:true,results,realCheckoutAndCards:true,realMutations:0,screenshots:directory}));
} finally {
  socket?.close(); browser.kill(); await server.close();
}

// Real checkout + V3 cards, synthetic HTTP and accounts only. No QA mutations.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';

const directory = path.resolve('node_modules/.cache/reservation-v3-flow');
fs.mkdirSync(directory, { recursive: true });
const harness = `
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
const v3=!new URL(location.href).searchParams.has('disabled'),v2=true;
const scheduled=new URL(location.href).searchParams.has('scheduled');
const base=Date.now()+(scheduled?86400000:0);const terms={version:3,termsVersion:'a'.repeat(64),scheduleHash:'b'.repeat(64),opensAt:new Date(base-3600000).toISOString(),closesAt:new Date(base+14400000).toISOString(),scheduledFor:scheduled?new Date(base+3600000).toISOString():null,timeZone:'America/Santiago',holdMinutes:30};
const publicOffer=o=>!v3||o.mode==='NONE'?o:{mode:o.mode,simplified:terms,...(o.mode==='PREPAYMENT'?{requiredAmountClp:o.requiredAmountClp,paymentKind:o.requiredAmountClp===12000?'FULL':'DEPOSIT'}:{})};
const timing=paid=>({holdStartsAt:terms.scheduledFor??new Date().toISOString(),pickupBy:paid?terms.closesAt:new Date(Math.min(Date.parse(terms.scheduledFor??new Date().toISOString())+1800000,Date.parse(terms.closesAt))).toISOString(),paymentDueAt:paid?new Date(Date.now()+1800000).toISOString():null});
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
 if(String(url).endsWith('/request-process-capabilities'))return new Response(JSON.stringify({supportedContracts:['availability-v1','availability-v2','availability-v3'],reservationCreationEnabled:true,simplifiedReservationCreationEnabled:v3}));
 const body=init?.body?JSON.parse(init.body):null,business=String(init?.headers?.Authorization).includes('business-test-only');
 window.flowCalls.push({url:String(url),method:init?.method??'GET',body});
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
   if(String(url).includes('/orders/'))return json([orderFor(business)]);
  if(String(url).includes('/agreement')){const latest=proposals.at(-1);return json({...agreementFixture,totalPriceClp:latest.totalPriceClp,acceptedProposalId:latest.id,subjectSchemaVersion:latest.subjectSchemaVersion,scheduledFor:null,subjectSnapshot:latest.subjectSnapshot,availability:plan,...(v2?{reservationChoice:state.reservationChoice}:{})});}
  if(String(url).includes('/proposals'))return json({process:processFor(business),proposals});
 }
 const action=String(url).split('/actions/')[1];
 if(body.expectedVersion!==state.version)return json({code:'STALE_VERSION'},409);
 if(action==='confirm-availability'){
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
 save();return json({orderId:20,orderStatus:status,requestProcess:processFor(business,true)});
};
if(new URL(location.href).searchParams.has('resume')){const recovered=JSON.parse(localStorage.getItem('mock-only-reservation-state')??'null');if(recovered)({state,status,plan,proposals,reserve,ownClosed,counterChoice}=recovered);}
window.mockState=()=>({state,status,plan,reserve,ownClosed});
window.expireMockReservation=()=>{reserve.status=reserve.effectiveStatus='EXPIRED';state.version++;save();};
function Harness(){const [actor,setActor]=useState('checkout'),[revision,setRevision]=useState(0);
 useEffect(()=>{const refresh=()=>setRevision(r=>r+1);window.addEventListener('zipco-requests-refresh',refresh);return()=>window.removeEventListener('zipco-requests-refresh',refresh);},[]);
 useEffect(()=>{window.switchRole=role=>{dismissAction();localStorage.setItem('zipco-token',role==='business'?'business-test-only':'customer-test-only');localStorage.setItem('zipco-user-id',role==='business'?'2':'1');if(role==='business')localStorage.setItem('zipco-business-id','5');else localStorage.removeItem('zipco-business-id');window.dispatchEvent(new Event('zipco-session-changed'));setActor(role);};window.testDriverReady=true;},[]);
 const business=actor==='business',order=business?normalizeBusinessOrdersPayload([orderFor(true)])[0]:normalizeMyOrdersPayload([orderFor(false)])[0];
 const refresh=()=>setRevision(r=>r+1);
 return <><main style={{padding:16,paddingTop:70,minHeight:'100dvh',background:'#f1f3fa'}}>{actor==='checkout'?<div style={{height:'100dvh'}}><CheckoutScreen business={{id:5,userId:2,name:'ZIPCO Negocio QA'}} currentUserId={1} selectedProducts={[5]} products={[{id:5,businessId:5,name:'Producto QA',description:'Producto de prueba',kind:'product',pricingMode:'fixed_price',priceClp:12000,isActive:true,imageUrl:''}]} onBack={()=>{}} onOrderComplete={()=>{dismissAction();setActor('customer');}} onCatalogConflict={()=>{}} onSessionExpired={()=>{}}/></div>:state.state==='CLOSED'?<ProcessHistoryCard key={actor+'history'} order={order}/>:<ProcessOrderCard key={actor} order={order} business={business} expanded={true} onToggle={()=>{}} isUpdating={false} onRetry={refresh}/>}</main><ActionHologramHost/></>;
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
  for(const width of [320,390,430]){await offer('FREE',width);await check('document.body.textContent.includes("podría haberse agotado")','warning visible before decision');await fill('[aria-label="Nota para la reserva"]','Llego en 15 min');await shot('customer-free-'+width);await button('Reservar');await wait('!!document.querySelector("[data-reservation-panel]")');await expand();await check('window.mockState().reserve.status==="CONFIRMED"&&window.mockState().reserve.confirmedByUserId===null','free reservation is automatic without fake business click');await check('!window.flowCalls.some(c=>c.url.includes("confirm-pickup-reservation"))','no approval POST for free');await role('business');await expand();await check('!document.body.textContent.includes("Confirmar que aparté")','no manual free confirmation');await button('Cancelar solo la reserva');await fill('[aria-label="Motivo de reserva"]','No puedo guardarlo');await button('Confirmar');await wait('window.mockState().reserve.status==="CANCELLED"');await check('window.mockState().state.state==="IN_PROGRESS"','free cancellation keeps order active');results.push('free-auto-and-cancel-'+width);}
  await offer('FREE',390,'scheduled=1');await button('Reservar');await wait('!!document.querySelector("[data-reservation-panel]")');await check('Date.parse(window.mockState().reserve.timing.pickupBy)-Date.parse(window.mockState().reserve.timing.holdStartsAt)===1800000','scheduled server timing stays 30 minutes');results.push('scheduled-free');
  for(const mode of ['FREE','PREPAYMENT','NONE']){await offer(mode);if(mode!=='NONE')await button('Ir al local sin reserva');await check('!window.flowCalls.some(c=>c.url.includes("continue-request"))','opening no-reservation acknowledgement does not POST');await button('Confirmar que iré');await wait('window.mockState().state.state==="IN_PROGRESS"');await check('window.mockState().reserve===null&&window.mockState().state.reservationChoice.noReservationAcknowledged===true','without reserve creates no held row');results.push('without-reservation-'+mode);}
  await offer('PREPAYMENT');await click('[role=dialog] input[type=checkbox]');await check('document.querySelector("[role=dialog] button").disabled','paid customer own permission required');await click('[role=dialog] input[type=checkbox]');await button('Reservar · coordinar pago de $5.000');await delay(500);await visit('resume=1');await role('customer');await expand();await wait('!!document.querySelector("[data-reservation-panel]")');await check('window.mockState().reserve.paymentReceiptDeclaration===null','WhatsApp never declares payment');await check('!document.body.textContent.includes("¿Coordinación lista")','no ordinary coordination prompt');await role('business');await expand();await wait('document.body.textContent.includes("Recibí el pago y aparté el pedido")');
  const returnVisit=async()=>{await evaluate('Object.defineProperty(document,"hidden",{value:true,configurable:true});document.dispatchEvent(new Event("visibilitychange"));Object.defineProperty(document,"hidden",{value:false,configurable:true});document.dispatchEvent(new Event("visibilitychange"));window.dispatchEvent(new Event("focus"));window.dispatchEvent(new Event("pageshow"));');await delay(4300);};
  await returnVisit();await wait('document.body.textContent.includes("¿Recibiste el pago y apartaste el pedido?")');await check('!window.flowCalls.some(c=>c.url.includes("confirm-pickup-reservation"))','return reminder does not auto-confirm');await button('Aún no');await evaluate('window.dispatchEvent(new Event("focus"));document.dispatchEvent(new Event("visibilitychange"))');await delay(4300);await check('!document.querySelector("[role=dialog]")','duplicate resume does not repeat dismissed visit');await button('Recibí el pago y aparté el pedido');await shot('payment-confirmation-hologram');await button('Sí, confirmar');await wait('window.mockState().reserve.status==="CONFIRMED"');await check('window.mockState().reserve.confirmationSource==="BUSINESS_ACTION"','business declaration has real actor');await check('!document.body.textContent.includes("Recibí el pago y aparté el pedido")','confirmed payment removes button');results.push('paid-whatsapp-return-reminder-and-manual');
  await visit('disabled=1');await button('Ahora');await button('Requiero este producto');await button('Enviar solicitud');await wait('document.body.textContent.includes("EN ESPERA")');await check('window.flowCalls.find(c=>c.method==="POST").url.endsWith("/orders/availability-reservation-requests")','V3 off retains V2 creation and its independent flag');results.push('v3-disabled-v2-preserved');
  const draft=async(price,mode)=>{await wait('!!document.querySelector("[aria-label=Precio]")');await click('[aria-label=Precio]');await fill('[aria-label="Nuevo precio por unidad"]',String(price));await button('Guardar');await fill('textarea[placeholder="Ej: Puedo ofrecerte esta alternativa porque…"]','Ajuste de precio de prueba');await button('Revisar alternativa');await button('Confirmar y enviar');if(mode){await click('.zipco-av-channel-pickup');await click('[aria-label="Sí, sin pago previo"]');await button('Usar este camino');}await wait('!document.querySelector("[data-alternative-footer]")');};
  const chooseReserve=async()=>{await evaluate('(()=>{const l=[...document.querySelectorAll("label")].find(l=>l.textContent.trim().startsWith("Solicitar reserva"));l.querySelector("input").click()})()');await delay(80);};
  await create(390);await click('[aria-label="Proponer alternativa"]');await draft(11000,'FREE');await role('customer');await button('Revisar propuesta y responder');await button('Aceptar propuesta');await chooseReserve();await button('Sí, confirmar');await wait('window.mockState().reserve?.status==="CONFIRMED"');await check('!window.flowCalls.some(c=>c.url.includes("confirm-pickup-reservation"))','alternative free acceptance is automatic');results.push('alternative-free-auto');
  await create(390);await click('[aria-label="Proponer alternativa"]');await draft(11000,'FREE');await role('customer');await button('Revisar propuesta y responder');await click('[aria-label="Hacer mi única contrapropuesta"]');await wait('!!document.querySelector("[aria-label=Precio]")');await click('[aria-label=Precio]');await fill('[aria-label="Nuevo precio por unidad"]','10000');await button('Guardar');await fill('textarea[placeholder="Ej: Puedo ofrecerte esta alternativa porque…"]','Mi contrapropuesta');await button('Revisar alternativa');await chooseReserve();await button('Confirmar y enviar');await wait('!document.querySelector("[data-alternative-footer]")');await check('window.mockState().reserve===null','counter creates no reservation before agreement');await role('business');await button('Revisar propuesta y responder');await button('Aceptar contrapropuesta');await button('Sí, confirmar');await wait('window.mockState().reserve?.status==="CONFIRMED"');results.push('counter-free-conditional-auto');
  await offer('PREPAYMENT',390,'options-expired=1');await check('document.querySelector("[role=dialog] button").disabled','expired payment window cannot reserve');await button('Ir al local sin reserva');await button('Confirmar que iré');await wait('window.mockState().state.state==="IN_PROGRESS"');await check('window.mockState().reserve===null','expired offer does not force or fabricate another reservation');results.push('expired-preview-explicit-without');
  await create(390);await click('[aria-label="Proponer alternativa"]');await draft(11000,'FREE');await role('customer');await button('Revisar propuesta y responder');await click('[aria-label="Hacer mi única contrapropuesta"]');await draft(10000);await role('business');await button('Revisar propuesta y responder');await click('[aria-label="Proponer alternativa final"]');await draft(10500);await check('window.mockState().plan.reservationOffer.mode==="FREE"','final keeps reservation mode without another channel chooser');await role('customer');await button('Revisar propuesta y responder');await button('Aceptar propuesta');await chooseReserve();await button('Sí, confirmar');await wait('window.mockState().reserve?.status==="CONFIRMED"');results.push('final-free-preserves-path');
  for(const code of ['RESERVATION_HOURS_UNAVAILABLE','RESERVATION_PAYMENT_WINDOW_UNAVAILABLE']){
    await visit('offer-rejection='+code,390);await button('Ahora');await button('Requiero este producto');await button('Enviar solicitud');await wait('document.body.textContent.includes("EN ESPERA")');await role('business');await confirmButton();await click('.zipco-av-channel-pickup');await fill('.zipco-av-timeline textarea','Mensaje conservado');await fill('.zipco-av-input-icon input','Dirección escrita por el negocio');await click('[aria-label="Sí, con un pago previo"]');await fill('[aria-label="Monto de reserva"]','5000');await button('Sí, permitir');await button('Confirmar disponibilidad');await wait('document.body.textContent.includes('+JSON.stringify(code==='RESERVATION_HOURS_UNAVAILABLE'?'única jornada':'menos de 30 minutos')+')');
    await check('document.querySelector(".zipco-av-timeline textarea").value==="Mensaje conservado"&&document.querySelector(".zipco-av-input-icon input").value==="Dirección escrita por el negocio"','request error keeps the written message and optional schedule');
    await check('document.querySelector('+JSON.stringify('[aria-label="Monto de reserva"]')+').value==="5000"&&document.querySelector('+JSON.stringify('[aria-label="Sí, con un pago previo"]')+').checked&&document.querySelector(".zipco-av-pickup-contact button:last-child").getAttribute("aria-pressed")==="true"','request error keeps amount, mode and own WhatsApp choice');
    await check('window.flowCalls.filter(c=>c.url.includes("/actions/confirm-availability")&&c.method==="POST").length===1','no automatic retry after rejection');await button('Confirmar disponibilidad');await wait('document.body.textContent.includes("Esperando respuesta del cliente")');
    await check('(()=>{const c=window.flowCalls.filter(c=>c.url.includes("/actions/confirm-availability")&&c.method==="POST");return c.length===2&&JSON.stringify(c[0].body)===JSON.stringify(c[1].body)})()','explicit retry retains the identical payload and does not change to no reservation');results.push('business-fields-retained-'+code);
  }
  assert.equal(exceptions.length,0,JSON.stringify(exceptions));
  console.log(JSON.stringify({passed:true,results,realCheckoutAndCards:true,realMutations:0,screenshots:directory}));
} finally {
  socket?.close(); browser.kill(); await server.close();
}

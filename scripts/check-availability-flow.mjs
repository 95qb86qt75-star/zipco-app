// Real checkout + S2 cards; synthetic HTTP boundary, no QA credentials/mutations.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';

const directory = path.resolve('node_modules/.cache/availability-flow');
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
function Harness(){const [actor,setActor]=useState('checkout'),[revision,setRevision]=useState(0),[expanded,setExpanded]=useState(false);
 useEffect(()=>{window.switchRole=role=>{dismissAction();localStorage.setItem('zipco-token',role==='business'?'business-test-only':'customer-test-only');localStorage.setItem('zipco-user-id',role==='business'?'2':'1');if(role==='business')localStorage.setItem('zipco-business-id','5');else localStorage.removeItem('zipco-business-id');window.dispatchEvent(new Event('zipco-session-changed'));setActor(role);};window.testDriverReady=true;},[]);
 const business=actor==='business',order=business?normalizeBusinessOrdersPayload([orderFor(true)])[0]:normalizeMyOrdersPayload([orderFor(false)])[0];
 const refresh=()=>setRevision(r=>r+1);
 return <><main style={{padding:16,paddingTop:70,minHeight:'100dvh',background:'#f1f3fa'}}>{actor==='checkout'?<div style={{height:'100dvh'}}><CheckoutScreen business={{id:5,userId:2,name:'ZIPCO Negocio QA'}} currentUserId={1} selectedProducts={[5]} products={[{id:5,businessId:5,name:'Producto QA',description:'Producto de prueba',kind:'product',pricingMode:'fixed_price',priceClp:12000,isActive:true,imageUrl:''}]} onBack={()=>{}} onOrderComplete={()=>{dismissAction();setActor('customer');}} onCatalogConflict={()=>{}} onSessionExpired={()=>{}}/></div>:state.state==='CLOSED'?<ProcessHistoryCard key={actor+'history'} order={order}/>:<ProcessOrderCard key={actor} order={order} business={business} expanded={business&&state.state==='AWAITING_CUSTOMER_CONTINUATION'?expanded:true} onToggle={()=>setExpanded(v=>!v)} isUpdating={false} onRetry={refresh}/>}</main><ActionHologramHost/></>;
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
  const create=async width=>{await visit('',width);await button('Ahora');await button('Requiero este producto');await button('Enviar solicitud');await wait('document.body.textContent.includes("EN ESPERA")||document.body.textContent.includes("Enviar sin verificar el horario")');if(await evaluate('document.body.textContent.includes("Enviar sin verificar el horario")'))await button('Enviar sin verificar el horario');await wait('document.body.textContent.includes("EN ESPERA")');await role('business');await wait('document.body.textContent.includes("NUEVO PEDIDO")');};
  const confirmButton=async()=>{await evaluate(`document.querySelector('.zipco-av-business-actions .zipco-accept-btn').click()`);await wait('!!document.querySelector("[role=dialog]")');};
  const tap=async selector=>{const point=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});await delay(100);};
  const results=[];
  for(const width of [320,390,430]){
    if(width===430)await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await create(width);await shot(`p3-${width}`);await confirmButton();await shot(`p4-choice-${width}`);
    await click('.zipco-av-channel-pickup');await shot(`p4-pickup-${width}`);
    if(width!==320){await evaluate(`(()=>{const input=document.querySelector('input[placeholder="Ej.: hasta las 19:00"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(width===390?'Av. QA 123, hasta las 19:00':'Hasta las 19:00')});input.dispatchEvent(new Event('input',{bubbles:true}));})()`);await delay(80);}
    await button('Confirmar disponibilidad');
    await wait('document.body.textContent.includes("Esperando al cliente")');
    await evaluate('window.dispatchEvent(new CustomEvent("zipco-action-hologram",{detail:null}))');await delay(300);
    await check('!!document.querySelector(".zipco-avw[data-expanded=false]")','compact business card initially collapsed');
    await check('document.querySelector(".zipco-avw").getBoundingClientRect().height<=135','compact card height');
    const calls=await evaluate('window.flowCalls.length');
    await tap('.zipco-avw .zipco-product-thumb');await wait('!!document.querySelector(".zipco-product-sheet")');
    await check('!!document.querySelector(".zipco-avw[data-expanded=false]")','product tap does not toggle card');
    await check('document.querySelector(".zipco-product-prices").textContent.includes("Precio unitario")','unit price in existing product sheet');
    await click('.zipco-product-done');
    const folded=await evaluate('document.querySelector(".zipco-avw").getBoundingClientRect().height');
    await tap('.zipco-avw-name');
    const opening=await evaluate('document.querySelector(".zipco-avw").getBoundingClientRect().height');await delay(350);
    const opened=await evaluate('document.querySelector(".zipco-avw").getBoundingClientRect().height');
    if(width===390){
      assert(opening>folded&&opening<opened,'detail opens through intermediate heights');
      await tap('.zipco-avw-name');
      await wait('!!document.querySelector(".zipco-avw[data-expanded=false]")');
      await check('[...document.querySelectorAll(".zipco-avw-reveal")].every(node=>node.inert)','exiting controls cannot receive focus or taps');
      const closing=await evaluate('document.querySelector(".zipco-avw").getBoundingClientRect().height');await delay(300);
      assert(closing>folded&&closing<opened,'detail closes through intermediate heights');
      await check('document.querySelectorAll(".zipco-avw-reveal").length===0','closed content unmounts');
      await tap('.zipco-avw-name');await delay(350);
    }
    if(width===430){assert(Math.abs(opening-opened)<1,'reduced motion opens without animation');await send('Emulation.setEmulatedMedia',{features:[]});}
    await wait('!!document.querySelector(".zipco-avw[data-expanded=true]")');
    await check('document.querySelector(".zipco-avw-rows").textContent.includes("Retiro en el local")','pickup detail uses server path');
    await check('document.querySelector(".zipco-avw-rows").textContent.includes("Dónde y cuándo")==='+(width!==320),'optional schedule/address row uses honest label');
    await check('!document.querySelector(".zipco-avw-chips").textContent.includes("19:00")','free-form address is not advertised as a time chip');
    await check('window.flowCalls.length==='+calls,'opening UI does not call or mutate backend');
    await shot(`availability-waiting-pickup-${width}`);
    await role('customer');await wait('document.body.textContent.includes("DISPONIBLE")');
    await check('![...document.querySelectorAll("a")].some(a=>a.href.includes("wa.me"))','no contact URL before agreement');await shot(`p5-pickup-${width}`);
    await check('document.documentElement.scrollWidth<=innerWidth','mobile layout');
    await button('Sí, continuar con la compra');await wait('document.body.textContent.includes("Pendiente de retiro en el local")');
    await role('business');await wait('document.body.textContent.includes("Pendiente de retiro en el local")');
    await evaluate('window.dispatchEvent(new CustomEvent("zipco-notification-card-open",{detail:{id:"order-20"}}))');
    await wait('document.body.textContent.includes("Cancelar retiro")');
    // Progress cards keep their own notification opening signal; click collapsed row if needed.
    await evaluate('document.querySelector(".zipco-co-colrow[data-folded=true]")?.click()');await delay(100);
    await button('Cancelar retiro');await wait('!!document.querySelector("[role=dialog]")');
    await evaluate(`(()=>{const t=document.querySelector('textarea');const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;setter.call(t,'No podré atender el retiro');t.dispatchEvent(new Event('input',{bubbles:true}))})()`);await delay(80);await button('Confirmar');
    await wait('document.body.textContent.includes("Retiro cancelado por el negocio")');
    await check('window.flowCalls.filter(c=>c.method==="POST").length===4','create, confirm, continue, cancel only');
    results.push(`pickup-${width}`);
  }
  await create(390);await confirmButton();await click('.zipco-av-channel-whatsapp');await wait('document.body.textContent.includes("Esperando al cliente")');
  await evaluate('window.dispatchEvent(new CustomEvent("zipco-action-hologram",{detail:null}))');await delay(300);await tap('.zipco-avw-name');
  await check('[...document.querySelectorAll(".zipco-avw-rows dt")].map(n=>n.textContent).join("|")==="Pedido para|Cómo continúan"','WhatsApp has no pickup-only message or schedule');await shot('availability-waiting-whatsapp');
  await role('customer');await wait('document.body.textContent.includes("DISPONIBLE")');await shot('p5-whatsapp');
  await click('[role=switch]');await button('Sí, continuar con la compra');await wait('document.querySelector("[data-aurora-state=COORDINATION_PENDING]")!==null');
  await check('window.flowCalls.find(c=>c.url.includes("continue-request")).body.customerContactPreference.allowed===false','final consent independent');
  results.push('whatsapp-without-customer-consent');
  await create(390);await confirmButton();await click('.zipco-av-channel-whatsapp');await wait('document.body.textContent.includes("Esperando al cliente")');await role('customer');await wait('document.body.textContent.includes("DISPONIBLE")');
  await button('No, gracias');await wait('!!document.querySelector("[role=alertdialog]")');await button('No, gracias');await wait('document.body.textContent.includes("El cliente decidió no continuar")');
  results.push('decline-without-agreement');
  await create(390);await confirmButton();await click('.zipco-av-channel-whatsapp');await wait('document.body.textContent.includes("Esperando al cliente")');
  await click('.zipco-avw-toggle');await button('Retirar disponibilidad');await wait('!!document.querySelector("[role=alertdialog]")');await button('Retirar disponibilidad');await wait('document.body.textContent.includes("El negocio retiró la disponibilidad")');results.push('business-withdrawal');
  const fill=async(selector,value)=>{await evaluate(`(()=>{const input=document.querySelector(${JSON.stringify(selector)});if(!input)throw Error('Missing field');const setter=Object.getOwnPropertyDescriptor(input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set;setter.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}))})()`);await delay(80);};
  const draft=async(price,channel,allowsContact=false)=>{
    await wait('!!document.querySelector("[aria-label=Precio]")');await click('[aria-label=Precio]');await fill('[aria-label="Nuevo precio por unidad"]',String(price));await button('Guardar');
    await fill('textarea[placeholder="Ej: Puedo ofrecerte esta alternativa porque…"]','Cambio de precio para la prueba');await button('Revisar alternativa');await button('Confirmar y enviar');
    if(channel){await wait('!!document.querySelector(".zipco-av-channel-pickup")');
      if(channel==='pickup'&&price===11000){const posts=await evaluate('window.flowCalls.filter(c=>c.method==="POST").length');await button('Volver');await wait('!document.querySelector(".zipco-av-channel-pickup")');await check('document.querySelector("[data-alternative-body]").textContent.includes("11.000")','return preserves reviewed changes');await check(`window.flowCalls.filter(c=>c.method==="POST").length===${posts}`,'return does not send the alternative');await button('Confirmar y enviar');await wait('!!document.querySelector(".zipco-av-channel-pickup")');}
      await click(`.zipco-av-channel-${channel}`);if(channel==='pickup'){await fill('.zipco-av-timeline textarea','Retira por la entrada lateral');await fill('.zipco-av-timeline input','Local QA · hasta las 19:00');if(allowsContact)await button('Sí, permitir');await button('Usar este camino');}}
    await wait('!document.querySelector("[data-alternative-footer]")');
  };
  const propose=async(channel,allowsContact=false)=>{await create(390);await click('[aria-label="Proponer alternativa"]');await wait('!!document.querySelector("[aria-label=Precio]")');await check('!document.querySelector(".zipco-av-channel-pickup")','alternative opens its original editor before choosing fulfillment');await shot('alternative-original-editor');await draft(11000,channel,allowsContact);};
  const counter=async()=>{await click('[aria-label="Hacer mi única contrapropuesta"]');await wait('!!document.querySelector("[aria-label=Precio]")');await check('document.querySelectorAll(".zipco-alt-tile").length===4&&!!document.querySelector("textarea")&&document.body.textContent.includes("Agregar foto de referencia")','counter uses the same complete alternative editor');await check('!document.querySelector(".zipco-av-channel-pickup")','counter keeps the existing path');await shot('customer-counter-editor');};
  await propose('pickup');await role('customer');await button('Revisar historial y responder');await button('Aceptar propuesta');await button('Sí, confirmar');await wait('document.body.textContent.includes("Pendiente de retiro en el local")');
  await check('window.flowCalls.find(c=>c.url.includes("accept-proposal")).body.customerContactPreference.allowed===false','pickup alternative does not share the customer phone');results.push('alternative-pickup-accept');
  await propose('whatsapp');await role('customer');await button('Revisar historial y responder');await counter();await draft(10000);await role('business');await button('Revisar propuesta y responder');await button('Aceptar contrapropuesta');await button('Sí, confirmar');await wait('!!document.querySelector("[data-aurora-state=COORDINATION_PENDING]")');
  await check('window.flowCalls.find(c=>c.url.includes("counter-proposal")).body.customerContactPreference.allowed===true','counter records its own customer preference');await check('window.flowCalls.find(c=>c.url.includes("accept-counter-proposal")).body.businessContactConsent.textVersion==="availability-business-whatsapp-v1"','business accepts with its own consent');results.push('counter-whatsapp-accept');
  for(const channel of ['whatsapp','pickup']){
    await propose(channel,true);await role('customer');await button('Revisar historial y responder');await counter();await draft(10000);await role('business');await button('Revisar propuesta y responder');await button('Proponer alternativa final');await draft(10500);
    await check(`(()=>{const calls=window.flowCalls;const first=calls.find(c=>c.url.includes('propose-alternative')).body.fulfillment;const final=calls.find(c=>c.url.includes('propose-final')).body.fulfillment;return JSON.stringify(first)===JSON.stringify(final)})()`,'final preserves path, instructions and own consent without asking again');
    await check('!document.querySelector(".zipco-av-channel-pickup")','final does not reopen fulfillment choice');await role('customer');await button('Revisar historial y responder');await button('Aceptar propuesta');await button('Sí, confirmar');await wait(channel==='pickup'?'document.body.textContent.includes("Pendiente de retiro en el local")':'!!document.querySelector("[data-aurora-state=COORDINATION_PENDING]")');results.push(`final-proposal-keeps-${channel}`);
  }
  assert.equal(exceptions.length,0,JSON.stringify(exceptions));
  console.log(JSON.stringify({passed:true,results,realCheckoutAndCards:true,realMutations:0,screenshots:directory}));
} finally {
  socket?.close(); browser.kill(); await server.close();
}

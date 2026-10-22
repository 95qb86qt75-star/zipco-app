// Real React and compiled QA CSS with synthetic snapshots only. No backend access.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const directory = path.resolve('node_modules/.cache/order-card-aurora-browser');
const assets = path.resolve('node_modules/.cache/business-alternative-draft-qa/assets');
fs.mkdirSync(directory, { recursive: true });
await build({ stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
import ProcessOrderCard from './src/app/screens/requests/ProcessOrderCard';
import ProcessHistoryCard from './src/app/screens/requests/ProcessHistoryCard';
import MyOrderCard from './src/app/screens/requests/MyOrderCard';
import BusinessOrderCard from './src/app/screens/requests/BusinessOrderCard';
import {OrderHistoryList} from './src/app/screens/requests/CompactHistoryList';
import {proposalsFixture} from './src/app/screens/requests/proposalFixtures';
import {normalizeBusinessOrdersPayload,normalizeMyOrdersPayload} from './src/app/screens/requests/orderNormalization';
import {rawOrder,coordinationProcess,agreementFixture} from './src/app/screens/requests/requestProcessFixtures';
import {cancelledPendingOrder} from './src/app/screens/requests/pendingCancellationFixtures';
import ActionHologramHost,{announceAction,dismissAction} from './src/app/screens/requests/ActionHologram';
import {rejectedPendingOrder} from './src/app/screens/requests/pendingRejectionFixtures';
window.React=React;window.action=announceAction;window.dismissAction=dismissAction;window.posts=0;window.reads=0;let redraw=()=>{},state='AWAITING_BUSINESS_RESPONSE',business=true,legacy=false;
const pendingBusinessRead=()=>{const read=proposalsFixture(0,true);read.process.allowedActions.push('REJECT_PENDING_REQUEST');return read;};
window.fetch=async(input,options={})=>{if(options.method&&options.method!=='GET'){window.posts++;throw Error('Actions are forbidden in this visual fixture');}
 if(String(input).endsWith('/proposals'))return new Response(JSON.stringify(pendingBusinessRead()));
 if(String(input).endsWith('/agreement')){window.reads++;return new Response(JSON.stringify(agreementFixture));}throw Error('Unexpected fixture read');};
window.show=(next,role,old=false)=>{state=next;business=role;legacy=old;redraw();};
function App(){const [revision,setRevision]=useState(0);redraw=()=>setRevision(n=>n+1);
 localStorage.setItem('zipco-token','synthetic-session');localStorage.setItem('zipco-user-id',business?'12':'11');
 if(business)localStorage.setItem('zipco-business-id','8');else localStorage.removeItem('zipco-business-id');
 const sequences=['AWAITING_BUSINESS_RESPONSE','AWAITING_CUSTOMER_DECISION','AWAITING_BUSINESS_COUNTER_RESPONSE','AWAITING_CUSTOMER_FINAL_DECISION'];
 const sequence=sequences.indexOf(state);const read=sequence===0&&business?pendingBusinessRead():proposalsFixture(Math.max(0,sequence),business);
 const coordinated={...coordinationProcess,state:state==='READY_ACK'?'READY':state,readyNoticeAcknowledged:state==='READY_ACK',
  coordination:{customerContactAuthorized:false,businessContactAuthorized:false},
  allowedActions:state==='IN_PROGRESS'?business?['MARK_READY']:[]:state.startsWith('READY')?business?[]:state==='READY_ACK'?['CONFIRM_RECEIPT']:['ACK_READY_NOTICE']:state==='COMPLETED'?[]:business?['AUTHORIZE_CONTACT','OPEN_WHATSAPP','START_WORK','ANNUL_COORDINATION']:['AUTHORIZE_CONTACT']};
 const source=state==='CANCELLED'?cancelledPendingOrder:state==='REJECTED'?rejectedPendingOrder:rawOrder;
 const raw={...source,customerName:'Cliente sintético con nombre extenso de prueba',businessName:'Negocio sintético con nombre extenso de prueba',
  referencePhoto:null,status:legacy?state:sequence===0?'pending':sequence>0?'alternative_proposed':state.startsWith('READY')?'ready':state==='COMPLETED'?'completed':state==='CANCELLED'?'cancelled':state==='REJECTED'?'rejected':'accepted',
  requestProcess:legacy?null:state==='CANCELLED'||state==='REJECTED'?source.requestProcess:sequence>=0?read.process:coordinated};
 const order=(business?normalizeBusinessOrdersPayload:normalizeMyOrdersPayload)([raw])[0];window.recordAvailable=order.recordState==='available'&&!order.requestProcessInvalid;
 const props={isUpdating:false,onRetry:()=>{},onAction:()=>{},isUnread:true};
 return <><ActionHologramHost/><main style={{padding:12}} key={revision}><div data-card-fixture>
  {legacy?['completed','cancelled','rejected'].includes(state)?<OrderHistoryList orders={[order]} owner={business?'business':'customer'} deleted={false} onArchive={()=>{}}/>
   :business?<BusinessOrderCard {...props} request={order}/>:<MyOrderCard {...props} order={order}/>
   :['COMPLETED','CANCELLED','REJECTED'].includes(state)?<ProcessHistoryCard order={order}/>:<ProcessOrderCard {...props} order={order} business={business}/>}</div></main></>;
}createRoot(document.getElementById('root')).render(<App/>);
` }, bundle: true, format: 'esm', jsx: 'automatic', outfile: path.join(directory, 'fixture.js'),
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' } });
const css = fs.readFileSync(path.join(assets, fs.readdirSync(assets).find(name => name.endsWith('.css'))));
const html = '<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root" style="overflow:auto;height:100dvh"></div><script type="module" src="/fixture.js"></script></body></html>';
const server = http.createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/fixture.js'?'text/javascript':req.url==='/fixture.css'?'text/css':'text/html');res.end(req.url==='/fixture.js'?fs.readFileSync(path.join(directory,'fixture.js')):req.url==='/fixture.css'?css:html);});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const profile=path.join(directory,`profile-${Date.now()}`);
const browser=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--disable-background-networking','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));let socket;
try {
 const portFile=path.join(profile,'DevToolsActivePort');for(let i=0;!fs.existsSync(portFile)&&i<200;i++)await delay(50);
 let port;for(let i=0;i<40&&!port;i++){try{port=fs.readFileSync(portFile,'utf8').split('\n')[0];}catch{await delay(50);}}
 if(!port)throw Error('Chrome debugging port did not become readable');
 const tabs=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
 socket=new WebSocket(tabs.find(tab=>tab.type==='page').webSocketDebuggerUrl);await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
 const pending=new Map();let sequence=0;socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(!pending.has(m.id))return;const {resolve,reject}=pending.get(m.id);pending.delete(m.id);m.error?reject(Error(m.error.message)):resolve(m.result);});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 const wait=async expression=>{for(let i=0;i<100;i++){if(await evaluate(expression))return;await delay(50);}await send('Page.captureScreenshot',{format:'png'}).then(shot=>fs.writeFileSync(path.join(directory,'failed-fixture.png'),Buffer.from(shot.data,'base64')));throw Error('Fixture did not settle: '+expression+'; synthetic text: '+await evaluate('document.body.textContent.slice(-1500)'));};
 const touch=async selector=>{const p=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||!e.getClientRects().length)throw Error('Missing visible control');e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};})()`);await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(100);};
 await send('Network.enable');await send('Network.setBlockedURLs',{urls:['https://*']});await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`});await wait('!!window.show');
 const evidence=[];
 for(const width of [320,393,400])for(const dark of [false,true]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:852,deviceScaleFactor:1,mobile:true});
  await evaluate(`document.documentElement.classList.toggle('dark',${dark})`);
  for(const business of [false,true])for(const state of ['AWAITING_BUSINESS_RESPONSE','AWAITING_CUSTOMER_DECISION','AWAITING_BUSINESS_COUNTER_RESPONSE','AWAITING_CUSTOMER_FINAL_DECISION','COORDINATION_PENDING','COORDINATING','IN_PROGRESS','READY','READY_ACK','COMPLETED','CANCELLED','REJECTED']){
   await evaluate(`window.show(${JSON.stringify(state)},${business})`);await wait('window.recordAvailable&&!!document.querySelector(":is(.zipco-aurora-card,.zipco-co-dk)")');await delay(65);
   if(['COORDINATION_PENDING','COORDINATING','IN_PROGRESS','READY','READY_ACK'].includes(state))await wait('document.querySelector(":is(.zipco-aurora-price,[data-agreement-price])").textContent.includes("2.000")');
   // The clipped decorative pseudo-elements intentionally extend 50px outside the card.
   const geometry=await evaluate(`(()=>{const card=document.querySelector(':is(.zipco-aurora-card,.zipco-co-dk)'),rect=card.getBoundingClientRect(),wide=[...card.querySelectorAll('*')].filter(e=>!e.closest('[aria-hidden="true"]')&&e.getBoundingClientRect().right>rect.right+1).map(e=>e.className);return {ok:rect.left>=0&&rect.right<=innerWidth+1&&wide.length===0&&document.documentElement.scrollWidth<=innerWidth,wide,price:document.querySelector(':is(.zipco-aurora-price,[data-agreement-price])').textContent,body:card.textContent};})()`);
   if(!geometry.ok)await send('Page.captureScreenshot',{format:'png'}).then(shot=>fs.writeFileSync(path.join(directory,'overflow.png'),Buffer.from(shot.data,'base64')));
   assert(geometry.ok,`Card overflow: ${width}/${dark}/${business}/${state} ${JSON.stringify(geometry)}`);
   if(business&&['COORDINATION_PENDING','COORDINATING'].includes(state)){
    assert(geometry.body.includes('Todo listo para')&&geometry.body.includes('Autorizo comenzar')&&geometry.body.includes('por WhatsApp'),'Business coordination retains the approved contact design and separate actions');
    const loops=await evaluate(`document.querySelector('.zipco-co-dk').getAnimations({subtree:true}).filter(a=>a.effect.getTiming().iterations===Infinity&&a.playState==='running').map(a=>({name:a.animationName,target:a.effect.target.className}))`);
    assert.equal(loops.length,0,`List contact decoration has no infinite animation: ${JSON.stringify(loops)}`);
    if(width===393&&!dark&&state==='COORDINATION_PENDING')await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true}).then(shot=>fs.writeFileSync(path.join(directory,'business-coordination-holo.png'),Buffer.from(shot.data,'base64')));
   }
   if(state==='IN_PROGRESS')assert(geometry.body.includes(business?'Notificar pedido listo':'preparando tu pedido'));
   if(state==='READY')assert(geometry.body.includes(business?'Esperando que el cliente':'Confirmar aviso'));
   if(state==='READY_ACK')assert(geometry.body.includes(business?'Pendiente de retiro':'Confirmar recepción'));
   if(state==='AWAITING_BUSINESS_RESPONSE')assert(geometry.body.includes(business?'Nuevo pedido':'Pendiente de respuesta'));
   evidence.push(`${width}/${dark?'dark':'light'}/${business?'business':'customer'}/${state}`);
  }
  for(const business of [false,true])for(const state of ['pending','alternative_proposed','accepted','ready','completed','cancelled','rejected']){
   await evaluate(`window.show(${JSON.stringify(state)},${business},true)`);await delay(75);
   assert(await evaluate('!!document.querySelector(":is(.zipco-aurora-card,.zipco-co-dk)")'),'Legacy card retains Aurora');
   if(['completed','cancelled','rejected'].includes(state))assert.equal(await evaluate(`getComputedStyle(document.querySelector(':is(.zipco-aurora-card,.zipco-co-dk)')).animationName`),'none','History swipe transform belongs to Motion');
   await evaluate(`document.querySelector(':is(.zipco-aurora-price,[data-agreement-price])').textContent='$50.000.000'`);
   assert(await evaluate(`(()=>{const card=document.querySelector(':is(.zipco-aurora-card,.zipco-co-dk)'),r=card.getBoundingClientRect();return [...card.querySelectorAll('.zipco-aurora-header *')].every(e=>e.getBoundingClientRect().right<=r.right+1);})()`),'Large totals stay inside legacy headers');
   evidence.push(`${width}/${dark?'dark':'light'}/legacy/${business}/${state}`);
  }
  await evaluate(`window.show('AWAITING_BUSINESS_RESPONSE',true)`);await wait('!!document.querySelector(\'.zipco-pending-business-responses[data-expanded="false"]\')');
  assert(await evaluate(`document.querySelector('.zipco-pending-business-responses').inert&&document.querySelector('.zipco-pending-business-body').getBoundingClientRect().height<1`),'Pending response buttons are hidden and inert initially');
  await evaluate(`window.revealFrames=[];window.revealEnd=performance.now()+800;requestAnimationFrame(function sample(){const body=document.querySelector('.zipco-pending-business-body'),r=body.getBoundingClientRect();const visible=s=>{const e=document.querySelector(s);if(!e||getComputedStyle(body.parentElement).visibility==='hidden')return false;const er=e.getBoundingClientRect();return Math.min(r.bottom,er.bottom)-Math.max(r.top,er.top)>1;};window.revealFrames.push({height:r.height,visible:['[data-pending-order-detail]','.zipco-accept-btn','.zipco-glass-btn','.zipco-reject-btn','.zipco-hide-order-detail'].map(visible)});if(performance.now()<window.revealEnd)requestAnimationFrame(sample);else window.revealDone=true;});true`);
  await touch('.zipco-open-panel');await wait('window.revealDone===true');
  const frames=await evaluate('window.revealFrames');
  assert(frames.some(f=>f.height>1&&f.height<frames.at(-1).height-1),'Opening has intermediate heights');
  assert(frames.every(f=>f.visible.every((shown,index)=>!shown||f.visible.slice(0,index).every(Boolean))),'Each frame reveals detail, accept, propose, reject and hide in order');
  await evaluate('window.revealDone=false');
  assert.deepEqual(await evaluate(`[...document.querySelector('article').querySelectorAll('button')].filter(b=>b.getClientRects().length).map(b=>(b.querySelector('.zipco-accept-label')?.textContent||b.textContent).trim())`),['Aceptar pedido','Proponer alternativa','Rechazar solicitud','Ocultar detalle']);
  assert.notEqual(await evaluate(`getComputedStyle(document.querySelector('.zipco-hide-order-detail')).boxShadow`),'none');
  await send('Page.captureScreenshot',{format:'png'}).then(shot=>fs.writeFileSync(path.join(directory,`pending-expanded-${width}-${dark?'dark':'light'}.png`),Buffer.from(shot.data,'base64')));
  await evaluate(`window.savedReject=document.querySelector('.zipco-reject-btn');window.savedProposal=document.querySelector('.zipco-glass-btn');true`);
  for (const selector of ['.zipco-accept-wrap','.zipco-glass-wrap','.zipco-reject-wrap']) {
   await evaluate(`document.querySelector('${selector}').scrollIntoView({block:'center'});true`);
   await wait(`document.querySelector('${selector}').dataset.responseMotion==='active'`);
   assert.equal(await evaluate(`getComputedStyle(document.querySelector('${selector} i')).animationIterationCount`),'infinite','Visible expanded buttons retain moving light');
   assert.equal(await evaluate(`getComputedStyle(document.querySelector('${selector} button'),'::after').animationIterationCount`),'infinite','Visible button sheen repeats');
   if(selector==='.zipco-accept-wrap') {
    const parity=await evaluate(`(()=>{const live=document.querySelector('.zipco-accept-wrap'),reference=live.cloneNode(true);reference.style.position='fixed';reference.style.top='-10000px';document.body.append(reference);const sample=root=>[null,'.zipco-accept-check','.zipco-accept-b1','.zipco-accept-b2','.zipco-accept-b3','.zipco-accept-btn'].map(selector=>{const element=selector?root.querySelector(selector):root;return [null,...(selector==='.zipco-accept-btn'?['::after']:[])].map(pseudo=>{const style=getComputedStyle(element,pseudo);return ['animationName','animationDuration','animationDelay','animationIterationCount','animationTimingFunction','backgroundImage','filter','backdropFilter','borderRadius'].map(key=>style[key]);});});const result={live:sample(live),reference:sample(reference)};reference.remove();return result;})()`);
    assert.deepEqual(parity.live,parity.reference,'Accept order matches the proposal acceptance glass, halo, check, lights and sheen');
    await evaluate(`document.querySelector('.zipco-accept-wrap').style.transform='translateY(2000px)';true`);
    await wait(`document.querySelector('.zipco-accept-wrap').dataset.responseMotion==='idle'`);
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.zipco-accept-wrap')).animationName`),'none','Order halo stops offscreen');
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.zipco-accept-check')).animationName`),'none','Order check stops offscreen');
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.zipco-accept-btn')).backdropFilter`),'none','Order glass filter stops offscreen');
    await evaluate(`document.querySelector('.zipco-accept-wrap').style.transform='';true`);
   }
  }
  await evaluate(`Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));true`);
  assert.equal(await evaluate(`document.querySelectorAll('[data-response-motion="active"]').length`),0,'Background document stops response effects');
  await evaluate(`delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));document.querySelector('.zipco-reject-wrap').style.transform='translateY(2000px)';true`);
  await wait(`document.querySelector('.zipco-reject-wrap').dataset.responseMotion==='idle'`);
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.zipco-reject-blob')).animationName`),'none','Offscreen button has no animation');
  await evaluate(`document.querySelector('.zipco-reject-wrap').style.transform='';true`);
  await touch('.zipco-reject-btn');await wait('!!document.querySelector("[role=alertdialog] select")');
  await evaluate(`(()=>{const e=document.querySelector('select');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,'other');e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await wait('!!document.querySelector("textarea")');
  await evaluate(`(()=>{const e=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,'Motivo sintético conservado');e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  // Programmatic fold models a parent collapse while a portal is open; it must retain local state.
  await evaluate(`document.querySelector('.zipco-hide-order-detail').click()`);await delay(100);
  assert.equal(await evaluate(`document.querySelector('textarea').value`),'Motivo sintético conservado');
  assert(await evaluate(`document.querySelector('.zipco-pending-business-responses').inert`),'Closing blocks interaction immediately');
  assert.equal(await evaluate(`document.querySelectorAll('[data-response-motion="active"]').length`),0,'Folded buttons stop response effects');
  await touch('[role=alertdialog] button');await wait('!document.querySelector("[role=alertdialog]")');
  await wait('!!document.querySelector(".zipco-open-panel")');await touch('.zipco-open-panel');await delay(650);
  assert(await evaluate(`window.savedReject===document.querySelector('.zipco-reject-btn')&&window.savedProposal===document.querySelector('.zipco-glass-btn')`),'Folding retains response components');
  await touch('.zipco-glass-btn');await wait('!!document.querySelector("[role=dialog] textarea")');
  await evaluate(`(()=>{const e=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,'Borrador sintético conservado');e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await evaluate(`document.querySelector('.zipco-hide-order-detail').click()`);await delay(100);
  assert.equal(await evaluate(`document.querySelector('textarea').value`),'Borrador sintético conservado');
  await touch('button[aria-label="Cerrar alternativa"]');await wait('!document.querySelector("textarea")');
  await evaluate(`document.querySelector('[aria-label="Cerrar propuestas"]')?.click()`);await wait('!document.querySelector("[role=dialog]")');
  assert.equal(await evaluate('window.posts'),0,'Review, cancellation and folding never submit order actions');
  evidence.push(`${width}/${dark?'dark':'light'}/pending-fold-and-retained-forms`);
 }
 await evaluate(`window.show('completed',true,true)`);await delay(650);
 const drag=await evaluate(`(()=>{const r=document.querySelector('[data-aurora-history]').getBoundingClientRect();return {x:r.left+r.width*.8,y:r.top+r.height/2};})()`);
 await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[drag]});
 for(const offset of [10,40,80,140]){await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:drag.x-offset,y:drag.y}]});await delay(45);}
 await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(650);
 assert(await evaluate(`new DOMMatrixReadOnly(getComputedStyle(document.querySelector('[data-aurora-history]')).transform).m41 < -45`),'Legacy history still moves horizontally after a touch swipe');
 await evaluate(`window.show('AWAITING_CUSTOMER_DECISION',false)`);await delay(650);
 await send('Page.captureScreenshot',{format:'png'}).then(shot=>fs.writeFileSync(path.join(directory,'negotiation-400.png'),Buffer.from(shot.data,'base64')));
 await evaluate(`document.querySelector('article').classList.add('zipco-notification-target')`);
 assert.equal(await evaluate(`getComputedStyle(document.querySelector('article'),'::after').content`),'"Abierta desde la notificación"');
 assert.equal(await evaluate(`getComputedStyle(document.querySelector('article')).animationName`),'zipco-notification-focus');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 assert.equal(await evaluate(`getComputedStyle(document.querySelector('article')).animationName`),'none');
 assert.equal(await evaluate(`getComputedStyle(document.querySelector('.zipco-glass-blob')).animationName`),'none');
 await send('Page.captureScreenshot',{format:'png'}).then(shot=>fs.writeFileSync(path.join(directory,'notification-400.png'),Buffer.from(shot.data,'base64')));
 await evaluate(`window.show('AWAITING_BUSINESS_RESPONSE',true)`);await wait('!!document.querySelector(".zipco-open-panel")');
 await touch('.zipco-open-panel');
 assert.equal(await evaluate(`getComputedStyle(document.querySelector('.zipco-pending-business-responses')).transitionDuration`),'0s','Reduced motion removes the reveal transition');
 await delay(100);
 assert.equal(await evaluate(`document.querySelectorAll('[data-response-motion="active"]').length`),0,'Reduced motion keeps response effects static');
 await evaluate(`window.show('COORDINATION_PENDING',false)`);await wait('!!document.querySelector(".zipco-open-panel")');
 await evaluate(`document.querySelector('.zipco-open-panel').click()`);await wait('document.querySelector("article").textContent.includes("Nota acordada")');
 await delay(650);
 assert.equal(await evaluate('window.posts'),0,'Disclosure does not submit an action');
 await send('Page.captureScreenshot',{format:'png'}).then(shot=>fs.writeFileSync(path.join(directory,'coordination-expanded-400.png'),Buffer.from(shot.data,'base64')));
 await send('Emulation.setCPUThrottlingRate',{rate:4});
 for(const business of [false,true])for(const reduced of [false,true]){
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]});
  await evaluate(`window.show('COORDINATION_PENDING',${business})`);
  await wait('!!document.querySelector(".zipco-open-panel,.zipco-co-strip2")&&document.querySelector(":is(.zipco-aurora-price,[data-agreement-price])").textContent.includes("2.000")');
  await evaluate(`window.conditionsReads=window.reads;window.coordinationNode=document.querySelector('[aria-label="Acciones de coordinación"]');true`);
  for(let repeat=0;repeat<3;repeat++){
   if(business){
    await evaluate(`document.querySelector('.zipco-co-strip2').click()`);await wait('!!document.querySelector("[data-coordination-sheet]")');
    await delay(200);await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Ver acuerdo completo')).click()`);
   }else await evaluate(`document.querySelector('.zipco-open-panel').click()`);
   await wait('!!document.querySelector(".zipco-accepted-conditions-reveal")');
   if(business){await wait('!document.querySelector("[data-coordination-sheet]")');await delay(80);}
   const frames=await evaluate(`new Promise(resolve=>{let frames=[];function sample(){const e=document.querySelector('.zipco-accepted-conditions-reveal');frames.push({height:e.getBoundingClientRect().height,animations:e.getAnimations().map(a=>({duration:a.effect.getTiming().duration,keys:Object.keys(a.effect.getKeyframes()[0])}))});if(frames.length<8)requestAnimationFrame(sample);else resolve(frames);}requestAnimationFrame(sample);})`);
   assert(frames.every(f=>Math.abs(f.height-frames[0].height)<1),`Accepted detail height is stable across reveal frames (${business}/${reduced}): ${JSON.stringify(frames.map(f=>f.height))}`);
   assert(frames.every(f=>f.animations.every(a=>a.duration<=120&&!a.keys.some(k=>['height','transform','filter'].includes(k)))),'Detail uses a short opacity reveal without layout animation');
   if(reduced)assert(frames.every(f=>f.animations.length===0),'Reduced motion opens without animation');
   assert(await evaluate(`window.coordinationNode===document.querySelector('[aria-label="Acciones de coordinación"]')`),'Contact controls stay mounted during reveal');
   if(business)await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Ocultar condiciones').click()`);
   else await evaluate(`document.querySelector('.zipco-open-panel').click()`);
   await wait('!document.querySelector(".zipco-accepted-conditions-reveal")');
  }
  assert.equal(await evaluate('window.reads-window.conditionsReads'),0,'Repeated disclosure does not read the agreement again');
 }
 assert.equal(await evaluate('window.posts'),0,'Disclosure does not perform order actions');
 await send('Emulation.setCPUThrottlingRate',{rate:1});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 for(const width of [320,360,393,400]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:852,deviceScaleFactor:1,mobile:true});
  await evaluate(`window.show('COORDINATION_PENDING',true)`);await delay(200);await wait('!!document.querySelector(".zipco-co-strip2")&&!!document.querySelector(".zipco-co-fold")');
  await touch('.zipco-co-fold');await wait('!!document.querySelector(".zipco-co-colrow")');assert(await evaluate(`document.querySelector('.zipco-co-colrow').getAttribute('aria-expanded')==='false'`),'O card folds');
  await touch('.zipco-co-colrow');await wait('!!document.querySelector(".zipco-co-strip2")');await touch('.zipco-co-strip2');await wait('!!document.querySelector("[data-coordination-sheet]")');await delay(230);
  assert(await evaluate(`(()=>{const r=document.querySelector('[data-coordination-sheet]').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;})()`),'Condition sheet stays inside the mobile viewport');
  await send('Page.captureScreenshot',{format:'png'}).then(shot=>fs.writeFileSync(path.join(directory,`conditions-o-${width}.png`),Buffer.from(shot.data,'base64')));
  await evaluate(`document.querySelector('[data-coordination-sheet] .zipco-co-lnk').click()`);await wait('!document.querySelector("[data-coordination-sheet]")');
  await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Anular solicitud').click()`);await wait('!!document.querySelector(".zipco-co-rs")');
  await evaluate(`[...document.querySelectorAll('.zipco-co-r')].find(b=>b.textContent.includes('Otro motivo')).click()`);await wait('!!document.querySelector(".zipco-co-ta")');
  assert(await evaluate(`document.querySelector('.zipco-co-danger').disabled`),'Other reason requires an explanation before submission');
  await send('Page.captureScreenshot',{format:'png'}).then(shot=>fs.writeFileSync(path.join(directory,`annul-o-${width}.png`),Buffer.from(shot.data,'base64')));
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await wait('!document.querySelector("[data-coordination-sheet]")');
 }
 for(const kind of ['alternative','final','counter','authorized','redirecting','ready','rejected','annulled']){
  await evaluate(`window.action('${kind}')`);await wait('!!document.querySelector(".zipco-ah")');await delay(650);
  assert(await evaluate(`(()=>{const e=document.querySelector('.zipco-ah-d');return e.getBoundingClientRect().right<=innerWidth&&e.textContent.length>10;})()`),'Q message fits the mobile viewport');
  await send('Page.captureScreenshot',{format:'png'}).then(shot=>fs.writeFileSync(path.join(directory,`action-${kind}.png`),Buffer.from(shot.data,'base64')));
 }
 await evaluate(`window.dismissAction()`);await wait('!document.querySelector(".zipco-ah")');
 await evaluate(`window.action('authorized',{key:'dedup-check'});true`);await wait('!!document.querySelector(".zipco-ah")');
 await evaluate(`window.savedAction=document.querySelector('.zipco-ah');window.action('authorized',{key:'dedup-check'});true`);
 assert(await evaluate(`window.savedAction===document.querySelector('.zipco-ah')`),'Duplicate action feedback does not restart');
 await evaluate(`window.action('counter')`);await delay(100);assert(await evaluate(`window.savedAction!==document.querySelector('.zipco-ah')`),'A new action replaces the feedback');
 await delay(4400);assert.equal(await evaluate(`!!document.querySelector('.zipco-ah')`),false,'Q feedback clears after 4.3 seconds');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await evaluate(`window.action('annulled')`);await wait('!!document.querySelector(".zipco-ah")');
 assert.equal(await evaluate(`document.querySelector('.zipco-ah').getAnimations({subtree:true}).length`),0,'Reduced motion Q is static');
 await delay(2300);assert.equal(await evaluate(`!!document.querySelector('.zipco-ah')`),false,'Reduced Q clears after 2.2 seconds');
 await evaluate(`window.action('authorized');localStorage.setItem('zipco-user-id','another-session');window.dispatchEvent(new Event('zipco-session-changed'));true`);
 await delay(100);assert.equal(await evaluate(`!!document.querySelector('.zipco-ah')`),false,'Session change removes Q feedback');
 console.log(JSON.stringify({passed:evidence.length,states:12,widths:[320,393,400],themes:['light','dark'],roles:['customer','business'],pendingFold:true,actionOrder:true,orderedAnimationFrames:true,retainedForms:true,hideDetailGlow:true,legacyActive:true,historySwipe:true,notificationFocus:true,reducedMotion:true,disclosure:true,conditionsReveal:{cpuThrottle:4,roles:2,motionModes:2,repetitions:3,stableHeight:true,preservedControls:true,extraReads:0},coordinationSheets:[320,360,393,400],actionHolograms:8,feedbackDedup:true,feedbackTimers:true,feedbackSessionCleanup:true,realBackendAccess:false,orderActions:0}));
 await send('Browser.close');
}finally{socket?.close();browser.kill();await new Promise(resolve=>server.close(resolve));}

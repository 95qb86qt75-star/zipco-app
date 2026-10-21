// Synthetic contract + real React/DOM. No requests or actions against Backend QA.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const directory = path.resolve('node_modules/.cache/alternative-negotiation-browser');
const assets = path.resolve('node_modules/.cache/business-alternative-draft-qa/assets');
fs.mkdirSync(directory, { recursive: true });
await build({ stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
import Negotiation from './src/app/screens/requests/ProposalNegotiation';
import {proposalsFixture} from './src/app/screens/requests/proposalFixtures';
import {normalizeRequestProcess} from './src/app/screens/requests/requestProcess';
import {normalizeBusinessOrdersPayload} from './src/app/screens/requests/orderNormalization';
import {rawOrder} from './src/app/screens/requests/requestProcessFixtures';
import {statusViewFor} from './src/app/screens/requests/requestStatusGrouping';
window.React=React;let role=true,read=proposalsFixture(0),redraw=()=>{};let saved=new Map();
window.posts=[];window.uploads=0;window.fail=false;window.lose=false;window.expire=false;window.getFails=false;window.stale=false;
window.feedback=[];window.addEventListener('zipco-proposal-sent',event=>window.feedback.push(event.detail));
function processForRole(){const actor=proposalsFixture(Math.min(read.proposals.length-1,3),role).process;
 return {...read.process,allowedActions:read.process.agreementPublicId||read.process.state==='CLOSED'?[]:actor.allowedActions};}
window.reset=(sequence=0,business=true)=>{read=proposalsFixture(sequence,business);role=business;saved.clear();window.posts=[];window.uploads=0;window.fail=false;window.lose=false;window.expire=false;window.getFails=false;sessionStorage.clear();redraw();};
window.role=(business)=>{role=business;redraw();};
window.fetch=async (input,options={})=>{
 const url=String(input);if(url.includes('api.cloudinary.com')){window.uploads++;return new Response(JSON.stringify({secure_url:'https://res.cloudinary.com/test/image/upload/synthetic.jpg'}));}
 if(url.endsWith('/proposals')){if(window.getFails)throw Error('Synthetic read failure');if(window.stale){read=proposalsFixture(1,role);window.stale=false;}return new Response(JSON.stringify({...read,process:processForRole()}));}
 if(!url.includes('/actions/'))throw Error('Unexpected synthetic endpoint');
 const action=url.split('/').pop(),body=JSON.parse(options.body),key=options.headers['Idempotency-Key'];
 window.posts.push({action,key,body});if(window.fail){window.fail=false;throw Error('Synthetic response failure');}
 if(saved.has(key))return new Response(JSON.stringify(saved.get(key)));
 if(window.expire&&action.startsWith('accept-')&&!body.acceptPastSchedule)return new Response(JSON.stringify({code:'EXPIRED_SCHEDULE_CONFIRMATION_REQUIRED'}),{status:409});
 const accepts=action.startsWith('accept-'),rejects=action.startsWith('reject-');
 if(accepts){read.process={...read.process,state:'COORDINATION_PENDING',version:read.process.version+2,agreementPublicId:'synthetic-agreement',allowedActions:[]};}
 else if(rejects){read.process={...read.process,state:'CLOSED',version:read.process.version+1,allowedActions:[],closure:{reasonCode:role?'BUSINESS_REJECTED_COUNTER_PROPOSAL':'CUSTOMER_REJECTED_PROPOSAL',reasonDetail:null,actor:role?'BUSINESS':'CUSTOMER',actorUserId:role?12:11,closedAt:'2026-10-20T12:00:00Z'}};}
 else {const previous=read.proposals.at(-1);const sequence=read.proposals.length;
  const next=proposalsFixture(sequence,role).proposals.at(-1);next.subjectSnapshot=structuredClone(previous.subjectSnapshot);
  next.subjectSnapshot.items=next.subjectSnapshot.items.map(item=>({...item,source:item.source||'CATALOG',publishedUnitPriceClp:item.publishedUnitPriceClp??item.unitPriceClpSnapshot}));
  for(const change of body.lineChanges||[]){let item=next.subjectSnapshot.items[change.originalLineIndex];
   if(change.replacement){const r=change.replacement;item={source:'CUSTOM',catalogItemId:null,nameSnapshot:r.name,descriptionSnapshot:r.description||'',quantity:change.quantity||item.quantity,unitPriceClpSnapshot:null,publishedUnitPriceClp:null,subtotalClp:r.lineTotalPriceClp};}
   else{item.quantity=change.quantity||item.quantity;if(item.source==='CUSTOM')item.subtotalClp=change.lineTotalPriceClp||item.subtotalClp;else{item.unitPriceClpSnapshot=change.unitPriceClp||item.unitPriceClpSnapshot;item.subtotalClp=item.quantity*item.unitPriceClpSnapshot;}}
   next.subjectSnapshot.items[change.originalLineIndex]=item;}
  next.subjectSnapshot.proposalMessage=body.message;next.subjectSnapshot.proposalPhoto=body.photo??null;next.totalPriceClp=body.totalPriceClp;
  if(body.schedule){next.subjectSnapshot.needNow=body.schedule.mode==='IMMEDIATE';next.scheduledFor=next.subjectSnapshot.needNow?null:body.schedule.date+'T'+body.schedule.time+':00-03:00';}
  read.proposals.push(next);read.process={...proposalsFixture(sequence,role).process,proposalSummary:{type:next.type,subjectSchemaVersion:2,totalPriceClp:next.totalPriceClp,scheduledFor:next.scheduledFor}};}
 const receipt={orderId:20,orderStatus:accepts?'accepted':rejects?'rejected':'alternative_proposed',requestProcess:{...read.process,allowedActions:[]}};
 saved.set(key,receipt);if(window.lose){window.lose=false;throw Error('Synthetic committed response loss');}return new Response(JSON.stringify(receipt));
};
function App(){const [revision,setRevision]=useState(0);redraw=()=>setRevision(n=>n+1);
 localStorage.setItem('zipco-user-id',role?'12':'11');localStorage.setItem('zipco-token','synthetic-session');
 if(role)localStorage.setItem('zipco-business-id','8');else localStorage.removeItem('zipco-business-id');
 const process=normalizeRequestProcess(processForRole());
 const order=normalizeBusinessOrdersPayload([{...rawOrder,needNow:true,orderType:'product',status:process.state==='CLOSED'?'rejected':process.agreementPublicId?'accepted':read.proposals.length===1?'pending':'alternative_proposed',requestProcess:process}])[0];
 window.current={state:process.state,version:process.version,view:statusViewFor('orders',order.status,process)};
 return <Negotiation key={String(role)+'-'+(revision>10000?revision:0)} order={order} business={role} refresh={redraw}/>;
}createRoot(document.getElementById('root')).render(<App/>);
` }, bundle: true, format: 'esm', jsx: 'automatic', outfile: path.join(directory, 'fixture.js'),
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' } });
const css = fs.readFileSync(path.join(assets, fs.readdirSync(assets).find(name => name.endsWith('.css'))));
const html = '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>';
const server = http.createServer((req, res) => { res.setHeader('Content-Type', req.url === '/fixture.js' ? 'text/javascript' : req.url === '/fixture.css' ? 'text/css' : 'text/html'); res.end(req.url === '/fixture.js' ? fs.readFileSync(path.join(directory, 'fixture.js')) : req.url === '/fixture.css' ? css : html); });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const profile = path.join(directory, `profile-${Date.now()}`);
const browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
try {
  const portFile = path.join(profile, 'DevToolsActivePort');
  for (let i=0; !fs.existsSync(portFile)&&i<200; i++) await delay(50);
  let port;
  for(let i=0;i<40&&!port;i++){try{port=fs.readFileSync(portFile,'utf8').split('\n')[0];}catch{await delay(50);}}
  if(!port)throw Error('Chrome debugging port did not become readable');
  const tabs=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket=new WebSocket(tabs.find(tab=>tab.type==='page').webSocketDebuggerUrl);await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
  const pending=new Map();let sequence=0;
  socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(!pending.has(m.id))return;const {resolve,reject}=pending.get(m.id);pending.delete(m.id);m.error?reject(Error(m.error.message)):resolve(m.result);});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
  const wait=async expression=>{for(let i=0;i<100;i++){if(await evaluate(expression))return;await delay(50);}throw Error('Synthetic flow did not settle: '+expression);};
  const touch=async label=>{const p=await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)});if(!b||b.disabled)throw Error('Missing enabled control: '+${JSON.stringify(label)});b.scrollIntoView({block:'center',behavior:'instant'});const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});await delay(30);await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(100);};
  const fill=async(selector,value,kind='HTMLInputElement')=>evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(${kind}.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  const reset=async(sequence=0,business=true)=>{await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`});await wait('!!window.reset');await evaluate(`window.reset(${sequence},${business})`);await delay(100);};
  const form=async (price='1500')=>{await touch('Precio');await fill('input[aria-label="Nuevo precio por unidad"]',price);await touch('Guardar');await fill('textarea','Cambio de precio para la prueba sintética.','HTMLTextAreaElement');await touch('Revisar alternativa');await wait('!!document.querySelector("[data-alternative-review]")');};
  const decide=async label=>{await touch('Revisar propuesta y responder');await wait('!!document.querySelector("[data-proposal-comparison]")');await touch(label);};
  await send('Network.enable');await send('Network.setBlockedURLs',{urls:['https://*']});await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  const evidence=[];
  for(const width of [393,320]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height:852,deviceScaleFactor:1,mobile:true});
    await reset();await touch('Proponer alternativa');await wait('!!document.querySelector("textarea")');
    await touch('Precio');await fill('input[aria-label="Nuevo precio por unidad"]','1500');await touch('Guardar');
    await fill('textarea','Precio explicado para la nueva preparación.','HTMLTextAreaElement');
    await evaluate(`(()=>{const dt=new DataTransfer();dt.items.add(new File(['synthetic'],'qa.jpg',{type:'image/jpeg'}));const e=document.querySelector('input[type=file]');e.files=dt.files;e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await touch('Revisar alternativa');await wait('!!document.querySelector("[data-alternative-review]")');
    assert.equal(await evaluate('window.uploads'),0,'Photo uploads only at explicit confirmation');
    await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent==='Confirmar y enviar');b.click();b.click();})()`);
    await wait('window.current.state==="AWAITING_CUSTOMER_DECISION"');assert.equal(await evaluate('window.posts.length'),1);assert.equal(await evaluate('window.uploads'),1);
    assert.equal(await evaluate('window.feedback.length'),1,'Only confirmed business submission emits success feedback');
    await evaluate('window.role(false)');await delay(100);await touch('Revisar propuesta y responder');await wait('!!document.querySelector("[data-proposal-comparison]")');
    assert(await evaluate(`document.querySelector('[role=dialog]').textContent.includes('$2.000 → Propuesta vigente $3.000')`));
    assert.equal(await evaluate('document.querySelector("[role=dialog]").scrollWidth<=document.querySelector("[role=dialog]").clientWidth+1'),true);
    const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(directory,`customer-comparison-${width}.png`),Buffer.from(shot.data,'base64'));
    await touch('Aceptar propuesta');await touch('Volver');assert.equal(await evaluate('window.posts.length'),1);
    await touch('Aceptar propuesta');await touch('Sí, confirmar');await wait('window.current.state==="COORDINATION_PENDING"');
    assert.equal(await evaluate('window.posts.length'),2);assert.equal(await evaluate('window.current.view'),'coordination');evidence.push('business-photo-customer-accept-'+width);
  }
  await reset(1,false);await decide('Hacer mi única contrapropuesta');await wait('!!document.querySelector("textarea")');
  assert(await evaluate(`document.querySelector('[role=dialog]').textContent.includes('Propuesta vigente')`),'Counter edits the current proposal while retaining the original in comparison');
  await touch('Producto');await fill('input[maxlength="120"]','Conjunto personalizado');await fill('input[aria-label="Precio total de la opción escrita"]','10001');await touch('Guardar');
  await fill('textarea','Cambio por un conjunto alternativo.','HTMLTextAreaElement');await touch('Revisar alternativa');await touch('Confirmar y enviar');await wait('window.current.state==="AWAITING_BUSINESS_COUNTER_RESPONSE"');
  assert.equal(await evaluate('window.posts[0].body.lineChanges[0].replacement.lineTotalPriceClp'),10001);
  assert.equal(await evaluate('window.feedback.length'),0,'Customer counter does not emit the business send hologram');
  await evaluate('window.role(true)');await delay(100);await decide('Proponer alternativa final');await wait('!!document.querySelector("textarea")');
  await touch('Precio');await fill('input[aria-label="Nuevo precio total de la opción"]','11001');await touch('Guardar');await fill('textarea','Precio total final del conjunto.','HTMLTextAreaElement');await touch('Revisar alternativa');await touch('Confirmar y enviar');await wait('window.current.state==="AWAITING_CUSTOMER_FINAL_DECISION"');
  assert.equal(await evaluate('window.posts[1].body.lineChanges[0].lineTotalPriceClp'),11001);
  assert.equal(await evaluate('window.feedback.length'),1,'Business final uses the same success feedback');
  await evaluate('window.role(false)');await delay(100);await decide('Aceptar propuesta');
  assert.equal(await evaluate(`document.querySelector('[role=dialog]').textContent.includes('Hacer mi única contrapropuesta')`),false);
  await touch('Sí, confirmar');await wait('window.current.state==="COORDINATION_PENDING"');evidence.push('custom-counter-final-accept');
  for(const [sequence,business,label] of [[1,false,'Rechazar propuesta'],[2,true,'Rechazar contrapropuesta'],[2,true,'Aceptar contrapropuesta'],[3,false,'Rechazar propuesta']]){
    await reset(sequence,business);await decide(label);await touch('Sí, confirmar');await wait('window.posts.length===1&&!document.querySelector("[role=dialog]")');
    assert.equal(await evaluate('window.current.view'),label.startsWith('Rechazar')?'history':'coordination');evidence.push(label+'-'+sequence);
  }
  await reset();await touch('Proponer alternativa');await wait('!!document.querySelector("textarea")');await form();await evaluate('window.fail=true');await touch('Confirmar y enviar');await wait('!!document.querySelector("[role=alert]")');
  assert.equal(await evaluate('window.feedback.length'),0,'Failed send must not display a success hologram');
  assert(await evaluate('!!document.querySelector("[data-alternative-review]")'));await touch('Confirmar y enviar');await wait('window.current.state==="AWAITING_CUSTOMER_DECISION"');
  assert.equal(await evaluate('window.posts[0].key===window.posts[1].key'),true);evidence.push('failed-send-preserves-form-key');
  await reset(1,false);await decide('Aceptar propuesta');await evaluate('window.expire=true');await touch('Sí, confirmar');await wait('document.querySelector("[role=dialog]").textContent.includes("¿Quieres aceptar igualmente?")');
  assert.equal(await evaluate('window.posts[0].body.acceptPastSchedule'),undefined);await touch('Sí, confirmar');await wait('window.current.state==="COORDINATION_PENDING"');
  assert.equal(await evaluate('window.posts[1].body.acceptPastSchedule'),true);assert.equal(await evaluate('window.posts[0].key===window.posts[1].key'),true);evidence.push('expired-explicit-confirmation');
  await reset();await touch('Proponer alternativa');await wait('!!document.querySelector("textarea")');await form();await evaluate('window.lose=true');await touch('Confirmar y enviar');await wait('!!document.querySelector("[role=alert]")');
  await touch('Confirmar y enviar');await wait('window.current.state==="AWAITING_CUSTOMER_DECISION"');assert.equal(await evaluate('window.posts.length'),1);evidence.push('committed-response-loss-read-reconciliation-no-repost');
  await reset();await touch('Proponer alternativa');await wait('!!document.querySelector("textarea")');await form();await evaluate('window.stale=true');await touch('Confirmar y enviar');await wait('window.current.state==="AWAITING_CUSTOMER_DECISION"');
  assert.equal(await evaluate('window.posts.length'),0);evidence.push('stale-version-read-before-post');
  await reset(1,false);await evaluate('window.getFails=true');await touch('Revisar propuesta y responder');await wait('!!document.querySelector("[role=alert]")');
  assert.equal(await evaluate('window.posts.length'),0);assert.equal(await evaluate(`[...document.querySelectorAll('button')].some(b=>b.textContent==='Aceptar propuesta')`),false);evidence.push('failed-authorized-read-no-actions');
  console.log(JSON.stringify({passed:evidence.length,evidence,touchEvents:true,backendAccess:false,realOrderActions:false,realUploads:false}));await send('Browser.close');
} finally {socket?.close();browser.kill();await new Promise(resolve=>server.close(resolve));}

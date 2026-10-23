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
import AcceptedProposalHost from './src/app/screens/requests/AcceptedProposalHost';
import DealSuccessHost from './src/app/screens/requests/DealSuccess';
import ActionHologramHost from './src/app/screens/requests/ActionHologram';
import {proposalsFixture} from './src/app/screens/requests/proposalFixtures';
import {normalizeRequestProcess} from './src/app/screens/requests/requestProcess';
import {normalizeBusinessOrdersPayload} from './src/app/screens/requests/orderNormalization';
import {rawOrder} from './src/app/screens/requests/requestProcessFixtures';
import {statusViewFor} from './src/app/screens/requests/requestStatusGrouping';
window.React=React;let role=true,read=proposalsFixture(0),redraw=()=>{};let saved=new Map();
window.posts=[];window.uploads=0;window.fail=false;window.lose=false;window.expire=false;window.getFails=false;window.stale=false;
window.pauseReads=false;window.proposalReads=0;window.denyDraft=false;window.refreshes=0;
window.authFail=false;window.authLose=false;window.authDeny=false;window.acceptedGetFail=false;window.orderReads=0;window.selectedView=null;
window.orderReadPaths=[];window.authAlready=false;window.authInvalid=false;window.authConflict=false;window.authAfterGetFail=false;
window.feedback=[];window.addEventListener('zipco-proposal-sent',event=>window.feedback.push(event.detail));
window.addEventListener('zipco-proposal-accepted',event=>window.acceptanceEvent=event.detail);
function processForRole(){const actor=proposalsFixture(Math.min(read.proposals.length-1,3),role).process;
 const own=role?'businessContactAuthorized':'customerContactAuthorized';
 const other=role?'customerContactAuthorized':'businessContactAuthorized';
 return {...read.process,allowedActions:read.process.agreementPublicId?(window.authDeny?[]:[...(read.process.coordination?.[own]?[]:['AUTHORIZE_CONTACT']),...(read.process.coordination?.[other]?['OPEN_WHATSAPP']:[]),'ANNUL_COORDINATION']):read.process.state==='CLOSED'?[]:actor.allowedActions};}
window.reset=(sequence=0,business=true)=>{read=proposalsFixture(sequence,business);role=business;saved.clear();window.posts=[];window.uploads=0;window.fail=false;window.lose=false;window.expire=false;window.getFails=false;window.pauseReads=false;window.proposalReads=0;window.denyDraft=false;window.refreshes=0;sessionStorage.clear();redraw();};
window.role=(business)=>{role=business;redraw();};
window.originalPhoto=()=>{read.proposals[0].subjectSnapshot.referencePhoto='https://res.cloudinary.com/test/image/upload/original.jpg';redraw();};
window.chatStress=(kind)=>{for(const p of read.proposals){const s=p.subjectSnapshot;s.items[0].nameSnapshot='NombreExtensoSinEspacios'.repeat(5);s.items[0].descriptionSnapshot=('Descripción larga con detalle. ').repeat(15)+(p.sequence?' Cambio.':'');if(kind==='service'){s.orderType='service';s.items[0].quantity=1;s.items[0].subtotalClp=s.items[0].unitPriceClpSnapshot;}else{s.items.push({...s.items[0],nameSnapshot:'Segundo artículo',quantity:1,subtotalClp:s.items[0].unitPriceClpSnapshot});}p.totalPriceClp=s.items.reduce((n,it)=>n+it.subtotalClp,0);}read.process.proposalSummary.totalPriceClp=read.proposals.at(-1).totalPriceClp;redraw();};
window.fetch=async (input,options={})=>{
 const url=String(input);if(url.includes('api.cloudinary.com')){window.uploads++;return new Response(JSON.stringify({secure_url:'https://res.cloudinary.com/test/image/upload/synthetic.jpg'}));}
 if(url.includes('/orders/my-orders?processContract=alternatives-v1')||url.includes('/orders/business/8?processContract=alternatives-v1')){
  window.orderReads++;window.orderReadPaths.push(url);if(window.pauseOrderReads)await new Promise(resolve=>window.releaseOrderRead=()=>{window.pauseOrderReads=false;resolve();});if(window.acceptedGetFail)throw Error('Synthetic accepted-order read failure');
  if(window.authAlready){window.authAlready=false;read.process={...read.process,version:read.process.version+1,coordination:{...read.process.coordination,[role?'businessContactAuthorized':'customerContactAuthorized']:true}};}
  window.currentConsent=structuredClone(read.process.coordination);
  return new Response(JSON.stringify([{...rawOrder,businessName:'Negocio sintético',customerName:'Usuario Pauta QA',status:'accepted',requestProcess:processForRole()}]));
 }
 if(url.endsWith('/proposals')){window.proposalReads++;if(window.pauseReads)await new Promise(resolve=>window.releaseRead=()=>{window.pauseReads=false;resolve();});if(window.getFails)throw Error('Synthetic read failure');if(window.stale){read=proposalsFixture(1,role);window.stale=false;}return new Response(JSON.stringify({...read,process:window.denyDraft?{...processForRole(),allowedActions:[]}:processForRole()}));}
 if(!url.includes('/actions/'))throw Error('Unexpected synthetic endpoint');
 const action=url.split('/').pop(),body=JSON.parse(options.body),key=options.headers['Idempotency-Key'];
 window.posts.push({action,key,body});if(window.fail){window.fail=false;throw Error('Synthetic response failure');}
 if(window.pauseAccept&&action.startsWith('accept-'))await new Promise(resolve=>window.releaseAccept=()=>{window.pauseAccept=false;resolve();});
 if(saved.has(key))return new Response(JSON.stringify(saved.get(key)));
 if(action==='authorize-contact'){
  if(window.authFail){window.authFail=false;throw Error('Synthetic contact failure');}
  if(window.authInvalid){window.authInvalid=false;window.authDeny=true;return new Response(JSON.stringify({code:'INVALID_PROFILE_CONTACT'}),{status:409});}
  if(window.authConflict){window.authConflict=false;read.process.version++;return new Response(JSON.stringify({code:'STALE_VERSION'}),{status:409});}
  if(window.authDeny||body.expectedVersion!==read.process.version)return new Response(JSON.stringify({code:'STALE_VERSION'}),{status:409});
  if(body.consentAccepted!==true)throw Error('Missing explicit contact consent');
  read.process={...read.process,version:read.process.version+1,coordination:{...read.process.coordination,[role?'businessContactAuthorized':'customerContactAuthorized']:true}};
  const receipt={orderId:20,orderStatus:'accepted',requestProcess:{...read.process,allowedActions:[]}};saved.set(key,receipt);
  if(window.authLose){window.authLose=false;throw Error('Synthetic committed contact response loss');}
  if(window.authAfterGetFail){window.authAfterGetFail=false;window.acceptedGetFail=true;}return new Response(JSON.stringify(receipt));
 }
 if(window.expire&&action.startsWith('accept-')&&!body.acceptPastSchedule)return new Response(JSON.stringify({code:'EXPIRED_SCHEDULE_CONFIRMATION_REQUIRED'}),{status:409});
 const accepts=action.startsWith('accept-'),rejects=action.startsWith('reject-');
 if(accepts){read.process={...read.process,state:'COORDINATION_PENDING',version:read.process.version+2,agreementPublicId:'synthetic-agreement',coordination:{customerContactAuthorized:false,businessContactAuthorized:false},allowedActions:[]};}
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
 const order=normalizeBusinessOrdersPayload([{...rawOrder,customerName:'Usuario Pauta QA',needNow:true,orderType:'product',status:process.state==='CLOSED'?'rejected':process.agreementPublicId?'accepted':read.proposals.length===1?'pending':'alternative_proposed',requestProcess:process}])[0];
 window.current={state:process.state,version:process.version,view:statusViewFor('orders',order.status,process)};
 return <><ActionHologramHost/><DealSuccessHost/><AcceptedProposalHost onAccepted={()=>{window.selectedView='coordination';}} refresh={()=>{window.refreshes++;redraw();}}/>
  {!process.agreementPublicId&&<Negotiation key={String(role)+'-'+(revision>10000?revision:0)} order={order} business={role} variant="aurora" refresh={()=>{window.refreshes++;redraw();}}/>}</>;
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
  const touch=async label=>{if(await evaluate('!!document.querySelector(".zipco-ah")'))await wait('!document.querySelector(".zipco-ah")');if(await evaluate('!!document.querySelector("[data-accept-authorize],[data-contact-followup]")'))await delay(250);const p=await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>(b.querySelector('.zipco-accept-label')?.textContent||b.getAttribute('aria-label')||b.textContent).trim()===${JSON.stringify(label)});if(!b||b.disabled)throw Error('Missing enabled control: '+${JSON.stringify(label)});b.scrollIntoView({block:'center',behavior:'instant'});const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});await delay(30);await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(100);};
  const fill=async(selector,value,kind='HTMLInputElement')=>evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(${kind}.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  const reset=async(sequence=0,business=true)=>{await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`});await wait('!!window.reset');await evaluate(`window.reset(${sequence},${business})`);await delay(100);};
  const form=async (price='1500')=>{await touch('Precio');await fill('input[aria-label="Nuevo precio por unidad"]',price);await touch('Guardar');await fill('textarea','Cambio de precio para la prueba sintética.','HTMLTextAreaElement');await touch('Revisar alternativa');await wait('!!document.querySelector("[data-alternative-review]")');};
  const decide=async label=>{await touch('Revisar propuesta y responder');await wait('!!document.querySelector("[data-proposal-comparison]")');await touch(label);};
  const closeSheet=async (method='x')=>{
    if(method==='escape'){await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});}
    else if(method==='outside'){await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:2,y:2}]});await delay(60);await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(100);}
    else await evaluate(`document.querySelector('[data-proposal-sheet] ${method==='button'?'.zipco-glassbtn':':is(.zipco-sheet-x,.zipco-d-x)'}').click()`);
    try{await wait('!document.querySelector("[data-proposal-sheet]")');}catch(error){const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(directory,'floating-close-failure.png'),Buffer.from(shot.data,'base64'));throw Error(String(error)+'; '+JSON.stringify({method,dom:await evaluate('({hit:document.elementFromPoint(2,2)?.className,state:document.querySelector("[data-proposal-sheet]")?.dataset.state,pointerEvents:document.body.style.pointerEvents})')}));}
    assert(await evaluate('!!document.querySelector("[data-proposal-comparison]")'),'Closing detail preserves parent review');
  };
  await send('Network.enable');await send('Network.setBlockedURLs',{urls:['https://*']});await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  const evidence=[];
  await send('Emulation.setDeviceMetricsOverride',{width:360,height:852,deviceScaleFactor:1,mobile:true});
  for(const sequence of [1,3])for(const authorize of [false,true]){
    await reset(sequence,false);await decide('Aceptar propuesta');await evaluate('window.fail=true');
    const choice=authorize?'Aceptar y autorizar contacto':'Solo aceptar · autorizo después';
    await touch(choice);await wait('!!document.querySelector("[data-accept-authorize] [role=alert]")');
    assert.equal(await evaluate('!!document.querySelector(".zipco-ah,.zipco-d-hs")'),false,'Failed acceptance never emits success');
    await touch(choice);await wait(`!!document.querySelector('.zipco-ah[aria-label="Propuesta aceptada"]')`);
    assert.equal(await evaluate('document.querySelectorAll(".zipco-ah,.zipco-d-hs").length'),1,'Exactly one acceptance hologram');
    assert.equal(await evaluate('window.posts[0].key===window.posts[1].key'),true,'Display change preserves acceptance idempotency');
    assert.equal(await evaluate('window.posts.filter(p=>p.action==="authorize-contact").length'),authorize?1:0);
    assert(await evaluate(`(()=>{const e=document.querySelector('.zipco-ah-t'),r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&e.textContent==='Propuesta aceptada';})()`));
    if(sequence===1&&!authorize){await delay(1800);await send('Page.captureScreenshot',{format:'png'}).then(shot=>fs.writeFileSync(path.join(directory,'proposal-accepted-360.png'),Buffer.from(shot.data,'base64')));}
    evidence.push('accepted-q-after-retry-'+sequence+'-'+authorize);
  }
  for(const width of [320,393]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:852,deviceScaleFactor:1,mobile:true});
    let preparedStyle;
    for(const [step,business,entry] of [[0,true,'Proponer alternativa'],[1,false,'Hacer mi única contrapropuesta'],[2,true,'Proponer alternativa final']]){
      await reset(step,business);
      if(step)await decide(entry);else await touch(entry);
      await wait('!!document.querySelector("textarea")');
      const style=await evaluate(`(()=>{const tile=document.querySelector('.zipco-alt-tile'),base=document.querySelector('.zipco-alt-orig');return {tiles:document.querySelectorAll('.zipco-alt-tile').length,radius:getComputedStyle(tile).borderRadius,background:getComputedStyle(base).backgroundImage,textarea:!!document.querySelector('.zipco-alt-ta'),footer:!!document.querySelector('.zipco-alt-go')};})()`);
      if(!step)preparedStyle=style;else assert.deepEqual(style,preparedStyle,'Counter and final retain the initial preparation design');
      await send('Page.captureScreenshot',{format:'png'}).then(shot=>fs.writeFileSync(path.join(directory,'draft-parity-'+step+'-'+width+'.png'),Buffer.from(shot.data,'base64')));
      await touch('Cantidad');await touch('Aumentar cantidad');await touch('Guardar');
      await fill('textarea','Cantidad explicada para comprobar el diseño compartido.','HTMLTextAreaElement');await touch('Revisar alternativa');
      await wait('!!document.querySelector("[data-alternative-review]")');
      assert(await evaluate('!!document.querySelector(".zipco-review-total")'),'Same approved review design for every draft');
      assert.equal(await evaluate('window.posts.length'),0,'Preparing and reviewing never sends');
      await send('Page.captureScreenshot',{format:'png'}).then(shot=>fs.writeFileSync(path.join(directory,'review-parity-'+step+'-'+width+'.png'),Buffer.from(shot.data,'base64')));
    }
    evidence.push('initial-counter-final-design-parity-'+width);
  }
  for(const business of [false,true]){
    await reset(business?2:1,business);await evaluate('window.pauseReads=true;document.querySelector(".zipco-glass-btn").click();document.querySelector(".zipco-glass-btn").click();');
    await wait('window.proposalReads===1');await delay(250);
    assert.equal(await evaluate('!!document.querySelector("[role=dialog]")'),false,'No empty loading card while opening review');
    await evaluate('window.releaseRead()');await wait('!!document.querySelector("[data-proposal-comparison]")');
    assert.equal(await evaluate('window.posts.length'),0);evidence.push('review-opens-on-authorized-read-'+business);
    await reset(business?2:1,business);await decide(business?'Aceptar contrapropuesta':'Aceptar propuesta');
    await evaluate('window.pauseOrderReads=true');await touch('Aceptar y autorizar contacto');await wait('window.orderReads===1');
    assert(await evaluate(`(()=>{const e=document.querySelector('[data-contact-followup]');return e&&e.textContent.includes('Todo listo para')&&!e.textContent.includes('Tu propuesta quedó aceptada')&&!e.textContent.includes('La contrapropuesta quedó aceptada')&&!!e.querySelector('.zipco-d-orb')&&!!e.querySelector('.zipco-d-ticket')&&getComputedStyle(e).animationName==='none';})()`),'Contact verification keeps the approved design and exact ticket without a second entry');
    await send('Page.captureScreenshot',{format:'png'}).then(shot=>fs.writeFileSync(path.join(directory,'accept-followup-'+business+'.png'),Buffer.from(shot.data,'base64')));
    await evaluate('window.releaseOrderRead()');await wait('!document.querySelector("[role=dialog]")');
    assert.deepEqual(await evaluate('window.posts.map(p=>p.action)'),[business?'accept-counter-proposal':'accept-proposal','authorize-contact']);
    evidence.push('approved-acceptance-design-through-contact-'+business);
  }
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
    await evaluate('window.role(false);window.originalPhoto()');await delay(100);await touch('Revisar propuesta y responder');await wait('!!document.querySelector("[data-proposal-comparison]")');
    assert.equal(await evaluate(`document.querySelector('[data-proposal-sequence="0"] .zipco-glassbtn').getAttribute('aria-expanded')`),'false','Original starts compact');
    assert(await evaluate(`document.querySelector('[data-proposal-sequence="0"] .zipco-chat-mine').getBoundingClientRect().height<150`),'Compact original with photo leaves space for proposal');
    await evaluate(`document.querySelector('[data-proposal-sequence="0"] .zipco-glassbtn').click()`);
    await wait('!!document.querySelector("[data-proposal-sheet]")');
    assert(await evaluate(`document.querySelector('[data-proposal-sheet]').textContent.includes('Nota original') && !!document.querySelector('[data-proposal-sheet] button:not(.zipco-glassbtn):not(.zipco-sheet-x)')`),'Original note, snapshot and photo remain accessible');
    await closeSheet();
    assert(await evaluate(`document.querySelector('[data-proposal-sequence="0"]').textContent.includes('$2.000') && document.querySelector('[data-proposal-sequence="1"]').textContent.includes('$3.000')`));
    assert.equal(await evaluate('document.querySelector("[role=dialog]").scrollWidth<=document.querySelector("[role=dialog]").clientWidth+1'),true);
    await evaluate(`document.querySelector('[data-proposal-sequence="1"] .zipco-glassbtn').click()`);
    await wait('!!document.querySelector("[data-proposal-sheet]")');
    await evaluate(`document.querySelector('[data-proposal-sheet] button:not(.zipco-glassbtn):not(.zipco-sheet-x)').click()`);
    await wait(`!!document.querySelector('button[aria-label="Cerrar imagen"]')`);
    assert(await evaluate(`(()=>{const b=document.querySelector('button[aria-label="Cerrar imagen"]'),r=b.getBoundingClientRect();return document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)===b||b.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2));})()`),'Photo close must be above the proposal dialog');
    await touch('Cerrar imagen');
    await wait(`!document.querySelector('button[aria-label="Cerrar imagen"]')`);
    assert(await evaluate('!!document.querySelector("[data-proposal-comparison]")'),'Closing photo preserves review');
    assert(await evaluate('!!document.querySelector("[data-proposal-sheet]")'),'Closing photo preserves floating detail');
    const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(directory,`customer-comparison-${width}.png`),Buffer.from(shot.data,'base64'));
    await closeSheet('button');
    assert.equal(await evaluate('!!document.querySelector(".zipco-chat-foot").textContent.includes("Actualizar propuestas")'),false,'Refresh moved to header only');
    await touch('Aceptar propuesta');await wait('!!document.querySelector("[data-accept-authorize]")');
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.zipco-chat-panel .zipco-accept-check')).animationPlayState`),'paused','Covered customer review pauses while accepting');
    await touch('Volver');assert.equal(await evaluate('window.posts.length'),1);
    await wait('!document.querySelector("[data-accept-authorize]")');await delay(250);
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.zipco-chat-panel .zipco-accept-check')).animationPlayState`),'running','Closing the top card resumes review effects');
    await touch('Aceptar propuesta');await wait('!!document.querySelector("[data-accept-authorize]")');await touch('Solo aceptar · autorizo después');await wait('window.current.state==="COORDINATION_PENDING"');
    assert.equal(await evaluate('window.selectedView'),'coordination');
    assert(await evaluate(`!!document.querySelector('.zipco-ah[aria-label="Propuesta aceptada"]')`),'Accepted feedback survives filtered card');
    assert.equal(await evaluate('!!document.querySelector(".zipco-d-hs")'),false,'Customer never shows the handshake as well');
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
  await touch('Solo aceptar · autorizo después');await wait('window.current.state==="COORDINATION_PENDING"');evidence.push('custom-counter-final-accept');
  for(const [sequence,business,label] of [[1,false,'Rechazar propuesta'],[2,true,'Rechazar contrapropuesta'],[2,true,'Aceptar contrapropuesta'],[3,false,'Rechazar propuesta']]){
    await reset(sequence,business);await decide(label);
    assert.equal(await evaluate(`!!document.querySelector('[role=dialog] .zipco-accept-btn')`),label.startsWith('Aceptar'),'Only acceptance confirmations use the green glass button');
    if(label==='Aceptar contrapropuesta'){
      assert(await evaluate('!!document.querySelector("[data-accept-authorize]")'),'Business counter uses the same hologram card');
      assert.equal(await evaluate('document.querySelector(".zipco-chat-foot").textContent.includes("¿confirmas esta propuesta exacta?")'),false);
      await touch('Solo aceptar · autorizo después');
    }else await touch('Sí, confirmar');
    await wait('window.posts.length===1&&!document.querySelector("[role=dialog]")');
    assert.equal(await evaluate('window.current.view'),label.startsWith('Rechazar')?'history':'coordination');evidence.push(label+'-'+sequence);
    if(label.startsWith('Rechazar')){
      await touch('Ver propuestas e historial');await wait('!!document.querySelector("[data-proposal-comparison]")');
      assert(await evaluate('document.querySelector(".zipco-chat-turn").textContent.includes("Historial")'));
      assert.equal(await evaluate('document.querySelectorAll(".zipco-chat-foot button[aria-label]").length'),0,'Closed history offers no new decisions');
    }
  }
  for(const [sequence,business,width,dark,reduced,stress] of [[1,false,320,false,false],[1,false,393,true,true],[2,true,320,false,false],[2,false,393,true,false],[3,false,320,true,true],[3,true,393,false,false],[1,false,320,false,false,'multi'],[1,false,393,true,true,'service']]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:700,deviceScaleFactor:1,mobile:true});
    await reset(sequence,business);await evaluate(`document.documentElement.classList.toggle('dark',${dark});true`);
    if(stress)await evaluate(`window.chatStress(${JSON.stringify(stress)})`);
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]});
    await touch('Revisar propuesta y responder');await wait('!!document.querySelector("[data-proposal-comparison]")');await delay(850);
    assert.equal(await evaluate(`(()=>{const d=document.querySelector('[role=dialog]');return d.scrollWidth<=d.clientWidth+1;})()`),true,'Chat must fit narrow screens');
    const counter=sequence===1&&!business;
    assert.equal(await evaluate('!!document.querySelector(".zipco-chat-ghost")'),counter);
    assert.equal(await evaluate('document.querySelectorAll("[data-proposal-sequence]").length'),sequence+1);
    if(reduced)assert.equal(await evaluate('getComputedStyle(document.querySelector(".zipco-chat > *")).animationName'),'none');
    assert.equal(await evaluate('window.posts.length'),0,'Reading chat never sends an action');
    const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(directory,`chat-${sequence}-${business?'business':'customer'}-${width}-${dark?'dark':'light'}.png`),Buffer.from(shot.data,'base64'));
    await evaluate(`document.querySelector('[data-proposal-sequence="${sequence}"] .zipco-glassbtn').click()`);await wait('!!document.querySelector("[data-proposal-sheet]")');await delay(950);
    assert.equal(await evaluate(`document.querySelector('[data-proposal-sequence="0"] .zipco-glassbtn').getAttribute('aria-expanded')`),'false','Opening a proposal preserves independent original disclosure');
    const sheetGeometry=await evaluate(`(()=>{const d=document.querySelector('[data-proposal-sheet]'),r=d.getBoundingClientRect();return {width:d.clientWidth,scroll:d.scrollWidth,top:r.top,bottom:r.bottom,height:innerHeight,wide:[...d.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>r.right+1).map(e=>String(e.className)).slice(0,8)};})()`);
    if(sheetGeometry.scroll>sheetGeometry.width+1||sheetGeometry.top<0||sheetGeometry.bottom>sheetGeometry.height+1){const failed=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(directory,'floating-overflow.png'),Buffer.from(failed.data,'base64'));}
    assert(sheetGeometry.scroll<=sheetGeometry.width+1&&sheetGeometry.top>=0&&sheetGeometry.bottom<=sheetGeometry.height+1,'Floating comparison fits narrow screens: '+JSON.stringify({sequence,business,width,stress,...sheetGeometry}));
    if(reduced)assert.equal(await evaluate('getComputedStyle(document.querySelector(".zipco-chat-cell-new")).animationName'),'none');
    if(reduced)assert.equal(await evaluate('getComputedStyle(document.querySelector("[data-proposal-sheet]")).animationName'),'none');
    if(!stress)assert(await evaluate('document.querySelector("[data-proposal-sheet]").scrollHeight<=document.querySelector("[data-proposal-sheet]").clientHeight+1'),'Typical short detail fits without scrolling');
    if(width>=390)assert(await evaluate(`(()=>{const label=document.querySelector('[data-proposal-sheet] .zipco-glassbtn-label');return label.scrollWidth<=label.clientWidth+1;})()`),'Close label fits at 390px');
    const opened=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(directory,`chat-h-open-${sequence}-${business?'business':'customer'}-${width}-${dark?'dark':'light'}.png`),Buffer.from(opened.data,'base64'));
    await closeSheet(reduced?'escape':business?'outside':'button');
    evidence.push(`chat-${sequence}-${business}-${width}-${dark}-${reduced}${stress?'-'+stress:''}`);
  }
  await reset();await touch('Proponer alternativa');await wait('!!document.querySelector("textarea")');await form();await evaluate('window.fail=true');await touch('Confirmar y enviar');await wait('!!document.querySelector("[role=alert]")');
  assert.equal(await evaluate('window.feedback.length'),0,'Failed send must not display a success hologram');
  assert(await evaluate('!!document.querySelector("[data-alternative-review]")'));await touch('Confirmar y enviar');await wait('window.current.state==="AWAITING_CUSTOMER_DECISION"');
  assert.equal(await evaluate('window.posts[0].key===window.posts[1].key'),true);evidence.push('failed-send-preserves-form-key');
  await reset(1,false);await decide('Aceptar propuesta');await evaluate('window.expire=true');await touch('Solo aceptar · autorizo después');await wait('document.querySelector("[role=dialog]").textContent.includes("¿Quieres aceptar igualmente?")');
  assert.equal(await evaluate('window.posts[0].body.acceptPastSchedule'),undefined);await touch('Sí, confirmar');await wait('window.current.state==="COORDINATION_PENDING"');
  assert.equal(await evaluate('window.posts[1].body.acceptPastSchedule'),true);assert.equal(await evaluate('window.posts[0].key===window.posts[1].key'),true);evidence.push('expired-explicit-confirmation');
  await reset();await touch('Proponer alternativa');await wait('!!document.querySelector("textarea")');await form();await evaluate('window.lose=true');await touch('Confirmar y enviar');await wait('!!document.querySelector("[role=alert]")');
  await touch('Confirmar y enviar');await wait('window.current.state==="AWAITING_CUSTOMER_DECISION"');assert.equal(await evaluate('window.posts.length'),1);evidence.push('committed-response-loss-read-reconciliation-no-repost');
  await reset();await touch('Proponer alternativa');await wait('!!document.querySelector("textarea")');await form();await evaluate('window.stale=true');await touch('Confirmar y enviar');await wait('window.current.state==="AWAITING_CUSTOMER_DECISION"');
  assert.equal(await evaluate('window.posts.length'),0);evidence.push('stale-version-read-before-post');
  await reset(1,false);await evaluate('window.getFails=true');await touch('Revisar propuesta y responder');await wait('!!document.querySelector("[role=alert]")');
  assert.equal(await evaluate('window.posts.length'),0);assert.equal(await evaluate(`[...document.querySelectorAll('button')].some(b=>(b.querySelector('.zipco-accept-label')?.textContent||b.textContent)==='Aceptar propuesta')`),false);evidence.push('failed-authorized-read-no-actions');
  await reset();await evaluate(`window.pauseReads=true;window.intermediateSeen=false;window.watcher=new MutationObserver(()=>{if(document.querySelector('button[aria-label="Cerrar propuestas"]'))window.intermediateSeen=true;});window.watcher.observe(document.body,{childList:true,subtree:true});document.querySelector('.zipco-glass-btn').click();document.querySelector('.zipco-glass-btn').click();`);
  await wait('window.proposalReads===1');await delay(250);
  assert.equal(await evaluate('!!document.querySelector("[role=dialog]")'),false,'Slow initial read does not open the intermediate modal');
  assert.equal(await evaluate('document.querySelector(".zipco-glass-btn").disabled'),true);
  assert.equal(await evaluate('!!document.querySelector("textarea")'),false,'No form before authorized read');
  await evaluate('window.releaseRead()');await wait('!!document.querySelector("textarea")');
  assert.equal(await evaluate('window.intermediateSeen'),false);assert.equal(await evaluate('window.proposalReads'),1);assert.equal(await evaluate('window.posts.length'),0);
  await touch('Volver');await wait('!document.querySelector("[role=dialog]")');await evaluate('window.watcher.disconnect()');evidence.push('slow-initial-read-direct-form-double-click-close-to-card');
  await reset();await evaluate('window.getFails=true');await touch('Proponer alternativa');await wait('!!document.querySelector("[role=alert]")');
  assert.equal(await evaluate('!!document.querySelector("[role=dialog]")'),false);assert.equal(await evaluate('!!document.querySelector("textarea")'),false);
  await evaluate('window.getFails=false');await touch('Proponer alternativa');await wait('!!document.querySelector("textarea")');assert.equal(await evaluate('window.posts.length'),0);evidence.push('initial-read-error-inline-retry-direct-form');
  await reset();await evaluate('window.denyDraft=true');await touch('Proponer alternativa');await wait('!!document.querySelector("[role=alert]")');
  assert.equal(await evaluate('!!document.querySelector("textarea")'),false);assert.equal(await evaluate('window.posts.length'),0);assert.equal(await evaluate('window.refreshes'),1);evidence.push('revoked-initial-permission-no-form-refresh');
  for(const width of [320,393]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height:740,deviceScaleFactor:1,mobile:true});
    await reset(1,false);await decide('Aceptar propuesta');await wait('!!document.querySelector("[data-accept-authorize]")');
    assert(await evaluate(`(()=>{const e=document.querySelector('[data-accept-authorize]'),r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1&&e.scrollWidth<=e.clientWidth+1;})()`),'Authorization card fits mobile viewport');
    await send('Page.captureScreenshot',{format:'png'}).then(shot=>fs.writeFileSync(path.join(directory,'accept-authorize-'+width+'.png'),Buffer.from(shot.data,'base64')));
    await evaluate(`window.pauseAccept=true;const b=document.querySelector('.zipco-d-wabtn');b.click();b.click();true`);await wait('window.posts.length===1');
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    assert(await evaluate('!!document.querySelector("[data-accept-authorize]")'),'Busy authorization confirmation stays mounted');
    assert.equal(await evaluate('window.posts.length'),1,'Double tap accepts once');
    await evaluate('window.releaseAccept()');await wait('window.posts.length===2&&!document.querySelector("[role=dialog]")');
    const posts=await evaluate('window.posts');assert.deepEqual(posts.map(p=>p.action),['accept-proposal','authorize-contact']);
    assert.deepEqual(posts[1].body,{expectedVersion:posts[0].body.expectedVersion+2,consentAccepted:true});
    assert.notEqual(posts[0].key,posts[1].key,'Separate explicit decisions have independent idempotency');
    assert.equal(await evaluate('window.selectedView'),'coordination');assert(await evaluate('window.orderReads>=2'));
    assert(await evaluate(`!!document.querySelector('.zipco-ah[aria-label="Propuesta aceptada"]')`),'Accepted hologram is mounted outside filtered card');
    assert.equal(await evaluate('document.querySelectorAll(".zipco-ah,.zipco-d-hs").length'),1);
    if(width===320){
      await evaluate(`window.savedHologram=document.querySelector('.zipco-ah');window.dispatchEvent(new CustomEvent('zipco-proposal-accepted',{detail:window.acceptanceEvent}));true`);
      assert.equal(await evaluate('window.savedHologram===document.querySelector(".zipco-ah")'),true,'Duplicate receipt does not restart the hologram');
      await delay(1800);await send('Page.captureScreenshot',{format:'png'}).then(shot=>fs.writeFileSync(path.join(directory,'proposal-accepted-320.png'),Buffer.from(shot.data,'base64')));
      await delay(2700);assert.equal(await evaluate('!!document.querySelector(".zipco-ah")'),false,'Accepted hologram clears after 4.3 seconds');
    }
    evidence.push('accept-then-authorize-survives-filter-double-tap-'+width);
  }
  await reset(1,false);await decide('Aceptar propuesta');await evaluate('window.authFail=true');await touch('Aceptar y autorizar contacto');
  await wait('!!document.querySelector("[role=alert]")');assert.equal(await evaluate('window.posts.filter(p=>p.action==="accept-proposal").length'),1);
  await touch('Reintentar autorización pendiente');await wait('window.posts.length===3&&!document.querySelector("[role=dialog]")');
  assert.equal(await evaluate('window.posts[1].key===window.posts[2].key'),true);evidence.push('contact-failure-retries-same-key-no-second-acceptance');
  await reset(1,false);await decide('Aceptar propuesta');await evaluate('window.lose=true');await touch('Aceptar y autorizar contacto');
  await wait('!!document.querySelector("[data-accept-authorize] [role=alert]")');
  assert.equal(await evaluate('window.posts.length'),1);assert.equal(await evaluate('!!document.querySelector(".zipco-d-hs,.zipco-ah")'),false);
  await touch('Aceptar y autorizar contacto');await wait('window.posts.length===2&&!document.querySelector("[role=dialog]")');
  assert.deepEqual(await evaluate('window.posts.map(p=>p.action)'),['accept-proposal','authorize-contact'],'Reconciled acceptance is not posted again');
  assert.equal(await evaluate('window.selectedView'),'coordination');evidence.push('committed-accept-response-loss-read-confirmed-then-contact-no-repost');
  await reset(1,false);await decide('Aceptar propuesta');await evaluate('window.authLose=true');await touch('Aceptar y autorizar contacto');
  await wait('!!document.querySelector("[role=alert]")');await touch('Reintentar autorización pendiente');await wait('window.posts.length===3&&!document.querySelector("[role=dialog]")');
  assert.equal(await evaluate('window.posts[1].key===window.posts[2].key'),true);evidence.push('committed-contact-response-loss-idempotent');
  await reset(1,false);await decide('Aceptar propuesta');await evaluate('window.acceptedGetFail=true');await touch('Aceptar y autorizar contacto');
  await wait('!!document.querySelector("[role=alert]")');assert.equal(await evaluate('window.posts.length'),1,'Failed authoritative read never authorizes');
  await evaluate('window.acceptedGetFail=false');await touch('Actualizar pedido');await wait('window.posts.length===2&&!document.querySelector("[role=dialog]")');evidence.push('accepted-read-failure-recovers-without-reacceptance');
  await reset(1,false);await decide('Aceptar propuesta');await evaluate('window.authDeny=true');await touch('Aceptar y autorizar contacto');
  await wait('!!document.querySelector("[role=alert]")');assert.equal(await evaluate('window.posts.length'),1,'No consent POST without current allowedActions');
  assert.equal(await evaluate('window.selectedView'),'coordination');await touch('Continuar en Coordinación');evidence.push('accepted-but-contact-permission-revoked');
  await reset(1,false);await decide('Aceptar propuesta');await evaluate('window.expire=true');await touch('Aceptar y autorizar contacto');
  await wait('document.querySelector("[role=dialog]").textContent.includes("¿Quieres aceptar igualmente?")');
  assert.equal(await evaluate('window.posts.length'),1,'Expired schedule does not authorize before acceptance');
  await touch('Sí, confirmar');await wait('window.posts.length===3&&!document.querySelector("[role=dialog]")');
  assert.equal(await evaluate('window.posts[0].key===window.posts[1].key'),true);assert.equal(await evaluate('window.posts[2].action'),'authorize-contact');evidence.push('expired-confirmation-retains-explicit-contact-choice');
  await reset(1,false);await decide('Aceptar propuesta');await evaluate('window.pauseAccept=true');await touch('Aceptar y autorizar contacto');await wait('window.posts.length===1');
  await evaluate(`localStorage.removeItem('zipco-token');window.dispatchEvent(new Event('zipco-session-changed'));window.releaseAccept();true`);await delay(250);
  assert.equal(await evaluate('window.posts.length'),1);assert.equal(await evaluate('!!document.querySelector(".zipco-d-hs,.zipco-ah")'),false,'Session change prevents success and contact follow-up');evidence.push('session-change-during-accept-no-contact');
  await reset(1,false);await decide('Aceptar propuesta');await evaluate('window.pauseOrderReads=true');await touch('Aceptar y autorizar contacto');await wait('window.orderReads===1');
  await evaluate(`localStorage.removeItem('zipco-token');window.dispatchEvent(new Event('zipco-session-changed'));window.releaseOrderRead();true`);await delay(200);
  assert.equal(await evaluate('window.posts.length'),1);assert.equal(await evaluate('!!document.querySelector("[role=dialog],.zipco-d-hs,.zipco-ah")'),false);evidence.push('session-change-after-accept-before-contact-no-late-effects');
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await reset(1,false);await decide('Aceptar propuesta');await touch('Solo aceptar · autorizo después');await wait('!!document.querySelector(".zipco-ah")');
  assert.equal(await evaluate('document.querySelector(".zipco-ah").getAnimations({subtree:true}).length'),0);
  assert.equal(await evaluate('!!document.querySelector(".zipco-d-hs")'),false);
  await delay(2400);assert.equal(await evaluate('!!document.querySelector(".zipco-ah")'),false,'Reduced motion accepted feedback clears after 2.2 seconds');
  assert.equal(await evaluate('window.posts.length'),1);evidence.push('solo-accept-no-consent-reduced-success-timeout');
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  for(const width of [320,393]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:740,deviceScaleFactor:1,mobile:true});
    await reset(2,true);await decide('Aceptar contrapropuesta');await wait('!!document.querySelector("[data-accept-authorize]")');
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('[data-accept-authorize]')).animationDuration`),'0.18s','Business confirmation enters quickly');
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.zipco-chat-panel .zipco-accept-check')).animationPlayState`),'paused','Covered business review pauses');
    assert(await evaluate(`document.querySelector('[data-accept-authorize]').textContent.includes('Todo listo para')&&document.querySelector('[data-accept-authorize]').textContent.includes('coordinar tu pedido')`));
    assert.equal(await evaluate(`document.querySelector('[data-accept-authorize]').textContent.includes('Aceptar y autorizar contacto')`),true,'Owner consent uses the confirmed backend contract');
    assert.equal(await evaluate(`document.querySelector('[data-accept-authorize]').textContent.includes('Solo aceptar · autorizo después')`),true);
    assert(await evaluate(`document.querySelector('[data-accept-authorize]').textContent.includes('teléfono de tu perfil')&&document.querySelector('[data-accept-authorize]').textContent.includes('pago y retiro')`));
    assert(await evaluate(`document.querySelector('[data-accept-authorize]').textContent.includes('con Usuario Pauta QA para coordinar por WhatsApp')`),'Consent copy uses the actual customer name');
    await delay(600);await send('Page.captureScreenshot',{format:'png'}).then(shot=>fs.writeFileSync(path.join(directory,'business-counter-accept-'+width+'.png'),Buffer.from(shot.data,'base64')));
    await touch('Volver');await wait('!document.querySelector("[data-accept-authorize]")');assert.equal(await evaluate('window.posts.length'),0,'Closing business confirmation sends nothing');
    await delay(250);await touch('Aceptar contrapropuesta');await wait('!!document.querySelector("[data-accept-authorize]")');
    await evaluate(`window.pauseAccept=true;const button=document.querySelector('.zipco-d-wabtn');button.click();button.click();true`);await wait('window.posts.length===1');
    await evaluate('window.releaseAccept()');await wait('!document.querySelector("[role=dialog]")');
    const posts=await evaluate('window.posts');assert.deepEqual(posts.map(p=>p.action),['accept-counter-proposal','authorize-contact']);
    assert.deepEqual(posts[0].body,{expectedVersion:3,proposalId:125,confirmationAccepted:true});
    assert.deepEqual(posts[1].body,{expectedVersion:5,consentAccepted:true});assert.notEqual(posts[0].key,posts[1].key);
    assert.deepEqual(await evaluate('window.currentConsent'),{customerContactAuthorized:false,businessContactAuthorized:true});
    assert(await evaluate('window.orderReadPaths.every(p=>p.includes("/orders/business/8?processContract=alternatives-v1"))'));
    assert.equal(await evaluate('window.selectedView'),'coordination');assert(await evaluate('!!document.querySelector(".zipco-d-hs")'));
    evidence.push('business-counter-card-cancel-double-tap-owner-consent-only-'+width);
  }
  await reset(2,true);await decide('Aceptar contrapropuesta');await evaluate('window.fail=true');await touch('Solo aceptar · autorizo después');
  await wait('!!document.querySelector("[data-accept-authorize] [role=alert]")');await touch('Solo aceptar · autorizo después');await wait('window.posts.length===2&&!document.querySelector("[role=dialog]")');
  assert.equal(await evaluate('window.posts[0].key===window.posts[1].key'),true);evidence.push('business-counter-card-error-preserved-same-key-retry');
  await reset(2,true);await decide('Aceptar contrapropuesta');await evaluate('window.expire=true');await touch('Solo aceptar · autorizo después');
  await wait('document.querySelector("[role=dialog]").textContent.includes("¿Quieres aceptar igualmente?")');await touch('Sí, confirmar');
  await wait('window.posts.length===2&&!document.querySelector("[role=dialog]")');assert.equal(await evaluate('window.posts[1].body.acceptPastSchedule'),true);
  assert.equal(await evaluate('window.posts[0].key===window.posts[1].key'),true);evidence.push('business-counter-card-expired-explicit-confirmation');
  await reset(2,true);await decide('Aceptar contrapropuesta');await touch('Solo aceptar · autorizo después');await wait('!document.querySelector("[role=dialog]")');
  assert.deepEqual(await evaluate('window.posts.map(p=>p.action)'),['accept-counter-proposal']);evidence.push('business-solo-accept-never-grants-consent');
  for(const flag of ['authFail','authLose']){
    await reset(2,true);await decide('Aceptar contrapropuesta');await evaluate('window.'+flag+'=true');await touch('Aceptar y autorizar contacto');
    await wait('!!document.querySelector("[role=alert]")');assert.equal(await evaluate('!!document.querySelector(".zipco-d-hs")'),false,'Failed contact is not a combined success');
    await touch('Reintentar autorización pendiente');await wait('window.posts.length===3&&!document.querySelector("[role=dialog]")');
    assert.equal(await evaluate('window.posts[1].key===window.posts[2].key'),true);assert.deepEqual(await evaluate('window.posts[1].body'),await evaluate('window.posts[2].body'));
    assert.deepEqual(await evaluate('window.posts.map(p=>p.action)'),['accept-counter-proposal','authorize-contact','authorize-contact']);
    assert.deepEqual(await evaluate('window.currentConsent'),{customerContactAuthorized:false,businessContactAuthorized:true});evidence.push('business-'+flag+'-same-key-body-customer-independent');
  }
  await reset(2,true);await decide('Aceptar contrapropuesta');await evaluate('window.authAlready=true');await touch('Aceptar y autorizar contacto');
  await wait('window.orderReads===1&&!document.querySelector("[role=dialog]")');assert.equal(await evaluate('window.posts.length'),1);evidence.push('business-already-authorized-no-renewal-post');
  await reset(2,true);await decide('Aceptar contrapropuesta');await evaluate('window.authDeny=true');await touch('Aceptar y autorizar contacto');
  await wait('!!document.querySelector("[role=alert]")');assert.equal(await evaluate('window.posts.length'),1);await touch('Continuar en Coordinación');evidence.push('business-missing-permission-no-contact-post');
  for(const flag of ['authConflict','authInvalid']){
    await reset(2,true);await decide('Aceptar contrapropuesta');await evaluate('window.'+flag+'=true');await touch('Aceptar y autorizar contacto');
    await wait('!!document.querySelector("[role=alert]")');assert.equal(await evaluate('window.posts.length'),2,'Acceptance stays committed; contact conflict is not forced');
    if(flag==='authInvalid')assert(await evaluate('document.querySelector("[role=alert]").textContent.includes("teléfono internacional de tu perfil")'));
    await evaluate('window.authDeny=false');await touch('Revisar autorización');await wait('!![...document.querySelectorAll("button")].find(b=>b.textContent==="Autorizar contacto")');
    assert.equal(await evaluate('window.posts.length'),2,'Refreshing reevaluates without granting automatically');
    await touch('Autorizar contacto');await wait('window.posts.length===3&&!document.querySelector("[role=dialog]")');
    assert.notEqual(await evaluate('window.posts[1].key'),await evaluate('window.posts[2].key'));
    assert.equal(await evaluate('window.posts.filter(p=>p.action==="accept-counter-proposal").length'),1);evidence.push('business-'+flag+'-explicit-recheck-and-contact-only');
  }
  await reset(2,true);await decide('Aceptar contrapropuesta');await evaluate('window.authAfterGetFail=true');await touch('Aceptar y autorizar contacto');
  await wait('!!document.querySelector("[role=alert]")');assert.equal(await evaluate('window.posts.length'),2);assert(await evaluate('!!document.querySelector("[role=dialog]")'),'A contact receipt without authoritative GET keeps recovery visible');
  assert.equal(await evaluate('!!document.querySelector(".zipco-d-hs")'),false,'No combined-success hologram before current consent is verified');
  await evaluate('window.acceptedGetFail=false');await touch('Actualizar estado');await wait('!document.querySelector("[role=dialog]")');
  assert.equal(await evaluate('window.posts.length'),2);evidence.push('business-confirmed-contact-read-failure-readonly-recovery');
  await reset(2,true);await decide('Aceptar contrapropuesta');await evaluate('window.lose=true');await touch('Aceptar y autorizar contacto');
  await wait('!!document.querySelector("[data-accept-authorize] [role=alert]")');await touch('Aceptar y autorizar contacto');await wait('window.posts.length===2&&!document.querySelector("[role=dialog]")');
  assert.deepEqual(await evaluate('window.posts.map(p=>p.action)'),['accept-counter-proposal','authorize-contact']);evidence.push('business-accept-reply-loss-read-confirmed-before-contact');
  await reset(2,true);await decide('Aceptar contrapropuesta');await evaluate('window.expire=true');await touch('Aceptar y autorizar contacto');
  await wait('document.querySelector("[role=dialog]").textContent.includes("¿Quieres aceptar igualmente?")');await touch('Sí, confirmar');await wait('window.posts.length===3&&!document.querySelector("[role=dialog]")');
  assert.equal(await evaluate('window.posts[0].key===window.posts[1].key'),true);assert.equal(await evaluate('window.posts[2].action'),'authorize-contact');evidence.push('business-expired-confirmation-retains-owner-consent-choice');
  await reset(2,true);await decide('Aceptar contrapropuesta');await evaluate('window.pauseOrderReads=true');await touch('Aceptar y autorizar contacto');await wait('window.orderReads===1');
  await evaluate(`localStorage.removeItem('zipco-token');window.dispatchEvent(new Event('zipco-session-changed'));window.releaseOrderRead();true`);await delay(200);
  assert.equal(await evaluate('window.posts.length'),1);assert.equal(await evaluate('!!document.querySelector("[role=dialog]")'),false);evidence.push('business-session-change-between-accept-and-contact');
  console.log(JSON.stringify({passed:evidence.length,evidence,touchEvents:true,backendAccess:false,realOrderActions:false,realUploads:false}));await send('Browser.close');
} catch(error) {
 if(socket?.readyState===1) {
  const id=900001;socket.send(JSON.stringify({id,method:'Page.captureScreenshot',params:{format:'png'}}));
  await new Promise(resolve=>{const timeout=setTimeout(resolve,1000);const receive=event=>{const m=JSON.parse(event.data);if(m.id!==id)return;socket.removeEventListener('message',receive);clearTimeout(timeout);if(m.result?.data)fs.writeFileSync(path.join(directory,'failed-flow.png'),Buffer.from(m.result.data,'base64'));resolve();};socket.addEventListener('message',receive);});
 }
 throw error;
} finally {socket?.close();browser.kill();await new Promise(resolve=>server.close(resolve));}

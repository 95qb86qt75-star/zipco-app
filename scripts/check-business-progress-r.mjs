// Local Chrome with real React/hooks/contract normalization. All HTTP is synthetic.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import { spawn } from 'node:child_process'; import { build } from 'esbuild'; import assert from 'node:assert/strict';
const directory = path.resolve('node_modules/.cache/business-progress-r'); fs.mkdirSync(directory, {recursive:true});
await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
import React,{useState,useEffect,useCallback} from 'react';import {createRoot} from 'react-dom/client';
import useRequests from './src/app/screens/requests/useRequests';import BusinessOrdersTab from './src/app/screens/requests/BusinessOrdersTab';
import MyOrdersTab from './src/app/screens/requests/MyOrdersTab';import {statusViewFor} from './src/app/screens/requests/requestStatusGrouping';
import {rawOrder,coordinationProcess,agreementFixture} from './src/app/screens/requests/requestProcessFixtures';
import {proposalsFixture} from './src/app/screens/requests/proposalFixtures';import ActionHologramHost from './src/app/screens/requests/ActionHologram';
window.React=React;sessionStorage.clear();const q=new URLSearchParams(location.search);const business=!q.has('customer');
localStorage.setItem('zipco-user-id','12');localStorage.setItem('zipco-token','synthetic');if(business)localStorage.setItem('zipco-business-id','1');else localStorage.removeItem('zipco-business-id');
const seq=Number(q.get('seq')||0),history=proposalsFixture(seq),last=history.proposals[seq];
if(q.has('service'))for(const p of history.proposals){p.subjectSnapshot.orderType='service';p.subjectSnapshot.items[0].quantity=1;if(p.subjectSnapshot.items[0].unitPriceClpSnapshot!==null)p.subjectSnapshot.items[0].unitPriceClpSnapshot=p.totalPriceClp;}
const accepted={...agreementFixture,acceptedProposalId:last.id,subjectSchemaVersion:last.subjectSchemaVersion,subjectSnapshot:last.subjectSnapshot,totalPriceClp:last.totalPriceClp,scheduledFor:last.scheduledFor};
let process={...coordinationProcess,currentProposalId:last.id,state:q.has('ready')?'READY':q.has('coordination')?'COORDINATING':'IN_PROGRESS',version:5,
  readyNoticeAcknowledged:q.has('ack')?true:false,coordination:{businessContactAuthorized:true,customerContactAuthorized:true},allowedActions:q.has('ready')?[]:['MARK_READY'],
  ...(seq?{proposalSummary:{type:last.type,subjectSchemaVersion:2,totalPriceClp:last.totalPriceClp,scheduledFor:last.scheduledFor}}:{})};
if(q.has('noAck'))delete process.readyNoticeAcknowledged;if(q.has('denied'))process.allowedActions=[];
if(q.has('restore'))sessionStorage.setItem('zipco-coordination:12:business:7',JSON.stringify({action:'MARK_READY',body:{expectedVersion:5},key:'12345678-1234-4234-8234-123456789abc'}));
const order=()=>({...rawOrder,businessName:'Negocio sintético',customerName:q.has('long')?'Cliente con un nombre extenso para verificar los límites de la tarjeta y sus controles':'Cliente sintético',requestProcess:process,status:process.state==='READY'?'ready':'accepted'});
window.posts=[];window.events=[];window.failRead=false;window.offline=false;window.delayPost=false;
window.fetch=async(input,options={})=>{const url=String(input);if(url.endsWith('/orders/my-orders?processContract=alternatives-v1'))return new Response(JSON.stringify(business?[]:[order()]));
if(url.endsWith('/orders/business/1?processContract=alternatives-v1')){if(window.failRead)throw Error('read offline');return new Response(JSON.stringify([order()]));}
if(url.endsWith('/agreement'))return new Response(JSON.stringify(accepted));
if(url.endsWith('/proposals')){if(window.offline)throw Error('history offline');return new Response(JSON.stringify({...history,process}));}
if(options.method==='POST'&&url.endsWith('/mark-ready')){window.posts.push({url,body:JSON.parse(options.body),key:options.headers['Idempotency-Key']});if(window.delayPost)await new Promise(r=>window.releasePost=r);if(window.offline)throw Error('post offline');process={...process,state:'READY',version:6,allowedActions:[]};return new Response(JSON.stringify({orderId:20,orderStatus:'ready',requestProcess:process}));}
throw Error('Unexpected fixture URL '+url);};
for(const type of ['zipco-action-hologram','zipco-process-receipt'])window.addEventListener(type,e=>window.events.push({type,at:Date.now(),detail:e.detail}));
function App(){const expired=useCallback(()=>{},[]);const data=useRequests(expired);const [view,setView]=useState(q.has('ready')?'ready':q.has('coordination')?'coordination':'active');window.chooseView=setView;
useEffect(()=>{const refresh=()=>data.loadOrders(true);window.addEventListener('zipco-requests-refresh',refresh);return()=>window.removeEventListener('zipco-requests-refresh',refresh)},[data.loadOrders]);
const records=business?data.requests:data.myOrders;window.counts={active:records.filter(o=>statusViewFor('orders',o.status,o.requestProcess)==='active').length,ready:records.filter(o=>statusViewFor('orders',o.status,o.requestProcess)==='ready').length};
const filtered=records.filter(o=>statusViewFor('orders',o.status,o.requestProcess)===view);return <><ActionHologramHost/><main data-view={view} style={{maxWidth:410,margin:'auto',padding:16}}>
{business?<BusinessOrdersTab key={view} requests={filtered} updatingOrderIds={data.updatingOrderIds} onAction={async()=>{}} onRetry={data.loadOrders} emptyTitle="Sin pedidos" emptyDescription=""/>:
<MyOrdersTab key={view} myOrders={filtered} updatingOrderIds={data.updatingOrderIds} onAction={async()=>{}} onRetry={data.loadOrders} emptyTitle="Sin pedidos" emptyDescription=""/>}</main></>}
createRoot(document.getElementById('root')).render(<App/>);
`},bundle:true,format:'esm',jsx:'automatic',outfile:path.join(directory,'fixture.js'),define:{'process.env.NODE_ENV':'"production"','import.meta.env':'{"VITE_API_URL":"https://zipco-backend-qa.up.railway.app"}'}});
const assets = path.resolve('node_modules/.cache/business-alternative-draft-qa/assets');
const css=fs.readFileSync(path.join(assets,fs.readdirSync(assets).find(n=>n.endsWith('.css'))));
const server=http.createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/fixture.js'?'text/javascript':req.url==='/fixture.css'?'text/css':'text/html');res.end(req.url==='/fixture.js'?fs.readFileSync(path.join(directory,'fixture.js')):req.url==='/fixture.css'?css:'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>')});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const profile=path.join(directory,'profile-'+Date.now());
const browser=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--disable-background-networking','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));let socket;
try{
 const portFile=path.join(profile,'DevToolsActivePort');for(let i=0;!fs.existsSync(portFile)&&i<200;i++)await delay(50);
 const port=fs.readFileSync(portFile,'utf8').split('\n')[0];const tabs=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));
 const pending=new Map();let serial=0;socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(!pending.has(m.id))return;const {resolve,reject}=pending.get(m.id);pending.delete(m.id);m.error?reject(Error(m.error.message)):resolve(m.result)});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
 const wait=async expression=>{for(let i=0;i<160;i++){if(await evaluate(expression))return;await delay(50)}throw Error('Timeout: '+expression)};
 const click=async selector=>{await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);await delay(80)};
 const visit=async(query,width=393)=>{await send('Emulation.setDeviceMetricsOverride',{width,height:852,deviceScaleFactor:1,mobile:true});await send('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/?'+query});await wait('!!document.querySelector("#order-20")');await delay(200)};
 const shot=async name=>{const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(directory,name+'.png'),Buffer.from(r.data,'base64'))};
 await send('Network.enable');await send('Network.setBlockedURLs',{urls:['https://*']});
 const results=[];
 for(const width of [320,360,393]){
  await visit('long=1',width);await wait('!!document.querySelector(".zipco-ec-dk")');assert.equal(await evaluate('document.querySelector(".zipco-co-fb").dataset.folded'),'true');
  await click('.zipco-co-colrow');await delay(700);assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);await shot('in-progress-'+width);
  const pointer=async(p,cancel=false)=>evaluate(`(()=>{const b=document.querySelector('.zipco-ec-hd'),r=b.getBoundingClientRect(),t=b.parentElement.getBoundingClientRect();b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,isPrimary:true,pointerId:1,button:0,clientX:r.x+20}));window.dispatchEvent(new PointerEvent('pointermove',{pointerId:1,buttons:1,clientX:r.x+20+(t.width-56)*${p}}));window.dispatchEvent(new PointerEvent('${cancel?'pointercancel':'pointerup'}',{pointerId:1,buttons:0}));})()`);
  await pointer(0);await pointer(.5);await pointer(1,true);await delay(100);assert.equal(await evaluate('window.posts.length'),0);
  await evaluate('window.delayPost=true');await pointer(1);await wait('window.posts.length===1');assert.equal(await evaluate('!!document.querySelector(".zipco-ah")'),false);assert.equal(await evaluate('document.querySelector(".zipco-ec-sent")?.textContent'), 'Avisando al cliente…');assert.equal(await evaluate('document.body.textContent.includes("Reintentar operación pendiente")'),false);await delay(600);await shot('sending-'+width);
  await evaluate('window.releasePost()');await wait('!!document.querySelector(".zipco-ah")');assert.equal(await evaluate('document.querySelector(".zipco-ah").getAttribute("aria-label")'),'¡Pedido notificado!');await shot('notified-hologram-'+width);
  await wait('window.counts.active===0&&window.counts.ready===1');assert.equal(await evaluate('window.posts.length'),1);assert.deepEqual(await evaluate('window.posts[0].body'),{expectedVersion:5});
  await evaluate('window.chooseView("ready")');await wait('!!document.querySelector(".zipco-ec-dk")');await wait('!document.querySelector(".zipco-ah")');await wait('document.querySelector(".zipco-co-fb").dataset.folded==="true"');await shot('ready-compact-'+width);
  await click('.zipco-co-colrow');await delay(700);assert.equal(await evaluate('document.body.textContent.includes("Esperando confirmación del cliente")'),true);await shot('ready-expanded-'+width);results.push('pointer-send-ready-'+width);
 }
 for(const seq of [0,1,2,3]){
  await visit('seq='+seq);await click('.zipco-co-colrow');await delay(700);await click('.zipco-co-strip2');await wait('!!document.querySelector(".zipco-ag-cta")');await shot('conditions-'+seq);
  await click('.zipco-ag-cta');await wait('!!document.querySelector(".zipco-ag2-r")');await delay(900);
  assert.equal(await evaluate('document.querySelectorAll(".zipco-ag2-r:not(.e)").length'),seq+1);assert.equal(await evaluate('document.querySelectorAll(".zipco-ag2-ok").length'),1);assert.equal(await evaluate('document.querySelectorAll(".zipco-ag2-x[data-open=true]").length'),1);
  assert.equal(await evaluate('window.posts.length'),0);assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);await shot('agreement-'+seq);await click('.zipco-ag-x');await wait('!document.querySelector(".zipco-ag-sheet")');results.push('agreement-'+seq);
 }
 await visit('coordination=1');await click('.zipco-co-colrow');await delay(700);await click('.zipco-co-strip2');await wait('!!document.querySelector(".zipco-ag-cta")');await click('.zipco-ag-cta');await wait('!!document.querySelector(".zipco-ag-sheet")');results.push('coordination-opens-agreement');
 await visit('seq=3');await click('.zipco-co-colrow');await delay(700);await click('.zipco-co-strip2');await wait('!!document.querySelector(".zipco-ag-cta")');await evaluate('window.offline=true');await click('.zipco-ag-cta');await wait('!!document.querySelector(".zipco-ag-err")');assert.equal(await evaluate('document.querySelector(".zipco-ag-sum").textContent.includes("$5.000")'),true);await evaluate('window.offline=false');await click('.zipco-ag-err button');await wait('!!document.querySelector(".zipco-ag2-r")');results.push('history-error-retry-retains-summary');
 await visit('');await click('.zipco-co-colrow');await delay(700);await evaluate('window.offline=true');await click('.zipco-ec-hd');await wait('document.body.textContent.includes("Reintentar operación pendiente")');assert.equal(await evaluate('!!document.querySelector(".zipco-ah")'),false);const first=await evaluate('window.posts[0]');await evaluate('window.offline=false');await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Reintentar operación pendiente').click()`);await wait('!!document.querySelector(".zipco-ah")');assert.equal(await evaluate('window.posts.length'),2);assert.deepEqual(await evaluate('window.posts[1].body'),first.body);assert.equal(await evaluate('window.posts[1].key'),first.key);results.push('uncertain-exact-retry');
 for(const flag of ['ack','noAck']){await visit('ready=1&'+flag+'=1');await click('.zipco-co-colrow');await delay(700);assert.equal(await evaluate(`document.body.textContent.includes(${JSON.stringify(flag==='ack'?'El cliente confirmó el aviso':'No pudimos leer el estado del aviso')})`),true);await shot('ready-'+flag);results.push(flag);}
 await visit('denied=1');await click('.zipco-co-colrow');await delay(700);assert.equal(await evaluate('document.querySelector(".zipco-ec-hd").disabled'),true);results.push('permission-preserved');
 await visit('customer=1');await wait('!!document.querySelector(".zipco-cp")');assert.equal(await evaluate('!!document.querySelector(".zipco-ec-dk")'),false);results.push('customer-s-isolated');
 await visit('restore=1');await click('.zipco-co-colrow');await delay(700);assert.equal(await evaluate('!!document.querySelector(".zipco-ec-hd")'),false);assert.equal(await evaluate('document.body.textContent.includes("Actualizar estado")'),true);assert.equal(await evaluate('window.posts.length'),0);results.push('restored-intent-preserved');
 await visit('ready=1&service=1');await click('.zipco-co-colrow');await delay(700);assert.equal(await evaluate('document.body.textContent.includes("Servicio listo")'),true);assert.equal(await evaluate('document.body.textContent.includes("Esperando confirmación del cliente")'),false);results.push('service-preserved');
 await visit('');await click('.zipco-co-colrow');await delay(700);await evaluate('document.querySelector(".zipco-ec-hd").focus()');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await wait('window.posts.length===1');await wait('!!document.querySelector(".zipco-ah")');results.push('keyboard-notification');
 await visit('');await click('.zipco-co-colrow');await delay(700);await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 await evaluate('document.querySelector(".zipco-ec-hd").scrollIntoView({block:"center"})');
 const points=await evaluate('(()=>{const b=document.querySelector(".zipco-ec-hd").getBoundingClientRect(),t=document.querySelector(".zipco-ec-tr").getBoundingClientRect();return {start:{x:b.x+b.width/2,y:b.y+b.height/2},end:{x:t.right-24,y:b.y+b.height/2}}})()');
 await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[points.start]});await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[points.end]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait('window.posts.length===1');await wait('!!document.querySelector(".zipco-ah")');results.push('real-touch-notification');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await visit('');await click('.zipco-co-colrow');await delay(80);assert.equal(await evaluate('getComputedStyle(document.querySelector(".zipco-ec-ring")).animationName'),'none');results.push('reduced-motion');
 console.log(JSON.stringify({passed:results.length,results,artifacts:directory},null,2));
}finally{socket?.close();browser.kill();await new Promise(r=>server.close(r));}

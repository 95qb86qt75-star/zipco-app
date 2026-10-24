// Local Chrome with real React/hooks/contract normalization. All HTTP is synthetic.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import { spawn } from 'node:child_process'; import { build } from 'esbuild'; import assert from 'node:assert/strict';
const directory = path.resolve('node_modules/.cache/whatsapp-load-recovery'); fs.mkdirSync(directory, {recursive:true});
await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
import React,{useState,useEffect,useCallback} from 'react';import {createRoot} from 'react-dom/client';
import useRequests from './src/app/screens/requests/useRequests';import BusinessOrdersTab from './src/app/screens/requests/BusinessOrdersTab';import MyOrdersTab from './src/app/screens/requests/MyOrdersTab';
import RequestStatusTab from './src/app/screens/requests/RequestStatusTab';import useReadyTransitions from './src/app/screens/requests/useReadyTransitions';import ProcessHistoryCard from './src/app/screens/requests/ProcessHistoryCard';
import {statusViewFor} from './src/app/screens/requests/requestStatusGrouping';import {rawOrder,coordinationProcess,agreementFixture} from './src/app/screens/requests/requestProcessFixtures';
import {proposalsFixture} from './src/app/screens/requests/proposalFixtures';import ActionHologramHost from './src/app/screens/requests/ActionHologram';
import {diagnosticSnapshot,clearDiagnostics} from './src/app/screens/requests/loadOrdersDiagnostics';
window.diagnostics=diagnosticSnapshot;window.clearDiagnostics=clearDiagnostics;
let visibility='visible';Object.defineProperty(document,'visibilityState',{get:()=>visibility});Object.defineProperty(document,'hidden',{get:()=>visibility==='hidden'});
window.toasts=[];window.addEventListener('zipco-toast',e=>window.toasts.push(e.detail));window.reads=[];window.readMode='ok';window.navigations=0;
window.syntheticNavigation=()=>{window.navigations++;visibility='hidden';window.dispatchEvent(new Event('pagehide'));document.dispatchEvent(new Event('visibilitychange'));};
window.returnFromWhatsapp=()=>{window.readMode='ok';visibility='visible';document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('pageshow'));};
window.React=React;sessionStorage.clear();const q=new URLSearchParams(location.search),business=q.has('business');
localStorage.setItem('zipco-user-id','12');localStorage.setItem('zipco-token','synthetic');if(business)localStorage.setItem('zipco-business-id','1');else localStorage.removeItem('zipco-business-id');
const seq=Number(q.get('seq')||0),history=proposalsFixture(seq),last=history.proposals[seq];
if(q.has('service'))for(const p of history.proposals){p.subjectSnapshot.orderType='service';p.subjectSnapshot.items[0].quantity=1;if(p.subjectSnapshot.items[0].unitPriceClpSnapshot!==null)p.subjectSnapshot.items[0].unitPriceClpSnapshot=p.totalPriceClp;}
const accepted={...agreementFixture,acceptedProposalId:last.id,subjectSchemaVersion:last.subjectSchemaVersion,subjectSnapshot:{...last.subjectSnapshot,needNow:q.has('now')},totalPriceClp:last.totalPriceClp,scheduledFor:q.has('past')?'2020-01-01T12:00:00Z':'2099-10-26T13:30:00Z'};
last.scheduledFor=accepted.scheduledFor;last.subjectSnapshot=accepted.subjectSnapshot;
let process={...coordinationProcess,currentProposalId:last.id,state:q.has('ready')?'READY':'IN_PROGRESS',version:5,readyNoticeAcknowledged:q.has('ack'),coordination:{businessContactAuthorized:true,customerContactAuthorized:!q.has('noConsent')},allowedActions:[],...(seq?{proposalSummary:{type:last.type,subjectSchemaVersion:2,totalPriceClp:last.totalPriceClp,scheduledFor:last.scheduledFor}}:{})};
const permissions=()=>{process.allowedActions=q.has('denied')?[]:[...(!q.has('service')&&process.state==='READY'?[process.readyNoticeAcknowledged?'CONFIRM_RECEIPT':'ACK_READY_NOTICE']:[]),...(process.state!=='COMPLETED'?['OPEN_WHATSAPP']:[])];};permissions();if(q.has('unknown'))delete process.readyNoticeAcknowledged;
if(q.has('restore'))sessionStorage.setItem('zipco-coordination:12:customer:7',JSON.stringify({action:'ACK_READY_NOTICE',body:{expectedVersion:5,confirmationAccepted:true},key:'12345678-1234-4234-8234-123456789abc'}));
const order=()=>({...rawOrder,orderType:q.has('service')?'service':'product',businessName:q.has('long')?'Negocio sintético de nombre extenso para comprobar límites y controles':'Negocio sintético',customerName:'Cliente sintético',requestProcess:process,status:process.state==='READY'?'ready':process.state==='COMPLETED'?'completed':'accepted'});
window.posts=[];window.events=[];window.failRead=false;window.offline=false;window.delayPost=false;window.agreementError=q.has('agreementError');window.slowAgreement=q.has('slow');window.agreementReads=0;window.flashes=[];
new MutationObserver(()=>{if(process.state!=='COMPLETED'&&document.querySelector('.zipco-aurora-card'))window.flashes.push(Date.now());}).observe(document.body,{subtree:true,childList:true});
window.fetch=async(input,options={})=>{const url=String(input);
if(url.endsWith('/orders/my-orders?processContract=alternatives-v1')){
window.reads.push({at:Date.now(),signal:options.signal});
if(window.readMode==='hang')await new Promise((resolve,reject)=>{options.signal.addEventListener('abort',()=>reject(new DOMException('synthetic cancellation','AbortError')),{once:true});window.resolveOld=()=>resolve();});
if(window.readMode==='network')throw new TypeError('synthetic connection failure');
if(window.readMode==='abort')throw new DOMException('synthetic unexpected abort','AbortError');
if(window.readMode==='http')return new Response(JSON.stringify({code:'INCOMPATIBLE_STATE'}),{status:503});
if(window.readMode==='json')return new Response('<invalid json>');
if(window.armOutgoing){window.armOutgoing=false;window.readMode='hang';}
if(window.failRead)throw Error('read offline');return new Response(JSON.stringify(business?[]:[order()]));}
if(url.endsWith('/orders/business/1?processContract=alternatives-v1'))return new Response(JSON.stringify([order()]));
if(url.endsWith('/agreement')){window.agreementReads++;if(window.slowAgreement)await new Promise(r=>window.releaseAgreement=r);if(window.agreementError)throw Error('agreement offline');return new Response(JSON.stringify(accepted));}
if(url.endsWith('/proposals')){if(window.offline)throw Error('history offline');return new Response(JSON.stringify({...history,process}));}
if(options.method==='POST'&&url.endsWith('/open-whatsapp')){window.posts.push({body:JSON.parse(options.body),key:options.headers['Idempotency-Key']});window.armOutgoing=true;process={...process,version:process.version+1};return new Response(JSON.stringify({result:{orderId:20,orderStatus:'ready',requestProcess:process},navigation:{url:'https://wa.me/12345678?text=Synthetic'}}));}
if(options.method==='POST'&&(url.endsWith('/ack-ready-notice')||url.endsWith('/confirm-receipt'))){window.posts.push({url,body:JSON.parse(options.body),key:options.headers['Idempotency-Key']});if(window.delayPost)await new Promise(r=>window.releasePost=r);if(window.offline)throw Error('post offline');process={...process,state:url.endsWith('/confirm-receipt')?'COMPLETED':'READY',readyNoticeAcknowledged:true,version:process.version+1};permissions();return new Response(JSON.stringify({orderId:20,orderStatus:process.state==='COMPLETED'?'completed':'ready',requestProcess:process}));}
throw Error('Unexpected fixture URL '+url);};
for(const type of ['zipco-action-hologram','zipco-process-receipt','zipco-customer-received-presented'])window.addEventListener(type,e=>window.events.push({type,at:Date.now(),detail:e.detail}));
function App(){const expired=useCallback(()=>{},[]);const data=useRequests(expired);const [view,setView]=useState(q.has('ready')?'ready':'active');window.chooseView=setView;
window.makeReady=()=>{process={...process,state:'READY',version:process.version+1};permissions();return data.loadOrders(true);};
useEffect(()=>{const refresh=()=>data.loadOrders(true),received=()=>setView('history');window.addEventListener('zipco-requests-refresh',refresh);window.addEventListener('zipco-customer-received-presented',received);return()=>{window.removeEventListener('zipco-requests-refresh',refresh);window.removeEventListener('zipco-customer-received-presented',received);}},[data.loadOrders]);
window.lastLoadError=data.loadError;window.triggerReload=()=>data.loadOrders(true,'manual');const arrival=useReadyTransitions(data.myOrders,()=>setView('ready'),{active:!business,loaded:!data.isLoading&&!data.loadError,navigationKey:view});
const records=business?data.requests:data.myOrders;window.counts={active:records.filter(o=>statusViewFor('orders',o.status,o.requestProcess)==='active').length,ready:records.filter(o=>statusViewFor('orders',o.status,o.requestProcess)==='ready').length,history:records.filter(o=>statusViewFor('orders',o.status,o.requestProcess)==='history').length};
const filtered=records.filter(o=>statusViewFor('orders',o.status,o.requestProcess)===view);return <><ActionHologramHost/><main data-view={view} style={{maxWidth:410,margin:'auto',padding:16}}>
<div className="zipco-status-tabs" style={{display:'flex',gap:6,marginBottom:28}}>{['pending','respond','active','ready','history'].map(key=><RequestStatusTab key={key} item={{key,label:{pending:'Pendientes',respond:'Por responder',active:'En curso',ready:'Listos',history:'Historial'}[key],count:window.counts[key]??0}} selected={view===key} reducedMotion={false} onSelect={()=>setView(key)} arrival={key==='ready'?arrival:undefined}/>)}</div>
{view==='history'?filtered.map(o=><ProcessHistoryCard key={o.id} order={o}/>):business?<BusinessOrdersTab key={view} requests={filtered} updatingOrderIds={data.updatingOrderIds} onAction={async()=>{}} onRetry={data.loadOrders} emptyTitle="Sin pedidos" emptyDescription=""/>:<MyOrdersTab key={view} myOrders={filtered} updatingOrderIds={data.updatingOrderIds} onAction={async()=>{}} onRetry={data.loadOrders} emptyTitle="Sin pedidos" emptyDescription=""/>}</main></>}
createRoot(document.getElementById('root')).render(<App/>);
`},bundle:true,format:'esm',jsx:'automatic',outfile:path.join(directory,'fixture.js'),plugins:[{name:'synthetic-whatsapp-navigation',setup(b){b.onLoad({filter:/useCoordination\.ts$/},a=>({loader:'ts',contents:fs.readFileSync(a.path,'utf8').replace('window.location.assign(response.navigation.url)','window.syntheticNavigation()')}));}}],define:{'process.env.NODE_ENV':'"production"','import.meta.env':'{"VITE_API_URL":"https://zipco-backend-qa.up.railway.app","QA_LOAD_DIAGNOSTICS":true,"QA_LOAD_DIAGNOSTICS_VERSION":"synthetic-recovery"}'}});
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
 for(const width of [360,393]){
  await visit('ready=1&ack=1',width);await wait('!!document.querySelector(".zipco-cp-wa")');await click('.zipco-co-colrow');await delay(650);
  const before=await evaluate('window.reads.length');await click('.zipco-cp-wa');await wait('!!document.querySelector(".zipco-ah")');
  await wait('window.navigations===1');await wait('window.diagnostics().some(e=>e.failureKind==="cancelled")');
  assert.equal(await evaluate('window.reads.length'),before+2); // verification + one shared pre-navigation reload
  assert.equal(await evaluate('window.posts.length'),1);assert.equal(await evaluate('window.lastLoadError'),'');assert.equal(await evaluate('window.toasts.length'),0);assert.equal(await evaluate('!!document.querySelector(".zipco-ah")'),false);
  assert.deepEqual(await evaluate('window.posts[0].body'),{expectedVersion:5,consentAccepted:true});
  assert.equal(await evaluate('window.reads.at(-1).signal.aborted'),true);await shot('controlled-departure-'+width);
  const leaving=await evaluate('window.reads.length');await evaluate('window.returnFromWhatsapp()');await wait('window.reads.length==='+String(leaving+1));await delay(300);
  assert.equal(await evaluate('window.reads.length'),leaving+1);assert.equal(await evaluate('window.posts.length'),1);assert.equal(await evaluate('window.lastLoadError'),'');assert.equal(await evaluate('window.navigations'),1);results.push('cancel-and-readonly-return-'+width);
 }
 for(const [mode,kind,status] of [['network','network',null],['abort','unexpected-abort',null],['http','http',503],['json','parse',200]]){
  await visit('ready=1&ack=1');await evaluate('window.readMode='+JSON.stringify(mode)+';window.clearDiagnostics();window.triggerReload()');await wait('!!window.lastLoadError');
  await wait('window.diagnostics().length===1');const item=await evaluate('window.diagnostics()[0]');assert.equal(item.failureKind,kind);assert.equal(item.httpStatus,status);assert.equal(item.trigger,'manual');assert.equal(await evaluate('window.toasts.length'),1);
  assert.equal(await evaluate('window.posts.length'),0);await evaluate('window.returnFromWhatsapp()');await wait('window.lastLoadError===""');assert.equal(await evaluate('window.posts.length'),0);results.push('real-error-retained-'+mode);
 }
 console.log(JSON.stringify({passed:results.length,results,syntheticNavigation:true,realHooks:true,externalNetwork:false},null,2));
}finally{socket?.close();browser.kill();await new Promise(r=>server.close(r));}

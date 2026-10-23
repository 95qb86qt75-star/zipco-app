// Real hook, business cards, confirmation modal and root feedback. Synthetic HTTP only.
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {spawn} from 'node:child_process';import assert from 'node:assert/strict';import {build} from 'esbuild';
const directory=path.resolve('node_modules/.cache/business-own-feedback'),assets=path.resolve('node_modules/.cache/business-alternative-draft-qa/assets');fs.mkdirSync(directory,{recursive:true});
await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
import React,{useState,useEffect} from 'react';import {createRoot} from 'react-dom/client';
import useRequests from './src/app/screens/requests/useRequests';import BusinessOrdersTab from './src/app/screens/requests/BusinessOrdersTab';
import MyOrdersTab from './src/app/screens/requests/MyOrdersTab';
import {waitForNotificationCard} from './src/app/notifications/notificationNavigation';
import ActionHologramHost from './src/app/screens/requests/ActionHologram';import Toast from './src/app/screens/Toast';
import {rawOrder,pendingProcess,coordinationProcess,agreementFixture} from './src/app/screens/requests/requestProcessFixtures';
import {rejectedPendingProcess} from './src/app/screens/requests/pendingRejectionFixtures';
window.React=React;window.posts=[];window.toasts=[];window.receipt=false;window.failed=false;window.stale=false;
const query=new URLSearchParams(location.search),business=query.get('role')!=='customer';
localStorage.setItem('zipco-user-id','12');localStorage.setItem('zipco-token','synthetic-session');if(business)localStorage.setItem('zipco-business-id','1');else localStorage.removeItem('zipco-business-id');
let state=query.get('state')==='coordination'?'accepted':'pending',process=state==='accepted'?coordinationProcess:pendingProcess;
const order=()=>({...rawOrder,status:state,businessName:'Negocio QA',customerName:'Cliente QA',needNow:true,orderType:'product',requestProcess:process});
window.fetch=async(input,options={})=>{const url=String(input);
 if(url.endsWith('/orders/my-orders?processContract=alternatives-v1'))return new Response(JSON.stringify(business?[]:[order()]));
 if(url.endsWith('/orders/business/1?processContract=alternatives-v1'))return new Response(JSON.stringify([order()]));
 if(url.endsWith('/agreement')){if(query.has('slowAgreement'))await new Promise(resolve=>window.releaseAgreement=resolve);return new Response(JSON.stringify(agreementFixture));}
 if(options.method==='POST'){
  window.posts.push({url,body:JSON.parse(options.body),key:options.headers['Idempotency-Key']});
  if(window.failed){window.failed=false;throw Error('Synthetic network failure');}
  if(!url.endsWith('/accept-fixed-order')&&!url.endsWith('/reject-pending-request'))throw Error('Unexpected synthetic action');
  if(url.endsWith('/reject-pending-request')){process=rejectedPendingProcess;state='rejected';}else{process=coordinationProcess;state='accepted';}
  window.receipt=true;return new Response(JSON.stringify({orderId:20,orderStatus:state,requestProcess:process}));
 }
 throw Error('Unexpected synthetic read '+url);
};
const expire=()=>{};
function App(){const requests=useRequests(expire);const [toast,setToast]=useState(null),[view,setView]=useState(query.get('state')==='coordination'?'coordination':'pending');
 window.chooseView=setView;window.openNotification=()=>waitForNotificationCard('order-20',()=>window.notificationFocused=true);
 useEffect(()=>{const receive=e=>{window.toasts.push(e.detail);setToast(e.detail)};window.addEventListener('zipco-toast',receive);return()=>window.removeEventListener('zipco-toast',receive)},[]);
 return <><ActionHologramHost/>{toast&&<Toast notification={toast} onClose={()=>setToast(null)}/>}
 <main style={{padding:16}} data-view={view}>{business?<BusinessOrdersTab key={view} requests={requests.requests.filter(o=>view==='pending'?o.status==='pending':true)} updatingOrderIds={requests.updatingOrderIds}
 onAction={async(o,a,r,d)=>{if(await requests.performAction(o,'business',a,r,d))setView('coordination')}} onRetry={requests.loadOrders}
 onProposeAlternative={requests.proposeAlternative} emptyTitle="Sin pendientes" emptyDescription=""/>:<MyOrdersTab key={view} myOrders={requests.myOrders.filter(o=>view==='pending'?o.status==='pending':true)} updatingOrderIds={requests.updatingOrderIds} onAction={async()=>{}} onRetry={requests.loadOrders} emptyTitle="Sin pendientes" emptyDescription=""/>}</main></>;
}createRoot(document.getElementById('root')).render(<App/>);
`},bundle:true,format:'esm',jsx:'automatic',outfile:path.join(directory,'fixture.js'),define:{'process.env.NODE_ENV':'"production"','import.meta.env':'{}'}});
const css=fs.readFileSync(path.join(assets,fs.readdirSync(assets).find(n=>n.endsWith('.css'))));
const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>';
const server=http.createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/fixture.js'?'text/javascript':req.url==='/fixture.css'?'text/css':'text/html');res.end(req.url==='/fixture.js'?fs.readFileSync(path.join(directory,'fixture.js')):req.url==='/fixture.css'?css:html)});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const profile=path.join(directory,'profile-'+Date.now()),browser=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--disable-background-networking','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});const delay=ms=>new Promise(r=>setTimeout(r,ms));let socket;
try{
 const portFile=path.join(profile,'DevToolsActivePort');for(let i=0;!fs.existsSync(portFile)&&i<200;i++)await delay(50);const port=fs.readFileSync(portFile,'utf8').split('\n')[0];const tabs=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));const pending=new Map();let sequence=0;
 socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(!pending.has(m.id))return;const {resolve,reject}=pending.get(m.id);pending.delete(m.id);m.error?reject(Error(m.error.message)):resolve(m.result)});const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))});const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};const wait=async exp=>{for(let i=0;i<100;i++){if(await evaluate(exp))return;await delay(50)}throw Error('Did not settle: '+exp)};
 const touch=async(selector)=>{const point=await evaluate(`(()=>{const b=document.querySelector(${JSON.stringify(selector)});if(!b||b.disabled)throw Error('Missing enabled control: '+JSON.stringify([...document.querySelectorAll('button')].map(e=>({text:e.textContent,cls:e.className,disabled:e.disabled}))));b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()`);await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(150)};
 await send('Network.enable');await send('Network.setBlockedURLs',{urls:['https://*']});await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});const results=[];
 for(const width of [360,393])for(const fail of [false,true]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:852,deviceScaleFactor:1,mobile:true});await send('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/'});await wait('!!document.querySelector(".zipco-aurora-card")');
  await touch('.zipco-open-panel');await wait('!!document.querySelector(".zipco-accept-btn")');await delay(700);await touch('.zipco-accept-btn');await wait('!!document.querySelector("[role=dialog] .zipco-confirm-action")');
  assert.equal(await evaluate('window.posts.length'),0);assert.equal(await evaluate('!!document.querySelector(".zipco-ah")'),false);
  if(fail)await evaluate('window.failed=true');await touch('[role=dialog] .zipco-confirm-action');
  if(fail){await wait('window.toasts.some(t=>t.type==="error")');assert.equal(await evaluate('!!document.querySelector(".zipco-ah")'),false);results.push('error-retained-'+width);continue;}
  await wait('!!document.querySelector(".zipco-ah")');assert.equal(await evaluate('document.querySelector(".zipco-ah").getAttribute("aria-label")'),'Pedido aceptado');
  assert.equal(await evaluate('window.toasts.filter(t=>t.type==="success").length'),0);assert.equal(await evaluate('window.posts.length'),1);assert.equal(await evaluate('document.querySelector("main").dataset.view'),'coordination');
  await delay(1500);assert.equal(await evaluate('!!document.querySelector(".zipco-ah")'),true);await send('Page.captureScreenshot',{format:'png'}).then(shot=>fs.writeFileSync(path.join(directory,'accepted-'+width+'.png'),Buffer.from(shot.data,'base64')));results.push('confirmed-root-hologram-no-toast-'+width);
 }
 for(const role of ['business','customer'])for(const slow of [false,true]){
  await send('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/?role='+role+'&state=coordination&orderId=20'+(slow?'&slowAgreement=1':'')});
  await wait('!!document.querySelector("#order-20")');
  if(slow){await wait('!!window.releaseAgreement');await evaluate('window.openNotification()');await wait('window.notificationFocused===true');await evaluate('window.releaseAgreement()');await wait('document.querySelector(".zipco-co-fb")?.dataset.folded==="false"');results.push('notification-before-agreement-'+role);continue;}
  await wait('document.querySelector(".zipco-co-fb")?.dataset.folded==="true"');
  await evaluate('window.openNotification()');await wait('document.querySelector(".zipco-co-fb")?.dataset.folded==="false"');
  await delay(700);await touch('.zipco-co-fold');await wait('document.querySelector(".zipco-co-fb").dataset.folded==="true"');await delay(700);
  await touch('.zipco-co-colrow');await wait('document.querySelector(".zipco-co-fb").dataset.folded==="false"');
  await evaluate('window.chooseView("pending")');await wait('document.querySelector("main").dataset.view==="pending"');await evaluate('window.chooseView("coordination")');await wait('document.querySelector(".zipco-co-fb")?.dataset.folded==="true"');
  assert.equal(await evaluate('window.posts.length'),0);results.push('default-collapsed-notification-open-manual-and-category-reset-'+role);
 }
 console.log(JSON.stringify({passed:results.length,results,realHook:true,realBusinessTab:true,realCustomerTab:true,realConfirmation:true,touch:true,backendAccess:false,realOrderActions:false}));await send('Browser.close');
}finally{socket?.close();browser.kill();await new Promise(r=>server.close(r));}

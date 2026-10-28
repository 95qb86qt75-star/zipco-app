// Real App/RequestsScreen observation controls, synthetic HTTP/worker. No real mutations or notifications.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';

const directory = path.resolve('node_modules/.cache/qa-push-observation-browser');
fs.mkdirSync(directory, { recursive: true });
const harness = "\nimport React from 'react';\nimport {createRoot} from 'react-dom/client';\nimport App from '/src/app/App.tsx';\nimport {availabilityWaiting,availabilityInitial} from '/src/app/screens/requests/availabilityFixtures.ts';\nimport '/src/styles/index.css';\nconst params=new URL(location.href).searchParams;\nwindow.beforeConfirmation=params.has('before');localStorage.clear();sessionStorage.clear();localStorage.setItem('zipco-registration-complete','true');sessionStorage.setItem('zipco-splash-seen','true');\nif(!params.has('late-session')){localStorage.setItem('zipco-token','synthetic-test-only');localStorage.setItem('zipco-user-id','1');}\nwindow.calls=[];window.acks=[];window.workerMessages=[];window.ordersReady=!params.has('slow-list');let waits=[];\nconst raw=id=>({id,businessId:5,userId:1,businessName:'Consulta QA '+id,customerName:'Cliente QA',status:'pending',total:12000,products:[{name:'Producto QA',quantity:1,price:12000}],createdAt:'2026-10-26T20:02:00.000Z',deliveryDate:'2026-10-26',deliveryTime:'17:45',needNow:false,note:'Solicitud de prueba',requestProcess:{...(window.beforeConfirmation&&id===20?availabilityInitial:availabilityWaiting),flowContract:'AVAILABILITY_V3',version:window.beforeConfirmation&&id===20?1:17,id:id===20?7:8}});\nwindow.fetch=async(url,init={})=>{const path=new URL(String(url),location.origin).pathname,method=init.method??'GET';window.calls.push({path,method});if(path.includes('/actions/')||['PATCH','DELETE','PUT'].includes(method)){throw Error('Forbidden order mutation');}if(method==='POST')return new Response('{}');if(path==='/orders/my-orders'){if(!window.ordersReady)await new Promise(r=>waits.push(r));return new Response(JSON.stringify([raw(20),raw(21)]));}if(path==='/request-process-capabilities')return new Response(JSON.stringify({supportedContracts:['availability-v3'],reservationCreationEnabled:true,simplifiedReservationCreationEnabled:true,lateInitialResponse:{contract:'late-initial-v1',creationEnabled:true}}));return new Response('[]');};\nwindow.releaseOrders=()=>{window.ordersReady=true;waits.splice(0).forEach(r=>r());};\nconst stores=new Map();const key=r=>typeof r==='string'?new URL(r,location.origin).href:r.url;\nwindow.fakeCaches={open:async name=>{if(!stores.has(name))stores.set(name,new Map());const rows=stores.get(name);return {match:async r=>rows.get(key(r))?.clone(),put:async(r,v)=>{rows.set(key(r),v.clone());},delete:async r=>rows.delete(key(r)),keys:async()=>[...rows.keys()].map(r=>new Request(r))};}};\nObject.defineProperty(window,'caches',{configurable:true,value:window.fakeCaches});\nconst sw=new EventTarget();let target=null,muted=false;\nwindow.workerDeliver=url=>sw.dispatchEvent(new MessageEvent('message',{data:{type:'ZIPCO_NOTIFICATION_NAVIGATE',url}}));\nconst worker={postMessage:(data,ports)=>{window.workerMessages.push(data.type);if(data.type==='ZIPCO_NOTIFICATION_WORKER_VERSION'){ports?.[0]?.postMessage({revision:'notification-click-attempt-v11',build:'a'.repeat(40),traceEnabled:false});return;}if(data.type==='ZIPCO_NOTIFICATION_NAVIGATED'){window.acks.push(data.url);if(target===data.url){target=null;void window.fakeCaches.open('zipco-notification-navigation-v1').then(c=>c.delete(new URL('/__zipco_notification_target__',location.origin).href));}}if(data.type==='ZIPCO_REQUEST_NOTIFICATION_TARGET'&&target&&!muted)window.workerDeliver(target);}};\nObject.assign(sw,{controller:worker,ready:Promise.resolve({active:worker,pushManager:{getSubscription:async()=>null}}),getRegistration:async()=>({active:worker})});\nObject.defineProperty(navigator,'serviceWorker',{configurable:true,value:sw});\nObject.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:(_ok,no)=>no?.({code:1})}});\nwindow.targetUrl=(click='click-00000001',id=20)=>'/?open=requests-customer&orderId='+id+'&notificationEvent=requests-customer%3Aorder-'+id+'-availability-17&notificationClick='+click;\nwindow.seedTarget=async(url,{deliver=true,silent=false}={})=>{target=url;muted=silent;const c=await window.fakeCaches.open('zipco-notification-navigation-v1');await c.put(new URL('/__zipco_notification_target__',location.origin).href,new Response(JSON.stringify({url,createdAt:Date.now()})));if(deliver)window.workerDeliver(url);};\nwindow.resume=()=>{document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('pageshow'));window.dispatchEvent(new Event('focus'));};\nwindow.hidden=()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('pagehide'));};\nwindow.visible=()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});window.resume();};\nwindow.restoreSession=()=>{localStorage.setItem('zipco-token','synthetic-test-only');localStorage.setItem('zipco-user-id','1');window.dispatchEvent(new Event('zipco-session-changed'));window.resume();};\nif(params.has('cold')){const url=new URL(window.targetUrl(),location.origin);url.pathname=location.pathname;params.forEach((v,k)=>url.searchParams.set(k,v));history.replaceState({},'',url);}\ncreateRoot(document.getElementById('root')).render(<App/>);window.testDriverReady=true;\n\nwindow.confirmAvailabilityForTest=()=>{window.beforeConfirmation=false;sw.dispatchEvent(new MessageEvent('message',{data:{type:'order-availability-event',orderId:20,processId:7,processVersion:17,tag:'order-20-availability-17',url:'/?open=requests-customer&orderId=20'}}));};\n\nwindow.observationCalls=[];window.observationDisabled=false;window.observationLive=false;\nconst sid='cccccccc-cccc-4ccc-8ccc-cccccccccccc';\nconst observed=()=>({contract:'qa-push-observation-v1',sessionId:sid,expiresAt:new Date(Date.now()+3600000).toISOString(),state:'OBSERVING',storage:'VOLATILE_SINGLE_INSTANCE',receiptToken:'must-not-export',deliveries:[{traceId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',events:[{stage:'PROVIDER_ACCEPTED',source:'server',receivedAt:new Date().toISOString()}]}]});\nconst baseFetch=window.fetch;window.fetch=async(url,init={})=>{const path=new URL(String(url),location.origin).pathname;if(!path.startsWith('/qa/push-observations/'))return baseFetch(url,init);const method=init.method??'GET';window.observationCalls.push({method,path,body:init.body,hasJwt:init.headers?.Authorization==='Bearer synthetic-test-only'});if(window.observationDisabled)return new Response(JSON.stringify({statusCode:404,code:'QA_PUSH_OBSERVATIONS_DISABLED'}),{status:404});if(method==='POST'){window.observationLive=true;return new Response(JSON.stringify(observed()),{status:201});}if(method==='DELETE'){window.observationLive=false;return new Response(JSON.stringify({contract:'qa-push-observation-v1',sessionId:sid,state:'STOPPED'}));}return new Response(JSON.stringify(observed()));};\nObject.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedObservation=text;}}});\nworker.scriptURL=location.origin+'/sw.js';const oldPost=worker.postMessage;window.remoteAcks=[];worker.postMessage=(data,ports)=>{if(data.type==='ZIPCO_QA_OBSERVATION_ACK')window.remoteAcks.push(data);oldPost(data,ports);};\nwindow.deliverObserved=url=>{const event=new MessageEvent('message',{data:{type:'ZIPCO_NOTIFICATION_NAVIGATE',url,qaObservationAck:{traceId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',attemptId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'}}});Object.defineProperty(event,'source',{value:worker});sw.dispatchEvent(event);};\n";
process.env.ZIPCO_QA_LOAD_DIAGNOSTICS="1";process.env.ZIPCO_QA_NOTIFICATION_TRACE="1";process.env.VITE_API_URL="https://zipco-backend-qa.up.railway.app";
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



 const results=[];
 await visit('');await evaluate('window.seedTarget(window.targetUrl())');await wait('document.activeElement?.id==="order-20"');
 await evaluate('[...document.querySelectorAll("summary")].filter(s=>s.textContent.includes("Diagnóstico temporal QA")||s.textContent.includes("Recorrido del clic externo QA")).forEach(s=>s.parentElement.open=true)');
 await wait('document.body.textContent.includes("Observar próximo aviso legítimo")');
 await check('window.observationCalls.length===0','opening diagnostic never opts in automatically');results.push('explicit-opt-in-only');
 await button('Observar próximo aviso legítimo');await wait('document.body.textContent.includes("Detener y revocar")');
 await check('window.observationCalls.filter(c=>c.method==="POST").length===1&&window.observationCalls[0].body===JSON.stringify({contract:"qa-push-observation-v1"})&&window.observationCalls[0].hasJwt','exact session POST uses only page JWT');
 await button('Copiar diagnóstico remoto');await wait('!!window.copiedObservation');await check('!window.copiedObservation.includes("must-not-export")&&!window.copiedObservation.includes("receiptToken")&&!window.copiedObservation.includes("synthetic-test-only")','copy sanitizes malicious extra receipt');results.push('sanitized-session-export');
 await delay(10500);await check('window.observationCalls.some(c=>c.method==="GET")','visible diagnosis polls session');
 await evaluate('window.hidden()');const hiddenCount=await evaluate('window.observationCalls.length');await delay(10500);await check('window.observationCalls.length==='+hiddenCount,'hidden page stops polling');await evaluate('window.visible()');results.push('hidden-page-stops-poll');
 await evaluate('[...document.querySelectorAll("summary")].find(s=>s.textContent.includes("Diagnóstico temporal QA")).parentElement.open=false');await delay(200);const outerCount=await evaluate('window.observationCalls.length');await delay(10500);await check('window.observationCalls.length==='+outerCount,'outer diagnostic closure stops polling');results.push('outer-diagnostic-stops-poll');await evaluate('[...document.querySelectorAll("summary")].find(s=>s.textContent.includes("Diagnóstico temporal QA")).parentElement.open=true');
 await evaluate('[...document.querySelectorAll("summary")].find(s=>s.textContent.includes("Recorrido del clic externo QA")).parentElement.open=false');
 const before=await evaluate('window.observationCalls.length');await delay(10500);await check('window.observationCalls.length==='+before,'closed diagnosis stops polling');results.push('visible-only-bounded-poll');
 await evaluate('[...document.querySelectorAll("summary")].find(s=>s.textContent.includes("Recorrido del clic externo QA")).parentElement.open=true');await button('Detener y revocar');await wait('document.body.textContent.includes("Observar próximo aviso legítimo")');await check('window.observationCalls.filter(c=>c.method==="DELETE").length===1','stop revokes once');results.push('explicit-revocation');
 await evaluate('window.observationDisabled=true');await button('Observar próximo aviso legítimo');await wait('document.body.textContent.includes("todavía está desactivado")');
 const stopped=await evaluate('window.observationCalls.length');await delay(1500);await check('window.observationCalls.length==='+stopped,'disabled feature does not retry');results.push('disabled-feature-no-retry');
 await evaluate('window.observationDisabled=false');await button('Observar próximo aviso legítimo');await wait('document.body.textContent.includes("Detener y revocar")');await check('!sessionStorage.getItem("zipco-qa-push-observation-session-v1").includes("synthetic-test-only")','stored session has no JWT');
 await evaluate('localStorage.setItem("zipco-user-id","2");localStorage.setItem("zipco-token","other-synthetic-jwt");window.dispatchEvent(new Event("zipco-session-changed"))');await wait('sessionStorage.getItem("zipco-qa-push-observation-session-v1")===null');results.push('owner-change-clears-local-observation');
 await visit('slow-list=1');await evaluate('window.deliverObserved(window.targetUrl("click-observe0001"))');await wait('window.remoteAcks.some(a=>a.stage==="APP_TARGET_ACCEPTED")');await check('!window.remoteAcks.some(a=>a.stage==="CARD_FOCUSED")','no remote focus before list');
 await evaluate('window.releaseOrders()');await wait('document.activeElement?.id==="order-20"');await wait('window.remoteAcks.some(a=>a.stage==="CARD_FOCUSED")');
 await check('window.remoteAcks.every(a=>Object.keys(a).sort().join(",")==="attemptId,stage,traceId,type")','ACK carries public IDs and stage only');results.push('real-app-ack-after-card-focus');
 assert.equal(exceptions.length,0,JSON.stringify(exceptions));console.log(JSON.stringify({passed:true,results,realApp:true,realMutations:0,realNotifications:0}));

}finally{socket?.close();browser.kill();await server.close();}

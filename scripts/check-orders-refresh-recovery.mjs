// Real App/RequestsScreen click navigation; synthetic HTTP and worker transport. No QA mutations.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';

const directory = path.resolve('node_modules/.cache/orders-refresh-recovery');
fs.mkdirSync(directory, { recursive: true });
const harness = "\nimport React from 'react';\nimport {createRoot} from 'react-dom/client';\nimport App from '/src/app/App.tsx';\nimport {lateProcess} from '/src/app/screens/requests/lateInitialFixtures.ts';\nimport '/src/styles/index.css';\nconst params=new URL(location.href).searchParams;\nlocalStorage.clear();sessionStorage.clear();localStorage.setItem('zipco-registration-complete','true');sessionStorage.setItem('zipco-splash-seen','true');\nif(!params.has('late-session')){localStorage.setItem('zipco-token','synthetic-test-only');localStorage.setItem('zipco-user-id','1');}\nlocalStorage.setItem('zipco-business-id','5');window.calls=[];window.acks=[];window.workerMessages=[];window.ordersReady=!params.has('slow-list');let waits=[];\nconst raw=id=>({id,businessId:5,userId:1,businessName:'Consulta QA '+id,customerName:'Cliente QA',status:'pending',total:12000,products:[{name:'Producto QA',quantity:1,price:12000}],createdAt:'2026-10-26T20:02:00.000Z',deliveryDate:'2026-10-26',deliveryTime:'17:45',needNow:false,note:'Solicitud de prueba',requestProcess:{...lateProcess('OUT_OF_TIME',true),id:id===20?7:8}});\nwindow.fetch=async(url,init={})=>{const path=new URL(String(url),location.origin).pathname,method=init.method??'GET';window.calls.push({path,method});if(path.includes('/actions/')||['PATCH','DELETE','PUT'].includes(method)){throw Error('Forbidden order mutation');}if(method==='POST')return new Response('{}');if((path==='/orders/my-orders'||path==='/orders/business/5')){const role=path.includes('/my-orders')?'customer':'business';\nif(window.failRole===role||params.get('initial-fail')===role&&!window.recoverInitial)throw new TypeError('synthetic network failure');\nif(window.httpRole===role)return new Response('{}',{status:window.httpStatus});\nif(!window.ordersReady)await new Promise(r=>waits.push(r));return new Response(JSON.stringify(window.emptyRole===role?[]:[raw(20),raw(window.nextId??21)]));}if(path==='/request-process-capabilities')return new Response(JSON.stringify({supportedContracts:['availability-v3'],reservationCreationEnabled:true,simplifiedReservationCreationEnabled:true,lateInitialResponse:{contract:'late-initial-v1',creationEnabled:true}}));return new Response('[]');};\nwindow.releaseOrders=()=>{window.ordersReady=true;waits.splice(0).forEach(r=>r());};\nconst stores=new Map();const key=r=>typeof r==='string'?new URL(r,location.origin).href:r.url;\nwindow.fakeCaches={open:async name=>{if(!stores.has(name))stores.set(name,new Map());const rows=stores.get(name);return {match:async r=>rows.get(key(r))?.clone(),put:async(r,v)=>{rows.set(key(r),v.clone());},delete:async r=>rows.delete(key(r)),keys:async()=>[...rows.keys()].map(r=>new Request(r))};}};\nObject.defineProperty(window,'caches',{configurable:true,value:window.fakeCaches});\nconst sw=new EventTarget();let target=null,muted=false;\nwindow.workerDeliver=url=>sw.dispatchEvent(new MessageEvent('message',{data:{type:'ZIPCO_NOTIFICATION_NAVIGATE',url}}));\nconst worker={postMessage:(data,ports)=>{window.workerMessages.push(data.type);if(data.type==='ZIPCO_NOTIFICATION_WORKER_VERSION'){ports?.[0]?.postMessage({revision:'notification-click-attempt-v8',build:'a'.repeat(40),traceEnabled:false});return;}if(data.type==='ZIPCO_NOTIFICATION_NAVIGATED'){window.acks.push(data.url);if(target===data.url){target=null;void window.fakeCaches.open('zipco-notification-navigation-v1').then(c=>c.delete(new URL('/__zipco_notification_target__',location.origin).href));}}if(data.type==='ZIPCO_REQUEST_NOTIFICATION_TARGET'&&target&&!muted)window.workerDeliver(target);}};\nObject.assign(sw,{controller:worker,ready:Promise.resolve({active:worker,pushManager:{getSubscription:async()=>null}}),getRegistration:async()=>({active:worker})});\nObject.defineProperty(navigator,'serviceWorker',{configurable:true,value:sw});\nObject.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:(_ok,no)=>no?.({code:1})}});\nwindow.targetUrl=(click='click-00000001',id=20)=>'/?open=requests-customer&orderId='+id+'&notificationEvent=requests-customer%3Aorder-'+id+'-late-ask-late-request-need&notificationClick='+click;\nwindow.seedTarget=async(url,{deliver=true,silent=false}={})=>{target=url;muted=silent;const c=await window.fakeCaches.open('zipco-notification-navigation-v1');await c.put(new URL('/__zipco_notification_target__',location.origin).href,new Response(JSON.stringify({url,createdAt:Date.now()})));if(deliver)window.workerDeliver(url);};\nwindow.resume=()=>{document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('pageshow'));window.dispatchEvent(new Event('focus'));};\nwindow.hidden=()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('pagehide'));};\nwindow.visible=()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});window.resume();};\nwindow.restoreSession=()=>{localStorage.setItem('zipco-token','synthetic-test-only');localStorage.setItem('zipco-user-id','1');window.dispatchEvent(new Event('zipco-session-changed'));window.resume();};\nif(params.has('cold')){const url=new URL(window.targetUrl(),location.origin);url.pathname=location.pathname;params.forEach((v,k)=>url.searchParams.set(k,v));history.replaceState({},'',url);}\ncreateRoot(document.getElementById('root')).render(<App/>);window.testDriverReady=true;\n\nwindow.refreshLists=()=>window.dispatchEvent(new Event(\"zipco-requests-refresh\"));\n";
process.env.ZIPCO_QA_LOAD_DIAGNOSTICS="1";process.env.ZIPCO_QA_NOTIFICATION_TRACE="1";
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
 const navigateBusiness=async(query='',width=390)=>{
   await visit(query,width);await evaluate('window.seedTarget("/?open=requests-business&orderId=20&notificationClick=click-00000001")');
   await wait('!!document.querySelector(".zipco-late-card--business")');await delay(400);
 };
 const refresh=async()=>{const before=await evaluate('window.calls.filter(c=>c.path==="/orders/business/5").length');await evaluate('window.refreshLists()');await wait('window.calls.filter(c=>c.path==="/orders/business/5").length>'+before);await delay(350);};
 for(const width of [360,390]){
   await navigateBusiness('',width);
   const before=await evaluate('document.querySelectorAll(".zipco-late-card--business").length');
   const counts=await evaluate('[...document.querySelectorAll("button")].filter(b=>/^(Pendientes|Por coordinar|Esperando respuesta|En curso|Listo y notificado|Historial)/.test(b.textContent)).map(b=>b.textContent)');
   await evaluate('window.failRole="business"');await refresh();
   await wait('document.body.textContent.includes("No pudimos actualizar")');
   assert.equal(await evaluate('document.querySelectorAll(".zipco-late-card--business").length'),before);
   assert.deepEqual(await evaluate('[...document.querySelectorAll("button")].filter(b=>/^(Pendientes|Por coordinar|Esperando respuesta|En curso|Listo y notificado|Historial)/.test(b.textContent)).map(b=>b.textContent)'),counts);
   await shot('business-cards-retained-'+width);
   await evaluate('window.failRole=null');await button('Intentar nuevamente');
   await wait('!document.body.textContent.includes("No pudimos actualizar")');
   results.push('retain-business-and-recover-'+width);
 }
 await navigateBusiness();await evaluate('window.failRole="customer";window.nextId=23');await refresh();
 assert.equal(await evaluate('document.body.textContent.includes("No pudimos actualizar")'),false);
 assert.equal(await evaluate('document.querySelectorAll(".zipco-late-card--business").length'),2);
 results.push('customer-error-does-not-hide-business');
 await button('Mis Pedidos');await wait('document.body.textContent.includes("No pudimos actualizar")');
 assert.equal(await evaluate('document.querySelectorAll("#order-20").length>0'),true);
 await evaluate('window.failRole=null');await button('Intentar nuevamente');await wait('!document.body.textContent.includes("No pudimos actualizar")');results.push('customer-retained-and-recovered');
 await navigateBusiness();await evaluate('window.emptyRole="business"');await refresh();
 await wait('!document.querySelector(".zipco-late-card--business")');
 await evaluate('window.failRole="business"');await refresh();await wait('document.body.textContent.includes("No pudimos actualizar")');
 assert.equal(await evaluate('document.querySelectorAll(".zipco-late-card--business").length'),0);results.push('valid-empty-refresh-error');
 await navigateBusiness('initial-fail=customer');
 assert.equal(await evaluate('document.body.textContent.includes("No pudimos actualizar")'),false);
 await button('Mis Pedidos');await wait('document.body.textContent.includes("No se pudieron cargar los pedidos")');
 assert.equal(await evaluate('document.body.textContent.includes("No pudimos actualizar")'),false);
 await evaluate('window.recoverInitial=true');await button('Intentar nuevamente');await wait('!!document.querySelector("#order-20")');results.push('initial-customer-error-business-independent-and-recovery');
 await navigateBusiness();await evaluate('window.httpRole="business";window.httpStatus=403');await refresh();
 await wait('document.body.textContent.includes("No tienes permiso")');assert.equal(await evaluate('document.querySelectorAll(".zipco-late-card--business").length'),0);results.push('forbidden-removes-actionable-cards');
 assert.equal(await evaluate('window.calls.filter(c=>c.path.includes("/actions/")||["PATCH","DELETE","PUT"].includes(c.method)).length'),0);
 assert.equal(exceptions.length,0,JSON.stringify(exceptions));console.log(JSON.stringify({passed:true,results,realApp:true,realMutations:0,screenshots:directory}));
}finally{socket?.close();browser.kill();await server.close();}

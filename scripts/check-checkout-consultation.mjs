// Real checkout component with intercepted HTTP; no QA account or real orders.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';

const directory = path.resolve('node_modules/.cache/checkout-consultation');
fs.mkdirSync(directory, { recursive: true });
const harness = `
import React from 'react';
import {createRoot} from 'react-dom/client';
import CheckoutScreen from '/src/app/screens/CheckoutScreen.tsx';
import ActionHologramHost from '/src/app/screens/requests/ActionHologram.tsx';
import '/src/styles/index.css';
window.checkoutCalls=[]; window.checkoutComplete=0;
localStorage.setItem('zipco-token','browser-test-only');
localStorage.setItem('zipco-user-id','8');
window.fetch=async (url,init)=>{
 if(String(url).endsWith('/request-process-capabilities'))return new Response(JSON.stringify({supportedContracts:['availability-v1','availability-v2'],reservationCreationEnabled:false}));
 if(!String(url).endsWith('/orders/availability-requests')) throw Error('Unexpected HTTP');
 const body=JSON.parse(init.body);window.checkoutCalls.push({body,key:init.headers['Idempotency-Key']});
 await new Promise(resolve=>setTimeout(resolve,80));
 if(window.checkoutFailure) throw Error('Simulated network failure');
 return new Response(JSON.stringify({id:1,total:12000,items:[{id:1,orderId:1,catalogItemId:7,nameSnapshot:'Producto QA',unitPriceClpSnapshot:12000,quantity:1,subtotalClp:12000}],requestProcess:{id:7,state:'AWAITING_BUSINESS_RESPONSE',version:1,currentProposalId:123,agreementPublicId:null,flowContract:'AVAILABILITY_V1',allowedActions:['CANCEL_PENDING_REQUEST']}}),{status:201});
};
createRoot(document.getElementById('root')).render(<><CheckoutScreen business={{id:5,userId:9,name:'ZIPCO Negocio QA'}} currentUserId={8} selectedProducts={[7]} products={[{id:7,businessId:5,name:'Producto QA',description:'Producto de prueba',kind:'product',pricingMode:'fixed_price',priceClp:12000,isActive:true,imageUrl:''}]} onBack={()=>{}} onOrderComplete={()=>window.checkoutComplete++} onCatalogConflict={()=>{}} onSessionExpired={()=>{}}/><ActionHologramHost/></>);
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
    throw Error(`Timeout: ${expression}\n${JSON.stringify(exceptions)}`);
  };
  const click = async selector => { await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); await delay(100); };
  const button = async label => { await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)});if(!b)throw Error('Missing button');b.click()})()`); await delay(100); };
  const visit = async (query, width = 390) => {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
    await send('Page.navigate', { url: `${origin}/__checkout-test?${query}` });
    await wait('document.body.textContent.includes("Requiero este producto")');
    await delay(180);
  };
  const shot = async name => {
    const result = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(directory, `${name}.png`), Buffer.from(result.data, 'base64'));
  };
  const check = async (expression, message) => assert.equal(await evaluate(expression), true, message);

  await send('Runtime.enable'); await send('Network.enable');
  await send('Network.setBlockedURLs', { urls: ['https://*'] });
  for (const width of [320, 390, 430]) {
    await visit('', width);
    await button('Ahora');
    await button('Requiero este producto');
    await wait('!!document.querySelector("[role=dialog]")');
    await check('window.checkoutCalls.length===0', 'opening review must not POST');
    await check('document.querySelector("[role=switch]").getAttribute("aria-checked")==="true"', 'initial checked preference');
    await shot(`sheet-${width}`);
    await click('[role=switch]'); await button('Mantener');
    await check('document.querySelector("[role=switch]").getAttribute("aria-checked")==="true"', 'maintain');
    await click('[role=switch]'); await button('Quitar');
    await check('document.querySelector("[role=switch]").getAttribute("aria-checked")==="false"', 'explicit removal');
    await check('document.documentElement.scrollWidth<=innerWidth', 'no horizontal overflow');
    await evaluate('window.checkoutFailure=true');
    await button('Enviar solicitud');
    await wait('!!document.querySelector("[role=alert]")');
    await check('window.checkoutCalls.length===1&&window.checkoutComplete===0&&!document.querySelector(".zipco-ah")', 'no false success after network error');
    await check('document.querySelector("[role=switch]").disabled', 'uncertain preference frozen');
    await evaluate('window.checkoutFailure=false');
    await button('Enviar solicitud');
    await wait('window.checkoutComplete===1');
    await check('window.checkoutCalls.length===2&&JSON.stringify(window.checkoutCalls[0])===JSON.stringify(window.checkoutCalls[1])', 'same body and key after uncertainty');
    await check('window.checkoutCalls[1].body.customerContactPreference.allowed===false', 'unchecked sent explicitly');
    await check('!document.querySelector("[role=dialog]")&&document.querySelectorAll(".zipco-ah").length===1&&document.body.textContent.includes("Consulta enviada")', 'single success hologram');
  }
  await visit('',390); await button('Ahora'); await button('Requiero este producto');
  await button('Enviar solicitud'); await wait('window.checkoutComplete===1');
  await check('window.checkoutCalls[0].body.customerContactPreference.allowed===true', 'checked preference sent');
  assert.equal(exceptions.length,0,JSON.stringify(exceptions));
  console.log(JSON.stringify({passed:true,widths:[320,390,430],realCheckoutComponent:true,realOrdersCreated:0}));
} finally {
  socket?.close(); browser.kill(); await server.close();
}

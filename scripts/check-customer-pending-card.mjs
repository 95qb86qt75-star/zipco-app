// Real pending process card; intercepted HTTP, no QA account or real mutations.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';

const directory = path.resolve('node_modules/.cache/customer-pending-card');
fs.mkdirSync(directory, { recursive: true });
const harness = `
import React from 'react';
import {createRoot} from 'react-dom/client';
import ProcessOrderCard from '/src/app/screens/requests/ProcessOrderCard.tsx';
import {normalizeMyOrdersPayload} from '/src/app/screens/requests/orderNormalization.ts';
import {cancelPendingOrder,cancelledPendingOrder,cancelledPendingReceipt} from '/src/app/screens/requests/pendingCancellationFixtures.ts';
import '/src/styles/index.css';
window.pendingCalls=[]; window.pendingRefresh=0;
localStorage.setItem('zipco-token','browser-test-only');
localStorage.setItem('zipco-user-id','1');
sessionStorage.clear();
const query=new URLSearchParams(location.search);
const raw={...cancelPendingOrder,businessName:query.has('long')?'ZIPCO Negocio de prueba con nombre muy largo para revisar el espacio disponible':'ZIPCO Negocio QA',products:[{name:'Producto QA',quantity:1,price:12000}],total:12000,note:'Hola necesito esto de prueba',deliveryDate:'2026-10-25',deliveryTime:'12:20',referencePhoto:null,requestProcess:{...cancelPendingOrder.requestProcess,...(query.has('unknown')?{}:{customerContactPreference:{allowed:!query.has('off'),textVersion:'availability-customer-whatsapp-v1',recordedAt:'2026-10-24T20:00:00.000Z',effective:false,requiresReconfirmation:false}}),...(query.has('noCancel')?{allowedActions:[]}: {})}};
window.fetch=async (url,init)=>{
 window.pendingCalls.push({url:String(url),method:init?.method??'GET',body:init?.body?JSON.parse(init.body):null});
 if(init?.method==='POST'&&String(url).includes('/request-processes/7/actions/'))return new Response(JSON.stringify(cancelledPendingReceipt),{status:200});
 if(String(url).includes('/orders/my-orders'))return new Response(JSON.stringify([cancelledPendingOrder]),{status:200});
 throw Error('Unexpected HTTP');
};
createRoot(document.getElementById('root')).render(<main style={{padding:16,paddingTop:100,minHeight:'100dvh',background:'#f1f3fa'}}><ProcessOrderCard order={normalizeMyOrdersPayload([raw])[0]} isUpdating={false} onRetry={()=>window.pendingRefresh++}/></main>);
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
    await wait('document.body.textContent.includes("EN ESPERA")');
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
    await check('document.querySelector("section[hidden]")!==null&&window.pendingCalls.length===0', 'collapsed and no HTTP');
    await shot(`collapsed-${width}`);
    await button('Ver detalle');
    await check('document.body.textContent.includes("Hola necesito esto de prueba")&&document.querySelector("[aria-expanded=true]")!==null', 'detail preserved');
    await check('document.body.textContent.includes("Permitiste que el negocio")&&!document.body.textContent.includes("Esta elección todavía no comparte tu teléfono")', 'conditional preference without removed caption');
    await check('document.documentElement.scrollWidth<=innerWidth', 'no horizontal overflow');
    await shot(`expanded-${width}`);
    await button('Ocultar detalle');
    await evaluate('window.dispatchEvent(new CustomEvent("zipco-notification-card-open",{detail:{id:"order-20"}}))');
    await wait('document.querySelector("[aria-expanded=true]")!==null');
    await button('Anular solicitud');await wait('!!document.querySelector("[role=alertdialog]")');
    await check('document.body.textContent.includes("¿Confirmas anulación de tu pedido?")', 'same cancellation dialog');
    await button('No');await check('window.pendingCalls.length===0', 'No does not cancel');
    await button('Anular solicitud');await button('Sí');await wait('window.pendingRefresh>0');
    await check('window.pendingCalls.filter(c=>c.method==="POST").length===1&&window.pendingCalls.find(c=>c.method==="POST").body.confirmationAccepted===true', 'single existing cancellation action');
  }
  await visit('off=1&long=1',320);await button('Ver detalle');
  await check('document.body.textContent.includes("Sin autorizar el contacto")&&document.documentElement.scrollWidth<=innerWidth', 'off preference and long name');
  await visit('unknown=1&noCancel=1',390);await button('Ver detalle');
  await check('!document.querySelector(".zipco-av-contact-intent")&&![...document.querySelectorAll("button")].some(b=>b.textContent.includes("Anular solicitud"))', 'no invented preference or action');
  await check(`(()=>{const heading=document.querySelector('.zipco-av-neon');const animation=heading.getAnimations()[0];if(!animation)return false;animation.pause();animation.currentTime=0;const bright=Number(getComputedStyle(heading).opacity);animation.currentTime=1400;const dim=Number(getComputedStyle(heading).opacity);animation.play();return bright-dim>.3&&dim>.5})()`, 'visible opacity pulse while keeping the title readable');
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await check('getComputedStyle(document.querySelector(".zipco-av-neon")).animationName==="none"','reduced motion');
  assert.equal(exceptions.length,0,JSON.stringify(exceptions));
  console.log(JSON.stringify({passed:true,widths:[320,390,430],realProcessOrderCard:true,realMutations:0,notifications:true,cancellationYesNo:true}));
} finally {
  socket?.close(); browser.kill(); await server.close();
}

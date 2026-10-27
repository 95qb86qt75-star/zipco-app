// Real late-initial cards and alternative forms; synthetic HTTP/accounts only. No QA mutations.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';

const directory = path.resolve('node_modules/.cache/proposal-waiting-ui');
fs.mkdirSync(directory, { recursive: true });
const harness = "\nimport React from 'react';import {createRoot} from 'react-dom/client';\nimport ProcessOrderCard from '/src/app/screens/requests/ProcessOrderCard.tsx';\nimport {proposalsFixture} from '/src/app/screens/requests/proposalFixtures.ts';\nimport {normalizeBusinessOrdersPayload,normalizeMyOrdersPayload} from '/src/app/screens/requests/orderNormalization.ts';\nimport '/src/styles/index.css';\nconst params=new URL(location.href).searchParams,business=!params.has('customer'),sequence=params.has('final')?3:params.has('counter')?2:1,scheduled=!params.has('now');\nlocalStorage.clear();sessionStorage.clear();localStorage.setItem('zipco-token','synthetic-only');localStorage.setItem('zipco-user-id',business?'12':'11');if(business)localStorage.setItem('zipco-business-id','5');\nconst read=proposalsFixture(sequence,business);\nif(scheduled){for(const proposal of read.proposals){proposal.scheduledFor=proposal.sequence===0?'2026-10-26T20:45:00.000Z':'2026-10-28T22:30:00.000Z';proposal.subjectSnapshot.needNow=false;}read.process.proposalSummary.scheduledFor=read.proposals.at(-1).scheduledFor;}\nconst raw={id:20,businessId:5,userId:11,customerName:'Usuario Pauta QA',businessName:'Negocio QA',status:'alternative_proposed',total:2000,products:[{name:'Artículo sintético',quantity:2,price:1000}],createdAt:'2026-10-26T20:02:00.000Z',needNow:false,deliveryDate:'2026-10-26',deliveryTime:'17:45',note:'Nota original',requestProcess:read.process};\nconst order=(business?normalizeBusinessOrdersPayload:normalizeMyOrdersPayload)([raw])[0];window.calls=[];\nwindow.fetch=async(url,init={})=>{window.calls.push({url:String(url),method:init.method??'GET'});if(init.method&&init.method!=='GET')throw Error('Forbidden mutation');return new Response(JSON.stringify(read));};\ncreateRoot(document.getElementById('root')).render(<main style={{padding:16}}><ProcessOrderCard order={order} business={business} isUpdating={false} onRetry={()=>{}}/></main>);window.testDriverReady=true;\n";
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
 for(const width of [320,390,430])for(const kind of ['','final=1','now=1','final=1&now=1']){
  await visit(kind,width);await wait('!!document.querySelector("[data-proposal-waiting]")');
  await check('!document.body.textContent.includes("Ver conversación del pedido")&&document.body.textContent.includes("ESPERANDO AL CLIENTE")','conversation button hidden until detail opens');
  await check('(()=>{const card=document.querySelector(".zipco-wait-card");return card.scrollWidth<=card.clientWidth+1&&[...card.querySelectorAll(".zipco-wait-info,.zipco-wait-panel")].every(el=>el.scrollWidth<=el.clientWidth+1)})()','no horizontal overflow');
  if(kind.includes('now'))await check('!document.querySelector(".zipco-wait-cal")&&!document.querySelector(".zipco-wait-time")','null proposed date never invents time');
  else await check('document.querySelector(".zipco-wait-time").textContent.includes("19:30")&&document.querySelector(".zipco-wait-before").textContent.includes("17:45")','original and proposed times remain distinct in Chile');
  await shot('waiting-'+width+'-'+(kind||'scheduled').replaceAll('&','-').replaceAll('=','-'));
  await button('Ver detalle');await wait('document.body.textContent.includes("Ver conversación del pedido")');await check('document.body.textContent.includes("Nota original")','original request remains in detail');
  await button('Ver conversación del pedido');await wait('document.body.textContent.includes("Conversación del pedido")');
  await check('document.querySelectorAll("[data-proposal-sequence]").length==='+ (kind.includes('final')?'4':'2'),'conversation retains original and all proposals');
  await button('Ver detalle del pedido');await wait('document.body.textContent.includes("Artículo sintético")');await button('Cerrar detalle');
  await button('Ver detalle de la propuesta');await wait('document.querySelectorAll("[role=dialog]").length>1');await button('Cerrar detalle');
  await click('[aria-label="Cerrar propuestas"]');await button('Ocultar detalle');await check('!document.body.textContent.includes("Ver conversación del pedido")','detail collapses again');
  await check('window.calls.length===1&&window.calls.every(c=>c.method==="GET")','conversation opens with existing GET only');
  results.push('waiting-'+width+'-'+(kind||'scheduled'));
 }
 await visit('');await wait('!!document.querySelector("[data-proposal-waiting]")');await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await check('getComputedStyle(document.querySelector(".zipco-wait-ring svg")).animationName==="none"','hourglass respects reduced motion');await send('Emulation.setEmulatedMedia',{features:[]});results.push('reduced-motion');
 await visit('counter=1');await wait('!!document.querySelector("[data-aurora-state]")');await check('!document.querySelector("[data-proposal-waiting]")&&document.body.textContent.includes("Revisar propuesta y responder")','business counter response keeps actionable old UI');results.push('counter-preserved');
 for(const width of [320,390,430])for(const kind of ['','final=1','now=1','final=1&now=1']){
  await visit('customer=1&'+kind,width);await wait('!!document.querySelector("[data-proposal-role=customer]")');
  await check('document.body.textContent.includes("Revisar historial y responder")&&!document.body.textContent.includes("ESPERANDO AL CLIENTE")','customer has correct perspective and history button');
  await check('(()=>{const card=document.querySelector(".zipco-wait-card");return card.scrollWidth<=card.clientWidth+1})()','customer has no horizontal overflow');
  await shot('customer-waiting-'+width+'-'+(kind||'scheduled').replaceAll('&','-').replaceAll('=','-'));
  await button('Aceptar');await wait('!!document.querySelector("[data-accept-authorize]")');await check('window.calls.length===1&&window.calls.every(c=>c.method==="GET")','accept entry only reads fresh proposal and opens existing consent confirmation');
  await click('[aria-label=Volver]');await click('[aria-label="Cerrar propuestas"]');
  await button('Revisar historial y responder');await wait('!!document.querySelector(".zipco-chat-panel")');
  await check('document.querySelectorAll("[data-proposal-sequence]").length==='+(kind.includes('final')?'4':'2'),'customer history preserves all turns');
  await check('document.body.textContent.includes("Aceptar propuesta")&&document.body.textContent.includes("Rechazar")','existing response actions remain in history');
  await check('window.calls.every(c=>c.method==="GET")','opening customer actions never sends an acceptance');
  results.push('customer-'+width+'-'+(kind||'scheduled'));
 }
 assert.equal(exceptions.length,0,JSON.stringify(exceptions));console.log(JSON.stringify({passed:true,results,realMutations:0,screenshots:directory}));
}finally{socket?.close();browser.kill();await server.close();}

// Real late-initial cards and alternative forms; synthetic HTTP/accounts only. No QA mutations.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';

const directory = path.resolve('node_modules/.cache/product-preview');
fs.mkdirSync(directory, { recursive: true });
const harness = "\nimport React,{useState} from 'react';import {createRoot} from 'react-dom/client';\nimport ProcessOrderCard from '/src/app/screens/requests/ProcessOrderCard.tsx';import ProcessHistoryCard from '/src/app/screens/requests/ProcessHistoryCard.tsx';\nimport {normalizeBusinessOrdersPayload,normalizeMyOrdersPayload} from '/src/app/screens/requests/orderNormalization.ts';\nimport {proposalsFixture} from '/src/app/screens/requests/proposalFixtures.ts';import {agreementFixture} from '/src/app/screens/requests/requestProcessFixtures.ts';\nimport {simpleInitial,simpleWaiting} from '/src/app/screens/requests/simplifiedReservationFixtures.ts';import {lateProcess} from '/src/app/screens/requests/lateInitialFixtures.ts';\nimport '/src/styles/index.css';\nconst query=new URL(location.href).searchParams,business=!query.has('customer'),phase=query.get('phase')??'initial',multi=query.has('multi'),custom=query.has('custom'),legacy=query.has('legacy');\nlocalStorage.clear();sessionStorage.clear();localStorage.setItem('zipco-token','synthetic-test-only');localStorage.setItem('zipco-user-id',business?'12':'11');if(business)localStorage.setItem('zipco-business-id','5');\nconst proposals=proposalsFixture(phase==='waiting'?1:0,business).proposals;\nfor(const p of proposals){const alt=p.sequence>0;const first={catalogItemId:custom&&alt?null:alt?9:8,nameSnapshot:alt?'Pan alternativo':'Pan original',descriptionSnapshot:alt?'Pan integral propuesto':'Pan de masa madre elegido',quantity:alt?2:3,unitPriceClpSnapshot:custom&&alt?null:alt?5500:4000,subtotalClp:alt?11000:12000,...(alt?{source:custom?'CUSTOM':'CATALOG',publishedUnitPriceClp:custom?null:4000}:{})};p.subjectSnapshot={...p.subjectSnapshot,orderType:'product',items:[first,...(multi?[{...first,catalogItemId:10,nameSnapshot:'Galletas',descriptionSnapshot:'Galletas de avena',quantity:2,unitPriceClpSnapshot:2500,subtotalClp:5000,...(alt?{source:'CATALOG',publishedUnitPriceClp:2500}:{})}]:[])],needNow:false,referencePhoto:null,...(alt?{proposalPhoto:null}:{})};p.totalPriceClp=p.subjectSnapshot.items.reduce((s,i)=>s+i.subtotalClp,0);p.scheduledFor=alt?'2026-10-28T22:30:00.000Z':'2026-10-26T20:45:00.000Z';\n if(!legacy)p.productPreview={contract:'order-product-preview-v1',proposalId:p.id,items:p.subjectSnapshot.items.map((i,lineIndex)=>({lineIndex,catalogItemId:i.catalogItemId,source:i.source??'CATALOG',name:i.nameSnapshot,description:i.descriptionSnapshot,quantity:i.quantity,unitPriceClp:i.unitPriceClpSnapshot,subtotalClp:i.subtotalClp,imageUrl:custom&&alt||query.has('null-image')?null:'https://res.cloudinary.com/fixture/image/upload/v1/'+(query.has('broken')?'missing':alt?'alternative':'original')+'.png'}))};\n}\nconst original=proposals[0],latest=proposals.at(-1);let process=phase==='late'?lateProcess(business?'OUT_OF_TIME':'AWAITING_CUSTOMER',business):{...simpleInitial};\nif(phase==='waiting')process={...process,...proposalsFixture(1,business).process,flowContract:'AVAILABILITY_V3',availability:{...simpleWaiting.availability,proposalId:latest.id},proposalSummary:{type:latest.type,subjectSchemaVersion:2,totalPriceClp:latest.totalPriceClp,scheduledFor:latest.scheduledFor}};\nif(['progress','history'].includes(phase))process={...simpleInitial,state:phase==='history'?'COMPLETED':'IN_PROGRESS',version:4,agreementPublicId:'agreement-test',availability:simpleWaiting.availability,allowedActions:phase==='history'?[]:business?['MARK_READY']:[]};\nprocess={...process,productPreview:latest.productPreview,...(proposals.length>1?{requestedProductPreview:original.productPreview}:{})};if(query.has('invalid'))process.productPreview={...latest.productPreview,proposalId:999};\nconst accepted={...agreementFixture,acceptedProposalId:original.id,subjectSnapshot:original.subjectSnapshot,totalPriceClp:original.totalPriceClp,scheduledFor:original.scheduledFor,availability:simpleWaiting.availability,productPreview:original.productPreview};\nlet raw={id:20,orderType:'product',businessId:5,userId:11,customerName:'Cliente QA',businessName:'Negocio QA',status:phase==='waiting'?'alternative_proposed':phase==='progress'?'accepted':phase==='history'?'completed':'pending',total:original.totalPriceClp,products:original.subjectSnapshot.items.map(i=>({name:i.nameSnapshot,quantity:i.quantity,price:i.unitPriceClpSnapshot})),needNow:false,deliveryDate:'2026-10-26',deliveryTime:'17:45',createdAt:'2026-10-26T20:02:00.000Z',note:'Solicitud sintética',referencePhoto:'https://res.cloudinary.com/fixture/image/upload/v1/reference.png',requestProcess:process};\nwindow.calls=[];window.fetch=async(url,init={})=>{window.calls.push({url:String(url),method:init.method??'GET'});if(init.method&&init.method!=='GET')throw Error('Forbidden mutation');return new Response(JSON.stringify(String(url).includes('/agreement')?accepted:String(url).includes('/proposals')?{process,proposals}:String(url).includes('capabilities')?{supportedContracts:['availability-v3'],reservationCreationEnabled:true,simplifiedReservationCreationEnabled:true}: [raw]));};\nfunction Harness(){const [order,setOrder]=useState(()=>(business?normalizeBusinessOrdersPayload:normalizeMyOrdersPayload)([raw])[0]);window.moveToMissingProposal=()=>{raw.status='alternative_proposed';raw.requestProcess={...raw.requestProcess,currentProposalId:124,version:raw.requestProcess.version+1,state:'AWAITING_CUSTOMER_DECISION',allowedActions:[]};delete raw.requestProcess.productPreview;setOrder((business?normalizeBusinessOrdersPayload:normalizeMyOrdersPayload)([structuredClone(raw)])[0]);};window.omitPreview=()=>{delete raw.requestProcess.productPreview;setOrder((business?normalizeBusinessOrdersPayload:normalizeMyOrdersPayload)([structuredClone(raw)])[0]);};window.testDriverReady=true;return <main style={{padding:16,minHeight:'100dvh',background:'#f1f3fa'}}>{phase==='history'?<ProcessHistoryCard order={order}/>:<ProcessOrderCard order={order} business={business} isUpdating={false} onRetry={()=>{}}/>}</main>;}\ncreateRoot(document.getElementById('root')).render(<Harness/>);\n";
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
    if(value.method==='Fetch.requestPaused'){const url=value.params.request.url,missing=url.includes('missing'),fill=url.includes('alternative')?'#085f76':'#d99a2b';const svg='<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="'+fill+'"/><text x="45" y="110" font-size="28" fill="white">Producto QA</text></svg>';void send('Fetch.fulfillRequest',{requestId:value.params.requestId,responseCode:missing?404:200,responseHeaders:[{name:'Content-Type',value:'image/svg+xml'}],body:Buffer.from(missing?'missing':svg).toString('base64')});}
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
  await send('Fetch.enable',{patterns:[{urlPattern:'https://res.cloudinary.com/*'}]});


 const results=[];
 const unit=()=>evaluate('[...document.querySelectorAll(".zipco-product-prices>div")].find(row=>row.querySelector("dt").textContent==="Precio unitario").querySelector("dd").textContent');
 const open=async(selector='.zipco-product-thumb')=>{await wait('!!document.querySelector('+JSON.stringify(selector)+')');await click(selector);await wait('!!document.querySelector(".zipco-product-sheet")');};
 for(const customer of [false,true])for(const phase of ['initial','late','waiting','progress','history']){
  await visit('phase='+phase+(customer?'&customer=1':''));await wait('!!document.querySelector(".zipco-product-thumb")');const before=await evaluate('window.calls.length');await open();
  assert.equal(await unit(),phase==='waiting'?'$5.500':'$4.000');await check('document.querySelector(".zipco-product-description").textContent.includes('+(phase==='waiting'?'"integral"':'"masa madre"')+')','description belongs to selected snapshot');await wait('document.querySelector(".zipco-product-hero img")?.naturalWidth>0');
  await check('window.calls.length==='+before+'&&window.calls.every(c=>c.method==="GET")','opening preview does not call the API or mutate the order');await shot(phase+'-'+(customer?'customer':'business'));
  await click('.zipco-product-done');await wait('!document.querySelector(".zipco-product-sheet")');await check('document.activeElement.classList.contains("zipco-product-thumb")','close restores focus to thumbnail');results.push(phase+'-'+(customer?'customer':'business'));
 }
 for(const width of [320,430]){await visit('phase=waiting&customer=1',width);await open();await check('document.querySelector(".zipco-product-sheet").scrollWidth<=document.querySelector(".zipco-product-sheet").clientWidth+1','sheet fits mobile width');await shot('mobile-'+width);await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await wait('!document.querySelector(".zipco-product-sheet")');results.push('mobile-and-escape-'+width);}
 for(const option of ['broken','null-image']){await visit('phase=initial&'+option+'=1');await open();await wait('!!document.querySelector(".zipco-product-hero .zipco-product-image-fallback")');assert.equal(await unit(),'$4.000');await check('document.body.textContent.includes("Pan original")','image failure preserves text');results.push('image-'+option);}
 for(const customer of [false,true]){await visit('phase=waiting&multi=1'+(customer?'&customer=1':''));await open('.zipco-product-thumb:nth-child(2)');await check('document.querySelector(".zipco-product-title").textContent==="Galletas"','each thumbnail opens its own proposal line');assert.equal(await unit(),'$2.500');await click('.zipco-product-line-picker button');await check('document.querySelector(".zipco-product-title").textContent==="Pan alternativo"','line picker switches within the same proposal');assert.equal(await unit(),'$5.500');results.push('multi-'+customer);}
 await visit('phase=waiting&custom=1&customer=1');await open();await check('document.querySelector(".zipco-product-title").textContent==="Pan alternativo"&&!document.querySelector(".zipco-product-hero img")','custom product never inherits an image');assert.equal(await unit(),'No informado');results.push('custom-unit-unavailable');
 for(const option of ['legacy','invalid']){await visit('phase=initial&'+option+'=1');await wait('document.body.textContent.includes("NUEVO PEDIDO")');await check('!document.querySelector(".zipco-product-thumb")&&document.body.textContent.includes("Ver detalle")','absent/invalid preview keeps usable legacy card');results.push('compatible-'+option);}
 await visit('phase=waiting');await open();await click('.zipco-product-done');await button('Ver detalle');await button('Ver conversación del pedido');await wait('document.querySelectorAll("[data-proposal-sequence]").length===2');
 await open('[data-proposal-sequence="0"] .zipco-product-thumb');await check('document.querySelector(".zipco-product-title").textContent==="Pan original"','history original image and name are separate');assert.equal(await unit(),'$4.000');await check('document.querySelector(".zipco-product-hero img").src.includes("original.png")','original uses captured original URL');await click('.zipco-product-done');
 await open('[data-proposal-sequence="1"] .zipco-product-thumb');await check('document.querySelector(".zipco-product-title").textContent==="Pan alternativo"','history alternative uses its own product');assert.equal(await unit(),'$5.500');await check('document.querySelector(".zipco-product-hero img").src.includes("alternative.png")','alternative uses captured replacement URL');results.push('history-original-vs-alternative');
 await visit('phase=initial');await wait('!!document.querySelector(".zipco-product-thumb")');await evaluate('window.omitPreview()');await wait('!!document.querySelector(".zipco-product-thumb")');await open();assert.equal(await unit(),'$4.000');results.push('receipt-without-visual-keeps-known-proposal');

 await visit('phase=initial');await open();await evaluate('window.moveToMissingProposal()');await wait('!!document.querySelector("[data-proposal-waiting]")');await check('!document.querySelector(".zipco-product-thumb")&&!document.querySelector(".zipco-product-sheet")','proposal identity change never retains old image or an open old product');results.push('proposal-change-clears-old-preview');
 assert.equal(exceptions.length,0,JSON.stringify(exceptions));console.log(JSON.stringify({passed:true,results,realMutations:0,screenshots:directory}));
}finally{socket?.close();browser.kill();await server.close();}

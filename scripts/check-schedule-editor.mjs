// Real schedule editor and business configuration; synthetic HTTP only. No QA mutations.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';

const directory = path.resolve('node_modules/.cache/schedule-editor-check');
fs.mkdirSync(directory, { recursive: true });
const harness = "\nimport React,{useState} from 'react';\nimport {createRoot} from 'react-dom/client';\nimport ScheduleEditorScreen from '/src/app/screens/profile/business-config/ScheduleEditorScreen.tsx';\nimport BusinessConfigScreen from '/src/app/screens/profile/BusinessConfigScreen.tsx';\nimport '/src/styles/index.css';\nconst days=['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map((id,i)=>({id,name:['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'][i]}));\nconst initial=Object.fromEntries(days.map(d=>[d.id,{enabled:true,open:'08:00',close:'03:00'}]));\nlocalStorage.setItem('zipco-business-id','5');localStorage.setItem('zipco-token','synthetic-only');\nconst full=new URL(location.href).searchParams.has('full');\nwindow.calls=[];\nwindow.fetch=async(url,init={})=>{window.calls.push({url:String(url),method:init.method??'GET',body:init.body?JSON.parse(init.body):null});if(init.method==='PATCH'){localStorage.setItem('mock-schedule',JSON.stringify(JSON.parse(init.body).schedule));return new Response('{}');}if(String(url).endsWith('/businesses/me'))return new Response(JSON.stringify([{id:5,category:'QA',schedule:JSON.parse(localStorage.getItem('mock-schedule')??'null')??JSON.stringify(initial)}]));return new Response('[]');};\nfunction Harness(){const [applied,setApplied]=useState(null);window.testDriverReady=true;return <div style={{height:'100dvh',position:'relative'}}>{full?<BusinessConfigScreen providerType=\"Negocio\" onBack={()=>{}} onSave={s=>{window.savedSchedule=s.schedule;}}/>:applied?<output>{JSON.stringify(applied)}</output>:<ScheduleEditorScreen days={days} initialSchedule={initial} onCancel={()=>{}} onApply={s=>{window.savedSchedule=s;setApplied(s);}}/>}<nav data-bottom-nav style={{position:'absolute',bottom:0,height:80,width:'100%',zIndex:50,background:'white'}}>Inicio · Perfil · Favoritos · Solicitudes</nav></div>}\ncreateRoot(document.getElementById('root')).render(<Harness/>);\n";
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
 for(const [width,height] of [[320,640],[390,844],[412,823]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});
  await send('Page.navigate',{url:origin+'/__checkout-test?'});
  await wait('window.testDriverReady===true');await delay(200);
  await check('(()=>{const b=[...document.querySelectorAll("button")].find(b=>b.textContent.includes("Guardar horarios"));const r=b.getBoundingClientRect();const n=document.querySelector("nav").getBoundingClientRect();return r.top>=0&&r.bottom<=n.top&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===b})()','save button fully visible and touchable above navigation');
  await evaluate('document.querySelector("[aria-label^=Editar]").click()');await delay(100);
  await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent.includes("Cierre")).click()');await delay(100);
  await button('20:00');await button('Confirmar hora');
  await check('!window.savedSchedule','editing does not apply configuration early');
  await shot('save-visible-'+width);
  const point=await evaluate('(()=>{const r=[...document.querySelectorAll("button")].find(b=>b.textContent.includes("Guardar horarios")).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');
  await send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});
  await wait('!!window.savedSchedule');
  await check('Object.values(window.savedSchedule).every(d=>d.open==="08:00"&&d.close==="20:00"&&d.enabled)','applied schedule contains edited hours');
  results.push({width,height,saveVisibleAndTouchable:true,editedScheduleApplied:true});
 }
 await send('Page.navigate',{url:origin+'/__checkout-test?'});await wait('window.testDriverReady===true');await delay(150);
 await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent.includes("Cierre")).click()');await delay(100);await button('19:00');await button('Confirmar hora');await button('Guardar horarios');
 await check('!window.savedSchedule&&document.body.textContent.includes("Selecciona los días a los que")','saving unassigned hour stays in editor with guidance');
 await evaluate('[...document.querySelectorAll("button")].find(b=>b.getAttribute("aria-label")==="Volver a configuración").click()');await delay(100);await check('document.body.textContent.includes("¿Salir sin aplicar?")','unapplied edits protected on back');await button('Seguir editando');await button('Lun');await button('Guardar horarios');await wait('!!window.savedSchedule');
 await check('window.savedSchedule.monday.close==="19:00"&&window.savedSchedule.tuesday.close==="03:00"','only selected days updated');results.push('unassigned-time-and-exit-protection');
 await evaluate('localStorage.removeItem("mock-schedule")');await send('Page.navigate',{url:origin+'/__checkout-test?full=1'});await wait('document.body.textContent.includes("8:00–3:00")');
 await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent.includes("Horarios de Atención")).click()');await delay(150);await evaluate('document.querySelector("[aria-label^=Editar]").click()');await delay(100);await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent.includes("Cierre")).click()');await delay(100);await button('20:00');await button('Confirmar hora');await button('Guardar horarios');
 await wait('document.body.textContent.includes("8:00–20:00")');await check('!window.calls.some(c=>c.method==="PATCH")','apply returns to configuration without premature API writes');await button('Guardar cambios');await wait('!!window.savedSchedule');
 await check('window.calls.filter(c=>c.method==="PATCH").length===1&&Object.values(JSON.parse(window.calls.find(c=>c.method==="PATCH").body.schedule)).every(d=>d.close==="20:00")','existing PATCH carries edited schedule exactly once');
 await send('Page.navigate',{url:origin+'/__checkout-test?full=1'});await wait('document.body.textContent.includes("8:00–20:00")');results.push('configuration-patch-and-readback');
 assert.equal(exceptions.length,0,JSON.stringify(exceptions));console.log(JSON.stringify({passed:true,results,realMutations:0}));
}finally{socket?.close();browser.kill();await server.close();}

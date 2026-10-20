// Real React/DOM/CSS, synthetic data, all backend/upload access blocked.
// node scripts/check-business-alternative-draft.mjs <QA build assets directory>
// Uses installed Chrome, no additional dependencies; does not test iOS WebKit.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { build } from 'esbuild';
const directory = path.resolve('node_modules/.cache/business-alternative-browser');
const assets = path.resolve(process.argv[2] || 'node_modules/.cache/business-alternative-draft-qa/assets');
fs.mkdirSync(directory, { recursive: true });
await build({ stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
import React from 'react'; import { createRoot } from 'react-dom/client';
import Actions from './src/app/screens/requests/PendingAlternativeActions';
import { normalizeBusinessOrdersPayload } from './src/app/screens/requests/orderNormalization';
import { rawOrder, pendingProcess } from './src/app/screens/requests/requestProcessFixtures';
window.React = React; window.blockedRequests = 0;
window.fetch = async () => { window.blockedRequests++; throw Error('Network disabled in draft test'); };
const service = new URLSearchParams(location.search).get('type') === 'service';
const multi = new URLSearchParams(location.search).has('multi');
const order = normalizeBusinessOrdersPayload([{ ...rawOrder, orderType: service ? 'service' : 'product', needNow: true,
  total: service ? 1000 : multi ? 2500 : 2000, products: [{ name: 'Synthetic item', quantity: service ? 1 : 2, price: 1000 }, ...(multi ? [{name:'Second synthetic item', quantity:1, price:500}] : [])],
  requestProcess: { ...pendingProcess, allowedActions: ['ACCEPT_FIXED_ORDER', 'REJECT_PENDING_REQUEST'] } }])[0];
createRoot(document.getElementById('root')).render(<Actions order={order} business />);
` }, bundle: true, format: 'esm', jsx: 'automatic', outfile: path.join(directory, 'fixture.js'),
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' } });
const css = fs.readFileSync(path.join(assets, fs.readdirSync(assets).find(name => name.endsWith('.css'))));
const html = '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>';
const server = http.createServer((request, response) => {
  response.setHeader('Content-Type', request.url === '/fixture.js' ? 'text/javascript' : request.url === '/fixture.css' ? 'text/css' : 'text/html');
  response.end(request.url === '/fixture.js' ? fs.readFileSync(path.join(directory, 'fixture.js')) : request.url === '/fixture.css' ? css : html);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const profile = path.join(directory, `profile-${Date.now()}`);
const browser = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket, launchError;
browser.on('error', error => { launchError = error; });
try {
  const portFile = path.join(profile, 'DevToolsActivePort');
  for (let i = 0; !fs.existsSync(portFile) && !launchError && i < 200; i++) await delay(50);
  if (launchError) throw launchError;
  const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  const pending = new Map(); let sequence = 0;
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data); if (!pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id); pending.delete(message.id);
    message.error ? reject(Error(message.error.message)) : resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.text); return result.result.value;
  };
  const wait = async expression => {
    for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await delay(50); }
    throw Error('Draft DOM condition did not settle');
  };
  const touch = async label => {
    const point = await evaluate(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(label)});
      if (!b || b.disabled) throw Error('Draft control missing or disabled'); b.scrollIntoView({ block:'center', behavior:'instant' });
      const r = b.getBoundingClientRect(); return { x:r.left+r.width/2, y:r.top+r.height/2 }; })()`);
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] }); await delay(40);
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await delay(80);
  };
  const fill = (selector, value, tag = 'HTMLInputElement') => evaluate(`(() => { const input=document.querySelector(${JSON.stringify(selector)});
    Object.getOwnPropertyDescriptor(${tag}.prototype,'value').set.call(input,${JSON.stringify(value)}); input.dispatchEvent(new Event('input',{bubbles:true})); })()`);
  await send('Network.enable'); await send('Network.setBlockedURLs', { urls: ['https://*'] });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  const evidence = [];
  const scenarios = [[400,870,'product'],[400,870,'service'],[393,852,'product'],[393,852,'service'],[320,700,'product'],[320,700,'service'],[393,852,'product',true],[393,500,'product']];
  for (const [width, height, type, multi] of scenarios) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
    await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/?type=${type}${multi ? '&multi=1' : ''}` });
    await wait('document.querySelector("button")?.textContent === "Proponer alternativa"');
    await touch('Proponer alternativa'); await wait('!!document.querySelector("[role=dialog]")');
    const initial = await evaluate(`(() => { const d=document.querySelector('[role=dialog]'); return { fits:d.scrollWidth<=d.clientWidth+1,
      removedNotice:!d.textContent.includes('Solo preparación. Aún no se puede enviar al cliente.'), quantityDisabled:[...d.querySelectorAll('button')].find(b=>b.textContent.includes('Cantidad')).disabled }; })()`);
    assert(initial.fits && initial.removedNotice, 'Modal must fit without the removed visual notice');
    assert.equal(initial.quantityDisabled, type === 'service');
    const geometry = await evaluate(`(()=>{const tiles=[...document.querySelectorAll('button[aria-pressed]')].map(b=>b.getBoundingClientRect());const footer=document.querySelector('[data-alternative-footer]').getBoundingClientRect(); return {rows:tiles.map(r=>r.top), footerTop:footer.top,footerBottom:footer.bottom};})()`);
    assert(geometry.rows.every(top=>Math.abs(top-geometry.rows[0])<2), 'All four tiles must stay on one row');
    assert(geometry.footerTop>=0 && geometry.footerBottom<=height-12, 'Footer must stay in the viewport');
    await touch('Precio');
    assert(await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Revisar alternativa').disabled`), 'Unsaved edit must block review');
    await fill('input[aria-label="Nuevo precio por unidad"]', '1500');
    await touch('Guardar');
    assert.equal(await evaluate(`document.querySelector('button[aria-label="Precio, cambio guardado"]').getAttribute('aria-pressed')`), 'true');
    await fill('textarea', 'Cambio de precio por nueva preparación.', 'HTMLTextAreaElement');
    await touch('Revisar alternativa');
    await wait('document.querySelector("[role=dialog]")?.textContent.includes("Comparación · Borrador sin enviar")');
    const review = await evaluate(`(()=>{const d=document.querySelector('[role=dialog]');return {fits:d.scrollWidth<=d.clientWidth+1,
      blocked:[...d.querySelectorAll('button')].find(b=>b.textContent==='Confirmar y enviar')?.disabled,
      requests:window.blockedRequests, persisted:localStorage.length+sessionStorage.length};})()`);
    assert(review.fits && review.blocked); assert.equal(review.requests, 0); assert.equal(review.persisted, 0);
    await touch('Volver al formulario');
    await evaluate(`document.querySelector('button[aria-label="Cerrar alternativa"]').click()`);
    await wait('!document.querySelector("[role=dialog]")');
    await touch('Proponer alternativa'); await wait('!!document.querySelector("textarea")');
    assert.equal(await evaluate('document.querySelector("textarea").value'), '', 'Reopening must discard the draft');
    await touch('Producto');
    assert.equal(await evaluate(`document.querySelectorAll('button[aria-pressed]')[0].getAttribute('aria-pressed')`), 'false', 'Opening item must not select the price tile');
    assert.equal(await evaluate(`document.querySelector('input[aria-label="Precio total de la opción escrita"]').required`), true);
    await fill('input[maxlength="120"]', 'Opción escrita sintética');
    await fill('textarea[placeholder]', 'Otra preparación con precio explicado.', 'HTMLTextAreaElement');
    assert(await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Guardar').disabled`), 'CUSTOM must still require total');
    await fill('input[aria-label="Precio total de la opción escrita"]', '10000');
    if((width===393||width===320) && type==='product' && !multi){const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(directory,`design-claude-${width}.png`),Buffer.from(shot.data,'base64'));}
    await touch('Guardar');
    assert.equal(await evaluate(`document.querySelectorAll('button[aria-pressed]')[0].getAttribute('aria-pressed')`), 'false', 'Saving item must not select price');
    await touch('Precio'); await fill('input[aria-label="Nuevo precio total de la opción"]', '12000'); await touch('Guardar');
    await touch('Precio'); await touch('Quitar cambio');
    assert.equal(await evaluate(`document.querySelector('button[aria-label="Producto, cambio guardado"]').getAttribute('aria-pressed')`),'true','Removing price must preserve item');
    await touch('Revisar alternativa');
    assert(await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Confirmar y enviar')?.disabled`));
    assert.equal(await evaluate('window.blockedRequests'), 0);
    await touch('Volver al formulario');
    await evaluate(`(()=>{const dt=new DataTransfer();dt.items.add(new File([new Uint8Array([1])],'synthetic.png',{type:'image/png'}));const input=document.querySelector('input[type=file]');input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await wait('!!document.querySelector("img[src^=blob]")');
    const photo = await evaluate('document.querySelector("img[src^=blob]").src');
    if(multi){await evaluate(`(()=>{const s=document.querySelector('select');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(s,'1');s.dispatchEvent(new Event('change',{bubbles:true}));})()`);assert.equal(await evaluate('document.querySelector("img[src^=blob]").src'),photo,'Photo belongs to the proposal, not a single editor line');}
    const fixed = await evaluate(`(()=>{const body=document.querySelector('[data-alternative-body]');body.scrollTop=body.scrollHeight;return document.querySelector('[data-alternative-footer]').getBoundingClientRect().bottom;})()`);
    assert(Math.abs(fixed-geometry.footerBottom)<=2,'Body scroll must not move the footer');
    assert.equal(await evaluate('window.blockedRequests'),0);
    evidence.push({ width, height, type, multi:!!multi, horizontalOverflow: false, submissionBlocked: true, draftDiscarded: true, fixedFooter:true, independentSelections:true });
  }
  console.log(JSON.stringify({ passed: evidence.length, touchEvents: true, backendAccess: false, orderActions: false, evidence }));
  await send('Browser.close');
} finally { socket?.close(); browser.kill(); await new Promise(resolve => server.close(resolve)); }

// Isolated browser review of design components. No API, account, or real orders.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';

const directory = path.resolve('node_modules/.cache/availability-design');
fs.mkdirSync(directory, { recursive: true });
const server = await createServer({ mode: 'qa', server: { host: '127.0.0.1', port: 0, strictPort: false } });
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
    await send('Page.navigate', { url: `${origin}/availability-design.html?${query}` });
    await wait('!!document.querySelector(".zipco-av-preview-phone")');
    await delay(180);
  };
  const shot = async name => {
    const result = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(directory, `${name}.png`), Buffer.from(result.data, 'base64'));
  };
  const check = async (expression, message) => assert.equal(await evaluate(expression), true, message);
  const results = [];
  await send('Runtime.enable'); await send('Network.enable');
  await send('Network.setBlockedURLs', { urls: ['https://*'] });
  await visit('screen=1');
  await wait('!!document.querySelector("[role=dialog]")');
  await check('document.querySelector("[role=switch]").getAttribute("aria-checked")==="true"', 'initial consent checked');
  await shot('p1-sheet');
  await click('[role=switch]'); await wait('!!document.querySelector("[role=alertdialog]")');
  await button('Mantener');
  await check('document.querySelector("[role=switch]").getAttribute("aria-checked")==="true"', 'maintain consent');
  await click('[role=switch]'); await button('Quitar');
  await check('document.querySelector("[role=switch]").getAttribute("aria-checked")==="false"', 'remove consent');
  await click('[role=switch]');
  await check('!document.querySelector("[role=alertdialog]")', 'reenable without extra confirmation');
  await button('Enviar solicitud');
  await check('document.body.textContent.includes("No se guardaron cambios")', 'preview does not claim real send');
  results.push('p1-initial-checked-maintain-remove-reenable-no-send');

  for (const width of [320, 360, 390]) {
    await visit('screen=2&detail=1', width); await shot(`p2-folded-${width}`);
    await check('document.querySelector(".zipco-av-disclosure").getAttribute("aria-expanded")==="false"', 'pending initially folded');
    await button('Ver detalle'); await check('document.querySelector(".zipco-av-original").getBoundingClientRect().height>0', 'detail visible');
    await button('Anular solicitud'); await wait('!!document.querySelector("[role=alertdialog]")');
    await button('No'); await check('!document.querySelector("[role=alertdialog]")', 'dismiss cancellation');
    await check('document.documentElement.scrollWidth<=innerWidth', `no pending horizontal overflow ${width}`);
    await shot(`p2-detail-${width}`);
    await visit('screen=3&expanded=1', width);
    await button('Confirmar disponibilidad$12.000');
    await wait('!!document.querySelector("[role=dialog]")');
    await shot(`p4-choice-${width}`);
    await check('document.documentElement.scrollWidth<=innerWidth', `no dialog horizontal overflow ${width}`);
    await click('.zipco-av-channel-pickup');
    await check('document.querySelector("textarea").value===""&&document.querySelector("textarea").placeholder.includes("Acércate")', 'editable placeholder');
    await check('document.querySelector("textarea").maxLength===120&&document.querySelector("input").maxLength===80', 'pickup input limits');
    await check('document.querySelector(".zipco-av-pickup-contact button").getAttribute("aria-pressed")==="true"', 'pickup contact initially off');
    await shot(`p4-pickup-${width}`);
    await click('.zipco-av-pickup-contact button:last-child');
    await evaluate(`(()=>{const t=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(t,'Mensaje de prueba');t.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await button('Cambiar opción'); await click('.zipco-av-channel-pickup');
    await check('document.querySelector("textarea").value==="Mensaje de prueba"', 'retain typed pickup message when changing option');
    await button('Confirmar disponibilidad');
    await check('document.body.textContent.includes("No se guardaron cambios")', 'no false availability confirmation');
    await visit('screen=5&path=pickup', width);
    await check('document.querySelector(".zipco-av-contact-button").disabled&&!document.querySelector("a[href*=wa]")', 'no premature WhatsApp');
    await button('No, gracias'); await button('Volver');
    await check('!document.querySelector("[role=alertdialog]")', 'decline can be dismissed');
    await check('document.documentElement.scrollWidth<=innerWidth', `no available horizontal overflow ${width}`);
    await shot(`p5-pickup-${width}`);
    results.push(`p2-p3-p4-p5-${width}`);
  }
  await visit('screen=2&expanded=1&unknownContact=1');
  await check('!document.querySelector(".zipco-av-contact-intent")', 'unknown intent not invented');
  await visit('screen=3'); await shot('p3-folded');
  await button('Ver detalle'); await shot('p3-expanded');
  await button('Confirmar disponibilidad$12.000');
  await click('.zipco-av-channel-whatsapp');
  await check('document.body.textContent.includes("No se guardaron cambios")', 'no real availability action');
  await visit('screen=5'); await shot('p5-whatsapp');
  await click('[role=switch]');
  await check('document.querySelector("[role=switch]").getAttribute("aria-checked")==="false"', 'customer can decline contact');
  await button('Sí, continuar con la compra');
  await check('document.body.textContent.includes("sin autorizar contacto")', 'commercial decision separate from contact');
  await visit('screen=5&path=pickup&businessContact=0&noSchedule=1');
  await check('!document.querySelector(".zipco-av-contact-button")', 'pickup without phone permission hides WhatsApp');
  await visit('screen=5&long=1', 320);
  await check('document.documentElement.scrollWidth<=innerWidth', 'long name layout');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await visit('screen=2');
  await check('getComputedStyle(document.querySelector(".zipco-av-neon")).animationName==="none"', 'reduced motion');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await check('document.activeElement.tagName==="BUTTON"', 'keyboard controls');
  await send('Page.navigate', { url: `${origin}/?design=availability&screen=5&path=pickup` });
  await wait('!!document.querySelector(".zipco-av-preview-phone")');
  await check('document.body.textContent.includes("Sin conexión al backend")', 'QA app entry opens design with explicit notice');
  assert.equal(requests.some(url => /\/orders(?:[/?]|$)|\/request-processes\/|\/qa\/auth\//.test(url)), false, 'no order or auth API calls');
  assert.equal(exceptions.length, 0, JSON.stringify(exceptions));
  results.push('unknown-contact-business-choice-customer-decision-pickup-gates-long-name-keyboard-reduced-motion-no-api');
  results.push('qa-app-entry-opens-design-without-auth-or-api');
  fs.writeFileSync(path.join(directory, 'report.json'), JSON.stringify({ passed: results.length, results, screenshots: directory, orderApiCalls: 0 }, null, 2));
  console.log(JSON.stringify({ passed: results.length, results, screenshots: directory, orderApiCalls: 0 }, null, 2));
} finally {
  socket?.close(); browser.kill(); await server.close();
}

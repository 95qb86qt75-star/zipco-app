import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';
import { createTiming } from './timing.mjs';

export async function withBrowser(suite, fixture, run) {
  if (!['coordination', 'acceptance'].includes(fixture)) throw Error('Unknown fixture');
  const timing = createTiming(suite), directory = path.resolve('node_modules/.cache/qa-pilot', suite);
  fs.mkdirSync(directory, { recursive: true });
  let server, browser, socket;
  const pending = new Map(), externalRequests = [], exceptions = [];
  let serial = 0, origin;
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  try {
    server = await timing.measure('fixture/server preparation', async () => {
      const vite = await createServer({ mode: 'qa', plugins: [{
        name: 'qa-pilot-navigation-boundary', enforce: 'pre',
        transform(code, id) {
          if (fixture !== 'coordination' || !id.replaceAll('\\', '/').endsWith('/useCoordination.ts')) return;
          const from = 'window.location.assign(response.navigation.url);';
          assert.equal(code.split(from).length, 2, 'Navigation boundary changed; update the fixture explicitly');
          return { code: code.replace(from, 'window.testNavigate(response.navigation.url);'), map: null };
        },
      }], server: { host: '127.0.0.1', port: 0, strictPort: false } });
      await vite.listen(); return vite;
    });
    origin = 'http://127.0.0.1:' + server.httpServer.address().port;
    await timing.measure('browser startup', async () => {
      const profile = path.join(directory, 'profile-' + Date.now());
      browser = spawn(process.env.ZIPCO_TEST_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
        ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-background-networking',
          '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'],
        { windowsHide: true, stdio: 'ignore' });
      let spawnError;
      browser.once('error', error => { spawnError = error; });
      const portFile = path.join(profile, 'DevToolsActivePort');
      let port;
      for (let i = 0; i < 300; i++) {
        if (spawnError) throw spawnError;
        if (browser.exitCode !== null) throw Error('Chrome exited before startup: ' + browser.exitCode);
        try { port = fs.readFileSync(portFile, 'utf8').split('\n')[0].trim(); if (/^\d+$/.test(port)) break; }
        catch (error) { if (!['ENOENT', 'EBUSY', 'EPERM'].includes(error.code)) throw error; }
        await delay(50);
      }
      if (!port) throw Error('Chrome startup timed out');
      const tabs = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
      socket = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
      await new Promise((resolve, reject) => {
        socket.addEventListener('open', resolve, { once: true });
        socket.addEventListener('error', () => reject(Error('Chrome connection failed')), { once: true });
      });
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++serial, timer = setTimeout(() => { pending.delete(id); reject(Error('CDP timed out: ' + method)); }, 20000);
      pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
    });
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
      if (message.method === 'Fetch.requestPaused') {
        const url = new URL(message.params.request.url);
        const local = url.origin === origin || ['data:', 'blob:'].includes(url.protocol);
        if (!local) externalRequests.push(url.origin);
        void send(local ? 'Fetch.continueRequest' : 'Fetch.failRequest',
          local ? { requestId: message.params.requestId } : { requestId: message.params.requestId, errorReason: 'BlockedByClient' }).catch(() => {});
      }
      const entry = pending.get(message.id); if (!entry) return;
      pending.delete(message.id); clearTimeout(entry.timer);
      message.error ? entry.reject(Error(message.error.message)) : entry.resolve(message.result);
    });
    const evaluate = async expression => {
      const value = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (value.exceptionDetails) throw Error(value.exceptionDetails.exception?.description || value.exceptionDetails.text);
      return value.result.value;
    };
    const wait = async expression => {
      for (let i = 0; i < 300; i++) {
        const result = await evaluate(expression);
        if (result === true) return;
        if (result !== false && result !== undefined && result !== null) throw Error('Wait must return a boolean: ' + expression);
        await delay(50);
      }
      throw Error('Timed out: ' + expression + ' / ' + (await evaluate('document.body.textContent')).slice(0, 1400));
    };
    await send('Runtime.enable'); await send('Network.enable');
    await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    const ctx = { assert, directory, timing, send, evaluate, wait, delay, externalRequests, exceptions,
      async visit(query = '', width = 393, height = 852) {
        await evaluate('try{sessionStorage.clear()}catch{}');
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
        await send('Page.navigate', { url: origin + '/scripts/qa/fixture.html?fixture=' + fixture + '&' + query });
        await wait('window.testDriverReady===true');
        if (fixture === 'coordination') {
          await wait('!!document.querySelector("#order-20")');
          if (!query.includes('before=1') && !query.includes('disabled=1') && !query.includes('no-access=1'))
            await wait('document.querySelector("#order-20 .zipco-avw-query-yes")?.disabled===false');
        }
      },
      async tap(selector, scroll = true) {
        if (scroll) await evaluate('document.querySelector(' + JSON.stringify(selector) + ')?.scrollIntoView({block:"center",behavior:"instant"})');
        await delay(100);
        const point = await evaluate('(()=>{const el=document.querySelector(' + JSON.stringify(selector) + ');if(!el)throw Error("Missing target");const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;return{x,y,hit:el.contains(document.elementFromPoint(x,y)),inert:!!el.closest("[inert]")};})()');
        assert(point.hit && !point.inert, 'Physical tap blocked: ' + selector + ' ' + JSON.stringify(point));
        await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: point.x, y: point.y }] });
        await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await delay(100);
      },
      async screenshot(name) {
        const result = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(directory, name + '.png'), Buffer.from(result.data, 'base64'));
      },
    };
    const result = await run(ctx);
    assert.deepEqual(externalRequests, [], 'External browser requests must remain blocked and absent');
    assert.deepEqual(exceptions, [], 'Unexpected browser exceptions');
    return result;
  } finally {
    for (const item of pending.values()) { clearTimeout(item.timer); item.reject(Error('Browser closed')); }
    socket?.close(); browser?.kill(); await server?.close();
    timing.save(path.join(directory, 'timing.json'));
  }
}

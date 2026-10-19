// Isolated DOM regression: real RequestsScreen/CSS, synthetic data, no backend.
// Usage: node scripts/check-request-summary-scroll.mjs <QA build assets directory>
// Uses installed Chrome (CHROME_PATH can override); installs no dependencies.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { build } from 'esbuild';

const directory = path.resolve('node_modules/.cache/request-summary-browser');
const assets = path.resolve(process.argv[2] || 'node_modules/.cache/request-summary-scroll-qa/assets');
fs.mkdirSync(directory, { recursive: true });
const entry = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import Screen from './src/app/screens/RequestsScreen';
import { normalizeBusinessOrdersPayload, normalizeMyOrdersPayload } from './src/app/screens/requests/orderNormalization';
import { pendingProcess, coordinationProcess, rawOrder } from './src/app/screens/requests/requestProcessFixtures';
window.React = React;
window.fetch = async () => { throw Error('Backend disabled in synthetic UI check'); };
window.fixtureHasBusiness = new URLSearchParams(location.search).get('open') === 'requests-business';
const raw = [
  ['pending', 'AWAITING_BUSINESS_RESPONSE'], ['accepted', 'COORDINATION_PENDING'],
  ['accepted', 'IN_PROGRESS'], ['ready', 'READY'],
].map(([status, state], i) => ({ ...rawOrder, id: 20 + i, status,
  clientName: 'Synthetic customer', businessName: 'Synthetic business', referencePhoto: null,
  requestProcess: { ...(i ? coordinationProcess : pendingProcess), id: 70 + i, state },
}));
window.fixtureOrders = normalizeBusinessOrdersPayload(raw);
window.fixtureMyOrders = normalizeMyOrdersPayload(raw);
window.fixtureQuotes = [];
createRoot(document.getElementById('root')).render(<Screen activeTab="requests"
  setActiveTab={() => {}} onBack={() => {}} onSessionExpired={() => {}} />);
`;

await build({
  stdin: { contents: entry, resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, format: 'esm', jsx: 'automatic', outfile: path.join(directory, 'fixture.js'),
  define: {
    'process.env.NODE_ENV': '"production"',
    'import.meta.env': JSON.stringify({ QA_LOAD_DIAGNOSTICS: false,
      QA_NOTIFICATION_TRACE: false, VITE_API_URL: 'http://127.0.0.1' }),
  },
  plugins: [{ name: 'synthetic-hooks', setup(builder) {
    builder.onResolve({ filter: /requests\/useRequests$/ }, () => ({ path: 'orders', namespace: 'fixture' }));
    builder.onResolve({ filter: /quotes\/useQuotes$/ }, () => ({ path: 'quotes', namespace: 'fixture' }));
    builder.onLoad({ filter: /.*/, namespace: 'fixture' }, (args) => ({ loader: 'js',
      contents: args.path === 'orders' ? `export default function() { return {
        myOrders: window.fixtureMyOrders, requests: window.fixtureOrders,
        hasBusiness: window.fixtureHasBusiness, isLoading: false, loadError: '',
        updatingOrderIds: new Set(), loadOrders: () => { throw Error('Unexpected reload'); },
        performAction: () => { throw Error('No order action allowed'); },
      }; }` : `export default function() { return {
        myQuotes: window.fixtureQuotes, businessQuotes: window.fixtureQuotes,
        loading: false, error: '', updating: new Set(), load: () => { throw Error('Unexpected reload'); },
      }; }`,
    }));
  } }],
});

const stylesheet = fs.readFileSync(path.join(assets, fs.readdirSync(assets).find(name => name.endsWith('.css'))));
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div>
  <script type="module" src="/fixture.js"></script></body></html>`;
const server = http.createServer((request, response) => {
  const script = request.url.startsWith('/fixture.js');
  response.setHeader('Content-Type', script ? 'text/javascript' : request.url === '/fixture.css' ? 'text/css' : 'text/html');
  response.end(script ? fs.readFileSync(path.join(directory, 'fixture.js')) : request.url === '/fixture.css' ? stylesheet : html);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

const profile = path.join(directory, `profile-${Date.now()}`);
const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run',
  '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-port=0',
  `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let launchError;
browser.on('error', error => { launchError = error; });
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
let socket;
try {
  const portFile = path.join(profile, 'DevToolsActivePort');
  for (let i = 0; !fs.existsSync(portFile) && !launchError && i < 200; i++) await delay(50);
  if (launchError) throw launchError;
  const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (!pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    message.error ? reject(Error(message.error.message)) : resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.text);
    return result.result.value;
  };
  await send('Network.enable');
  await send('Network.setBlockedURLs', { urls: ['https://*'] });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  const evidence = [];
  for (const [width, height] of [[400, 870], [393, 852], [320, 700]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
    for (const role of ['business', 'customer']) {
      await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/?open=requests-${role}` });
      for (let i = 0; i < 100; i++) {
        if (await evaluate(`!!document.querySelector('[data-requests-scroll]')`)) break;
        await delay(50);
      }
      await delay(400);
      const labels = role === 'business'
        ? ['Nuevo Pedido', 'pedido por coordinar', 'pedido en curso', 'listo y notificado']
        : ['pedido en Coordinación', 'pedido listo para recibir'];
      for (const label of labels) {
        const locate = `(() => {
          document.querySelector('[data-requests-scroll]').scrollTop = 0;
          const button = [...document.querySelectorAll('button')].find(b => b.textContent.includes(${JSON.stringify(label)}));
          if (!button) throw Error('Summary not rendered');
          button.scrollIntoView({ block: 'nearest', behavior: 'instant' });
          const rect = button.getBoundingClientRect();
          return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        })()`;
        const point = await evaluate(locate);
        await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
        await delay(50);
        await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await delay(400);
        const position = await evaluate(`(() => {
          const scroller = document.querySelector('[data-requests-scroll]');
          const results = document.querySelector('[data-request-results]');
          const card = results.querySelector('[id^="order-"]');
          return { scroll: scroller.scrollTop, viewportTop: scroller.getBoundingClientRect().top,
            resultsTop: results.getBoundingClientRect().top, cardTop: card?.getBoundingClientRect().top,
            cardBottom: card?.getBoundingClientRect().bottom };
        })()`);
        assert(position.scroll > 0, 'Click must move to the results');
        assert(Math.abs(position.resultsTop - position.viewportTop - 12) <= 2, 'Results must align below header');
        assert(position.cardTop >= position.resultsTop && position.cardTop < position.resultsTop + 80, 'First card must be visible');
        assert(position.cardBottom < height - 80, 'Synthetic folded card must fit above the footer area');
        evidence.push({ width, height, role, label, ...position });
        await evaluate(`document.querySelector('[data-requests-scroll]').scrollTop = 0`);
        await delay(200);
        assert.equal(await evaluate(`document.querySelector('[data-requests-scroll]').scrollTop`), 0, 'Manual scroll must not be pulled back');
      }
    }
  }
  console.log(JSON.stringify({ passed: evidence.length, touchEvents: true, backendAccess: false, orderActions: false, evidence }));
  await send('Browser.close');
} finally {
  socket?.close();
  browser.kill();
  await new Promise(resolve => server.close(resolve));
}

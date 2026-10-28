// Real RequestsScreen/CSS: large synthetic business lists, no backend/actions.
// Usage: node scripts/check-request-list-motion.mjs <QA build assets directory>
// Uses installed Chrome (CHROME_PATH can override); installs no dependencies.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { build } from 'esbuild';

const directory = path.resolve('node_modules/.cache/request-list-motion-browser');
const assets = path.resolve(process.argv[2] || 'node_modules/.cache/request-summary-scroll-qa/assets');
fs.mkdirSync(directory, { recursive: true });
const entry = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import Screen from './src/app/screens/RequestsScreen';
import { normalizeBusinessOrdersPayload, normalizeMyOrdersPayload } from './src/app/screens/requests/orderNormalization';
import { lateProcess } from './src/app/screens/requests/lateInitialFixtures';
import { availabilityInitial } from './src/app/screens/requests/availabilityFixtures';
import { proposalsFixture } from './src/app/screens/requests/proposalFixtures';
import { pendingProcess, coordinationProcess, rawOrder } from './src/app/screens/requests/requestProcessFixtures';
window.React = React;
window.fetch = async () => { throw Error('Backend disabled in synthetic UI check'); };
window.fixtureHasBusiness = new URLSearchParams(location.search).get('open') === 'requests-business';
const params=new URLSearchParams(location.search),count=Number(params.get('count')||5),kind=params.get('kind')||'late';
const raw=Array.from({length:count},(_,i)=>({...rawOrder,id:20+i,status:'pending',customerName:'Synthetic customer',businessName:'Synthetic business',referencePhoto:null,requestProcess:{...(kind==='late'?lateProcess():kind==='waiting'?proposalsFixture(1).process:availabilityInitial),id:70+i}}));
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
        readStatus: { customer: {loaded:true,loading:false,error:''}, business: {loaded:true,loading:false,error:''} },
        updatingOrderIds: new Set(), loadOrders: () => { throw Error('Unexpected reload'); },
        performAction: () => { throw Error('No order action allowed'); },
      }; }` : `export default function() { return {
        myQuotes: window.fixtureQuotes, businessQuotes: window.fixtureQuotes,
        loading: false, error: '', updating: new Set(), load: () => { throw Error('Unexpected reload'); },
      }; }`,
    }));
  } }],
});

const stylesheet = fs.readFileSync(path.join(assets, fs.readdirSync(assets).find(name => name.startsWith('index-') && name.endsWith('.css'))));
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
  let port;
  for (let i=0; i<100&&!port; i++) {
    try { const value=fs.readFileSync(portFile,'utf8').split('\n')[0]; if(/^\d+$/.test(value))port=value; } catch { /* Chrome can still hold the startup file. */ }
    if(!port)await delay(50);
  }
  assert(port,'Chrome debugging port available');
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let sequence = 0;
  const pending = new Map(), exceptions=[];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if(message.method==='Runtime.exceptionThrown')exceptions.push(message.params.exceptionDetails);
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
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Network.setBlockedURLs', { urls: ['https://*'] });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  const evidence=[];
  await send('Emulation.setDeviceMetricsOverride',{width:393,height:852,deviceScaleFactor:1,mobile:true});
  await send('Emulation.setCPUThrottlingRate',{rate:4});
  for(const [kind,count,reducedMotion=false] of [['fresh',5],['fresh',30],['late',5],['late',30],['waiting',7],['late',5,true]]){
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reducedMotion?'reduce':'no-preference'}]});
    await send('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/?open=requests-business&kind='+kind+'&count='+count});
    for(let i=0;i<100;i++){if(await evaluate('!!document.querySelector("[data-requests-scroll]")'))break;await delay(50);}
    await delay(800);
    const label=kind==='waiting'?'esperando al cliente':'Nuevos Pedidos';
    assert(await evaluate('[...document.querySelectorAll("button")].some(b=>b.textContent.includes('+JSON.stringify(label)+'))'),JSON.stringify(exceptions)+await evaluate('document.body.textContent'));
    await evaluate('window.samples=[];window.scrollingSamples=[];document.querySelector("[data-requests-scroll]").addEventListener("scroll",()=>queueMicrotask(()=>{if(document.querySelector("[data-request-list-scrolling]"))window.scrollingSamples.push(document.getAnimations().filter(a=>a.playState==="running"&&a.animationName?.startsWith("zipco-late")).length);}));let previous=performance.now();window.sampling=true;const frame=t=>{window.samples.push(t-previous);previous=t;if(window.sampling)requestAnimationFrame(frame);};requestAnimationFrame(frame);');
    const point=await evaluate('(()=>{const b=[...document.querySelectorAll("button")].find(b=>b.textContent.includes('+JSON.stringify(label)+'));const r=b.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()');
    await send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});
    await delay(90);
    const during=await evaluate('({running:document.getAnimations().filter(a=>a.playState==="running"&&a.animationName?.startsWith("zipco-late")).length,paused:!!document.querySelector("[data-request-list-scrolling]"),scroll:document.querySelector("[data-requests-scroll]").scrollTop})');
    await delay(900);
    const result=await evaluate('(()=>{window.sampling=false;const scroller=document.querySelector("[data-requests-scroll]"),cards=[...document.querySelectorAll("[data-request-results] [id^=order-]")],v=scroller.getBoundingClientRect();const visible=cards.filter(c=>{const r=c.getBoundingClientRect();return r.bottom>v.top&&r.top<v.bottom;});const running=c=>c.getAnimations({subtree:true}).filter(a=>a.playState==="running"&&a.animationName?.startsWith("zipco-late")).length;return{cards:cards.length,visible:visible.length,offscreenRunning:cards.filter(c=>!visible.includes(c)).reduce((n,c)=>n+running(c),0),visibleRunning:visible.reduce((n,c)=>n+running(c),0),resultsTop:document.querySelector("[data-request-results]").getBoundingClientRect().top-v.top,frameP95:window.samples.sort((a,b)=>a-b)[Math.floor(window.samples.length*.95)]};})()');
    assert.equal(result.cards,count);assert(Math.abs(result.resultsTop-12)<2,'summary aligns results');
    if(!process.argv.includes('--baseline')&&kind==='late'){
      const paused=await evaluate('(()=>{document.querySelector("[data-requests-scroll]").dispatchEvent(new Event("scroll"));return document.getAnimations().filter(a=>a.playState==="running"&&a.animationName?.startsWith("zipco-late")).length})()');
      assert.equal(paused,0,'scroll handler pauses actual browser decorations');
      assert.equal(result.offscreenRunning,0,'offscreen clocks do not animate');if(reducedMotion)assert.equal(result.visibleRunning,0,'reduced motion remains respected');else assert(result.visibleRunning>0,'visible clocks resume');
    }
    await evaluate('document.querySelector("[data-requests-scroll]").scrollTop+=400');await delay(500);
    const manual=await evaluate('document.querySelector("[data-requests-scroll]").scrollTop');await delay(250);assert.equal(await evaluate('document.querySelector("[data-requests-scroll]").scrollTop'),manual,'manual scrolling stays free');
    evidence.push({kind,count,reducedMotion,during,...result});
  }
  console.log(JSON.stringify({passed:true,baseline:process.argv.includes('--baseline'),cpuThrottle:4,synthetic:true,backendAccess:false,evidence}));
  await send('Browser.close');
} finally {
  socket?.close();
  browser.kill();
  await new Promise(resolve => server.close(resolve));
}

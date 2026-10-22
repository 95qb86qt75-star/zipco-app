// Isolated real UI + synthetic snapshots, no API calls or order actions.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { build } from 'esbuild';
import assert from 'node:assert/strict';
const mode = process.argv[2] || 'optimized';
const directory = path.resolve('node_modules/.cache/deal-flow-render-budget');
const assets = path.resolve('node_modules/.cache/business-alternative-draft-qa/assets');
fs.mkdirSync(directory, { recursive: true });
const currentCss = fs.readFileSync(path.join(assets, fs.readdirSync(assets).find(name => name.endsWith('.css'))));
const baseline = path.join(directory, 'baseline.css');
if (mode === 'baseline' && !fs.existsSync(baseline)) fs.writeFileSync(baseline, currentCss);
const css = mode === 'baseline-replay' ? fs.readFileSync(baseline) : currentCss;
await build({ stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import * as Dialog from '@radix-ui/react-dialog';
import AcceptAuthorizeCard from './src/app/screens/requests/AcceptAuthorizeCard';
import AcceptGlassButton from './src/app/screens/requests/AcceptGlassButton';
import ProposalChat from './src/app/screens/requests/ProposalChat';
import DealSuccessHost,{announceDealClosed} from './src/app/screens/requests/DealSuccess';
import {normalizeProposals} from './src/app/screens/requests/proposalContract';
import {proposalsFixture} from './src/app/screens/requests/proposalFixtures';
window.React=React;window.requests=0;window.fetch=async()=>{window.requests++;throw Error('Network forbidden');};
localStorage.setItem('zipco-user-id','12');localStorage.setItem('zipco-token','synthetic');localStorage.setItem('zipco-business-id','8');
const fixture=proposalsFixture(2,true),read=normalizeProposals(fixture,fixture.process.id);let show=()=>{},serial=0;
window.stage=next=>{show(next);if(next==='success')announceDealClosed('synthetic-'+(++serial));};
function App(){const [stage,setStage]=useState('card');show=setStage;return <>
<main style={{minHeight:'100vh',padding:16,background:'linear-gradient(#f8fafc,#dbeafe)'}}><h2>Solicitudes sintéticas</h2><p>Mi Negocio · Por coordinar</p></main>
<DealSuccessHost/>{stage==='card'&&<Dialog.Root open><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[1000] bg-black/40"/>
<Dialog.Content data-accept-overlay="true" className="zipco-chat-panel fixed inset-4 z-[1001] bg-white rounded-3xl overflow-hidden">
<Dialog.Title>Revisar propuesta</Dialog.Title><Dialog.Description>Tu conversación con el cliente.</Dialog.Description>
<ProposalChat read={read} business canCounter={false} turn="mine"/><AcceptGlassButton label="Aceptar contrapropuesta" onClick={()=>{}}/>
<AcceptAuthorizeCard open busy={false} business counterpartName="Cliente sintético" title="2× Producto QA" when="Lo antes posible" total="$25.000" onChoose={()=>{}} onClose={()=>{}}/>
</Dialog.Content></Dialog.Portal></Dialog.Root>}</>;}
createRoot(document.getElementById('root')).render(<App/>);
` }, bundle: true, format: 'esm', jsx: 'automatic', outfile: path.join(directory, 'fixture.js'),
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' } });
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', req.url === '/fixture.js' ? 'text/javascript' : req.url === '/fixture.css' ? 'text/css' : 'text/html');
  res.end(req.url === '/fixture.js' ? fs.readFileSync(path.join(directory, 'fixture.js')) : req.url === '/fixture.css' ? css : '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const profile = path.join(directory, `profile-${Date.now()}`);
const browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new','--disable-gpu','--no-first-run','--disable-background-networking','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'], { windowsHide: true, stdio: 'ignore' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms)); let socket;
try {
  let port;
  for (let i=0;i<200&&!port;i++) { try { port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0]; } catch {} if(!port) await delay(50); }
  if (!port) throw Error('Chrome port unavailable');
  const tabs=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket=new WebSocket(tabs.find(tab=>tab.type==='page').webSocketDebuggerUrl);await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
  let sequence=0;const pending=new Map();socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(!pending.has(m.id))return;const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
  await send('Emulation.setDeviceMetricsOverride',{width:393,height:852,deviceScaleFactor:2,mobile:true});
  await send('Emulation.setCPUThrottlingRate',{rate:4});await send('Network.enable');await send('Network.setBlockedURLs',{urls:['https://*']});await send('Performance.enable');
  await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`});
  for(let i=0;i<100;i++){if(await evaluate('!!document.querySelector("[data-accept-authorize]")'))break;await delay(50);}
  const results=[];
  for(const phase of ['card','success']) {
    if(phase==='success')await evaluate(`window.stage('success');true`);
    await delay(800);
    const effects=await evaluate(`document.getAnimations().filter(a=>a.playState==='running').map(a=>({name:a.animationName,infinite:a.effect.getTiming().iterations===Infinity,underReview:!!(a.effect.target?.element||a.effect.target)?.closest('.zipco-chat-panel')}))`);
    const start=Object.fromEntries((await send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
    const frames=await evaluate(`new Promise(resolve=>{const samples=[];let last=performance.now(),end=last+1800;requestAnimationFrame(function frame(now){samples.push(now-last);last=now;if(now<end)requestAnimationFrame(frame);else resolve({frames:samples.length,over33:samples.filter(n=>n>33).length,maxMs:Math.round(Math.max(...samples))});});})`);
    const end=Object.fromEntries((await send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
    const before=performance.now();const shot=await send('Page.captureScreenshot',{format:'png'});const screenshotMs=Math.round(performance.now()-before);
    fs.writeFileSync(path.join(directory,`${mode}-${phase}.png`),Buffer.from(shot.data,'base64'));
    results.push({phase,effects,frames,taskMs:Math.round((end.TaskDuration-start.TaskDuration)*1000),styleMs:Math.round((end.RecalcStyleDuration-start.RecalcStyleDuration)*1000),layoutMs:Math.round((end.LayoutDuration-start.LayoutDuration)*1000),screenshotMs});
    if(mode==='optimized'&&phase==='card'){
      assert.equal(effects.filter(a=>a.underReview).length,0,'Covered review effects must pause');
      assert(!effects.some(a=>['zipco-sheet-float','zipco-d-holoshift','zipco-d-glassglow'].includes(a.name)),'Large card and shadow repaint loops must stop');
      assert(effects.filter(a=>a.infinite).length<=5,'Keep only small transform/opacity effects and the moving sheen');
      assert.equal(await evaluate('getComputedStyle(document.querySelector("[data-accept-authorize]")).animationDuration'),'0.18s');
    }
  }
  assert.equal(await evaluate('window.requests'),0);
  const result={mode,cpuThrottle:4,results,realBackendAccess:false,physicalAndroid:false};
  fs.writeFileSync(path.join(directory,`${mode}.json`),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await send('Browser.close');
} finally { socket?.close();browser.kill();await new Promise(resolve=>server.close(resolve)); }

// Visual and DOM checks only, using synthetic values and compiled QA CSS.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const directory=path.resolve('node_modules/.cache/accept-glass-browser'),assets=path.resolve('node_modules/.cache/business-alternative-draft-qa/assets');
fs.mkdirSync(directory,{recursive:true});
await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
import React from 'react';import {createRoot} from 'react-dom/client';import Accept from './src/app/screens/requests/AcceptGlassButton';
window.React=React;window.calls=0;window.bubbles=0;
const click=e=>{e.stopPropagation();window.calls++};
function App(){return <main style={{padding:16}} onClick={()=>window.bubbles++}>
 <section style={{padding:20,borderRadius:24,background:'#17143b'}}>
  <Accept label="Aceptar pedido" price={50000000} onClick={click}/>
  <Accept label="Aceptar propuesta" price={3000} onClick={click}/>
  <Accept label="Aceptar contrapropuesta" price={50000000} onClick={click}/>
  <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8,marginTop:16}}>
   <button style={{color:'white'}}>Volver</button><Accept size="compact" flush label="Sí, confirmar" onClick={click}/>
  </div><Accept disabled label="Guardando…" onClick={click}/>
 </section></main>;}createRoot(document.getElementById('root')).render(<App/>);
`},bundle:true,format:'esm',jsx:'automatic',outfile:path.join(directory,'fixture.js'),define:{'process.env.NODE_ENV':'"production"'}});
const css=fs.readFileSync(path.join(assets,fs.readdirSync(assets).find(n=>n.endsWith('.css'))));
const html='<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root" style="height:100dvh;overflow:auto"></div><script type="module" src="/fixture.js"></script></body></html>';
const server=http.createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/fixture.js'?'text/javascript':req.url==='/fixture.css'?'text/css':'text/html');res.end(req.url==='/fixture.js'?fs.readFileSync(path.join(directory,'fixture.js')):req.url==='/fixture.css'?css:html);});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const profile=path.join(directory,`profile-${Date.now()}`),browser=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--disable-background-networking','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));let socket;
try{
 const portFile=path.join(profile,'DevToolsActivePort');for(let i=0;!fs.existsSync(portFile)&&i<200;i++)await delay(50);
 const port=fs.readFileSync(portFile,'utf8').split('\n')[0],tabs=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
 socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
 const pending=new Map();let sequence=0;socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(!pending.has(m.id))return;const {resolve,reject}=pending.get(m.id);pending.delete(m.id);m.error?reject(Error(m.error.message)):resolve(m.result);});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 await send('Network.enable');await send('Network.setBlockedURLs',{urls:['https://*']});await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`});
 for(let i=0;i<100&&!await evaluate('!!document.querySelector(".zipco-accept-btn")');i++)await delay(50);
 const cases=[];
 for(const width of [320,360,393,400])for(const dark of [false,true]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:852,deviceScaleFactor:1,mobile:true});await evaluate(`document.documentElement.classList.toggle('dark',${dark})`);await delay(100);
  const checks=await evaluate(`([...document.querySelectorAll('.zipco-accept-btn')].map(b=>{const r=b.getBoundingClientRect();return {label:b.querySelector('.zipco-accept-label').textContent,ok:[...b.querySelectorAll('.zipco-accept-label,.zipco-accept-price')].every(e=>{const er=e.getBoundingClientRect();return er.left>=r.left&&er.right<=r.right+1&&er.bottom<=r.bottom+1&&e.scrollWidth<=e.clientWidth+1})&&r.right<=innerWidth&&r.height>=44};}))`);
  const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(directory,`buttons-${width}-${dark?'dark':'light'}.png`),Buffer.from(shot.data,'base64'));
  assert(checks.every(c=>c.ok),`Clipped text at ${width}/${dark}: ${JSON.stringify(checks)}`);cases.push(`${width}/${dark}`);
 }
 await evaluate(`document.querySelector('.zipco-accept-btn:disabled').click()`);assert.equal(await evaluate('window.calls'),0);
 const position=await evaluate(`(()=>{const b=document.querySelector('.zipco-accept-btn');b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()`);
 await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[position]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(100);
 assert.equal(await evaluate('window.calls'),1);assert.equal(await evaluate('window.bubbles'),0);
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 assert(await evaluate(`[...document.querySelectorAll('.zipco-accept-wrap,.zipco-accept-blob,.zipco-accept-check')].every(e=>getComputedStyle(e).animationName==='none')`));
 console.log(JSON.stringify({passed:cases.length,widths:[320,360,393,400],themes:2,maxPrice:50000000,compact:true,disabled:true,touchOnce:true,propagationPreserved:true,reducedMotion:true,backendAccess:false}));await send('Browser.close');
}finally{socket?.close();browser.kill();await new Promise(resolve=>server.close(resolve));}

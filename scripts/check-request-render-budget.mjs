// Real cards + compiled CSS, synthetic list, no network/order actions.
// node scripts/check-request-render-budget.mjs [baseline|optimized]
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { build } from 'esbuild';
import assert from 'node:assert/strict';
const mode = process.argv[2] || 'optimized';
const directory = path.resolve('node_modules/.cache/request-render-budget');
const assets = path.resolve('node_modules/.cache/business-alternative-draft-qa/assets');
fs.mkdirSync(directory,{recursive:true});
const cssFile = path.join(assets,fs.readdirSync(assets).find(name=>name.endsWith('.css')));
if(mode==='baseline')fs.copyFileSync(cssFile,path.join(directory,'baseline.css'));
const css=fs.readFileSync(mode==='baseline-replay'?path.join(directory,'baseline.css'):cssFile);
await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
import React from 'react';import {createRoot} from 'react-dom/client';
import ProcessOrderCard from './src/app/screens/requests/ProcessOrderCard';
import {normalizeMyOrdersPayload} from './src/app/screens/requests/orderNormalization';
import {rawOrder} from './src/app/screens/requests/requestProcessFixtures';
import {proposalsFixture} from './src/app/screens/requests/proposalFixtures';
window.React=React;window.requests=0;window.fetch=async()=>{window.requests++;throw Error('Network forbidden');};
localStorage.setItem('zipco-token','synthetic-session');localStorage.setItem('zipco-user-id','11');
const process=proposalsFixture(1,false).process;
const orders=normalizeMyOrdersPayload(Array.from({length:20},(_,i)=>({...rawOrder,id:20+i,status:'alternative_proposed',requestProcess:process})));
createRoot(document.getElementById('root')).render(<main style={{height:'100dvh',overflowY:'auto',padding:16}} data-list>{orders.map(order=><div key={order.id} style={{marginBottom:16}}><ProcessOrderCard order={order} isUpdating={false} isUnread onRetry={()=>{}} /></div>)}</main>);
`},bundle:true,format:'esm',jsx:'automatic',outfile:path.join(directory,'fixture.js'),define:{'process.env.NODE_ENV':'"production"','import.meta.env':'{}'}});
const server=http.createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/fixture.js'?'text/javascript':req.url==='/fixture.css'?'text/css':'text/html');res.end(req.url==='/fixture.js'?fs.readFileSync(path.join(directory,'fixture.js')):req.url==='/fixture.css'?css:'<!doctype html><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"><div id="root"></div><script type="module" src="/fixture.js"></script>');});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const profile=path.join(directory,`profile-${Date.now()}`);
const browser=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--disable-background-networking','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));let socket;
try{
 const portFile=path.join(profile,'DevToolsActivePort');let port;
 for(let i=0;i<200&&!port;i++){try{port=fs.readFileSync(portFile,'utf8').split('\n')[0];}catch{}if(!port)await delay(50);}
 if(!port)throw Error('Chrome port unavailable');
 const tabs=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
 socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
 let sequence=0;const pending=new Map();socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(!pending.has(m.id))return;const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 await send('Emulation.setDeviceMetricsOverride',{width:393,height:852,deviceScaleFactor:2,mobile:true});
 await send('Emulation.setCPUThrottlingRate',{rate:4});await send('Network.enable');await send('Network.setBlockedURLs',{urls:['https://*']});await send('Performance.enable');
 await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`});
 for(let i=0;i<100;i++){if(await evaluate('document.querySelectorAll("article").length===20'))break;await delay(50);}
 await delay(1200);
 const animations=await evaluate(`(()=>{const a=document.getAnimations().filter(a=>a.playState==='running'&&a.effect.getTiming().iterations===Infinity);return {infinite:a.length,offscreen:a.filter(a=>{const target=a.effect.target?.element||a.effect.target;const r=target?.getBoundingClientRect();return r&&(r.bottom<0||r.top>innerHeight);}).length,names:[...new Set(a.map(a=>a.animationName))]};})()`);
 const start=Object.fromEntries((await send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
 await delay(3000);
 const end=Object.fromEntries((await send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
 const screenshotMs=[];for(let i=0;i<3;i++){const before=performance.now();const shot=await send('Page.captureScreenshot',{format:'png'});screenshotMs.push(Math.round(performance.now()-before));if(i===0)fs.writeFileSync(path.join(directory,`${mode}.png`),Buffer.from(shot.data,'base64'));}
 await delay(5000);
 const settledDecorations=await evaluate('document.getAnimations().filter(a=>a.playState==="running").length');
 await evaluate('document.querySelector("[data-list]").scrollTop=900;true');await delay(250);
 const scroll=await evaluate('({top:document.querySelector("[data-list]").scrollTop,requests:window.requests,cards:document.querySelectorAll("article").length})');
 assert(scroll.top>0&&scroll.requests===0&&scroll.cards===20);
 const result={mode,cards:20,cpuThrottle:4,animations,settledDecorations,taskMs:Math.round((end.TaskDuration-start.TaskDuration)*1000),styleMs:Math.round((end.RecalcStyleDuration-start.RecalcStyleDuration)*1000),layoutMs:Math.round((end.LayoutDuration-start.LayoutDuration)*1000),screenshotMs,scroll,webkitTested:false};
 if(mode==='optimized'){assert.equal(animations.infinite,0,'Decorative list loops must be finite');assert.equal(settledDecorations,0,'Decorations must settle fully after entry');assert.equal(await evaluate('getComputedStyle(document.querySelector(".zipco-glass-btn")).backdropFilter'),'none');}
 fs.writeFileSync(path.join(directory,`${mode}.json`),JSON.stringify(result,null,2));textOutput(result);
 await send('Browser.close');
}finally{socket?.close();browser.kill();await new Promise(resolve=>server.close(resolve));}
function textOutput(result){console.log(JSON.stringify(result));}

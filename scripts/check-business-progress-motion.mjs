import fs from 'node:fs';
import {withBrowser} from './qa/browser.mjs';
const candidate=`.zipco-bp .zipco-bp-fold{transform:none;transition:grid-template-rows .42s cubic-bezier(.25,.8,.25,1),opacity .22s ease,visibility 0s}.zipco-bp .zipco-bp-fold[data-folded=true]{transform:none;transition-delay:0s,0s,.42s}.zipco-bp:has(.zipco-ec-tr.drag) *,.zipco-bp:has(.zipco-ec-tr.drag) *::before,.zipco-bp:has(.zipco-ec-tr.drag) *::after{animation-play-state:paused!important}.zipco-bp:has(.zipco-ec-tr.drag) .zipco-bp-cond{backdrop-filter:none;-webkit-backdrop-filter:none}.zipco-bp .zipco-ec-tr.drag .zipco-ec-hd,.zipco-bp .zipco-ec-tr.drag .zipco-ec-slf{transition:none;box-shadow:none}`;
const compare=process.argv.includes('--compare');
await withBrowser('business-progress-motion','coordination',async ctx=>{
 const {evaluate,wait,delay,send,assert}=ctx;const results=[];
 await send('Emulation.setCPUThrottlingRate',{rate:4});
 for(const mode of compare?['baseline','candidate']:['integrated']){
  await ctx.visit('business=1&progress-a=1&details=1&no-access=1',390,852);await wait('!!document.querySelector(".zipco-bp")');
  if(mode==='candidate')await evaluate(`(()=>{const s=document.createElement('style');s.textContent=${JSON.stringify(candidate)};document.head.append(s);})()`);
  await delay(250);
  for(const direction of ['open','close']){
   const result=await evaluate(`new Promise(resolve=>{const fold=document.querySelector('.zipco-bp-fold'),start=performance.now(),initial=fold.getBoundingClientRect().height,frames=[];let previous=start,first=null;document.querySelector('.zipco-bp-toggle').click();function frame(now){frames.push(now-previous);previous=now;if(first===null&&Math.abs(fold.getBoundingClientRect().height-initial)>1)first=now-start;if(now-start<520)requestAnimationFrame(frame);else{const sorted=frames.slice(2).sort((a,b)=>a-b);resolve({firstChangeMs:first,p95Ms:sorted[Math.floor(sorted.length*.95)],over34ms:frames.slice(2).filter(t=>t>34).length,frames:frames.length});}}requestAnimationFrame(frame);})`);
   results.push({mode,kind:direction,...result});
  }
  await ctx.tap('.zipco-bp-toggle');await delay(450);
  await evaluate('document.querySelector(".zipco-ec-hd").scrollIntoView({block:"center",behavior:"instant"})');await delay(100);
  const p=await evaluate('(()=>{const h=document.querySelector(".zipco-ec-hd"),r=h.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2,travel:h.parentElement.offsetWidth-56};})()');
  await evaluate('window.motionFrames=[];window.motionRunning=true;let previous=performance.now();requestAnimationFrame(function frame(now){window.motionFrames.push(now-previous);previous=now;if(window.motionRunning)requestAnimationFrame(frame)});');
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y}]});
  for(let i=1;i<=20;i++){await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x+p.travel*.65*i/20,y:p.y}]});await delay(16);}
  const drag=await evaluate('(()=>{const sorted=window.motionFrames.slice(2).sort((a,b)=>a-b),h=document.querySelector(".zipco-ec-hd"),s=getComputedStyle(h);return{p95Ms:sorted[Math.floor(sorted.length*.95)],over34ms:sorted.filter(t=>t>34).length,transition:s.transitionDuration,activeAnimations:document.querySelector(".zipco-bp").getAnimations({subtree:true}).filter(a=>a.playState==="running").length,progress:Number(document.querySelector(".zipco-ec-tr").style.getPropertyValue("--p"))};})()');
  await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await evaluate('window.motionRunning=false');await delay(500);
  assert.equal(await evaluate('window.posts.length'),0);assert(drag.progress>.6&&drag.progress<.7);assert.equal(drag.transition,'0s');
  results.push({mode,kind:'drag',...drag});
  if(mode==='integrated'){assert.equal(drag.activeAnimations,0);assert.equal(await evaluate('getComputedStyle(document.querySelector(".zipco-bp-fold")).transform'),'none');}
 }
 fs.writeFileSync(ctx.directory+'/measurements.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
});

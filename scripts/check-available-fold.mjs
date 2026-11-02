import {runSuite} from './qa/run-suite.mjs';
const catalog=[{case:'whatsapp',width:393},{case:'simple-free',width:393},{case:'simple-paid',width:393},{case:'simple-free',width:320},{case:'simple-paid',width:430}].map(v=>({...v,role:'customer',height:852}));
await runSuite('available-fold','acceptance',catalog,async(ctx,spec)=>{
 const {assert,evaluate,wait,tap}=ctx;
 await ctx.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 await ctx.visit('available-design=1'+(spec.case==='whatsapp'?'':'&pickup=1&reservation='+spec.case),spec.width,852);
 await wait('!!document.querySelector(".zipco-avwa-dis")');
 await evaluate(`(()=>{const button=document.querySelector('.zipco-avwa-dis'),detail=document.getElementById(button.getAttribute('aria-controls'));window.foldTimes=[];detail.addEventListener('transitionend',e=>{if(e.target===detail&&e.propertyName==='grid-template-rows')window.foldTimes.push(e.elapsedTime)});})()`);
 for(let i=0;i<2;i++){
  await tap('.zipco-avwa-dis');
  await wait('window.foldTimes.length>='+String(i+1));
  const sample=await evaluate(`(()=>{const button=document.querySelector('.zipco-avwa-dis'),detail=document.getElementById(button.getAttribute('aria-controls')),style=getComputedStyle(detail);return{open:button.getAttribute('aria-expanded'),inert:detail.inert,hidden:detail.getAttribute('aria-hidden'),visibility:style.visibility,delay:style.transitionDelay,seconds:window.foldTimes.at(-1)}})()`);
  assert.equal(sample.open,i===0?'true':'false');assert.equal(sample.inert,i!==0);assert.equal(sample.hidden,i===0?'false':'true');assert.equal(sample.visibility,i===0?'visible':'hidden');
  assert(Math.abs(sample.seconds-.28)<.02);if(i===0)assert(sample.delay.split(',').every(value=>parseFloat(value)===0));
 }
 await tap('.zipco-avwa-dis');await wait('window.foldTimes.length===3');
 assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
 if(spec.case==='simple-free'&&spec.width===393){
  await tap('.zipco-avwa-decisions .zipco-accept-btn');await wait('!!document.querySelector("[role=dialog]")');
  assert((await evaluate('document.querySelector("[role=dialog]").textContent')).includes('reservar'));
  await ctx.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape'});await ctx.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape'});await wait('!document.querySelector("[role=dialog]")');
  await ctx.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".zipco-avwa-fold")).transitionDuration'),'0s');
  await tap('.zipco-avwa-dis');assert.equal(await evaluate('document.querySelector(".zipco-avwa-dis").getAttribute("aria-expanded")'),'false');
 }
 assert.equal(await evaluate('window.flowCalls.filter(c=>c.method==="POST").length'),0);
 return {foldSeconds:await evaluate('window.foldTimes')};
},process.argv.slice(2));

import {runSuite} from './qa/run-suite.mjs';
const cases=[...[320,390,430].map(width=>({case:'controls',role:'business',width,height:852})),...['slide','recovery','blocked','reduced','legacy-ready','pickup'].map(name=>({case:name,role:'business',width:390,height:852}))];
await runSuite('business-progress-a','coordination',cases,async(ctx,spec)=>{
 const {assert,evaluate,tap,wait,delay,send}=ctx;
 await send('Emulation.setEmulatedMedia',{features:spec.case==='reduced'?[{name:'prefers-reduced-motion',value:'reduce'}]:[]});
 await ctx.visit('business=1&progress-a=1&details=1&no-access=1'+(spec.width===430?'&long=1':'')+(spec.case==='blocked'?'&no-ready=1':'')+(spec.case==='legacy-ready'?'&legacy-ready=1':'')+(spec.case==='pickup'?'&pickup-progress=1':''),spec.width,spec.height);
 if(['legacy-ready','pickup'].includes(spec.case)){
  assert.equal(await evaluate('!!document.querySelector(".zipco-bp")'),false);assert.equal(await evaluate('!!document.querySelector(".zipco-ec-dk")'),true);assert.equal(await evaluate('window.posts.length'),0);return;
 }
 await wait('!!document.querySelector(".zipco-bp")');
 assert.equal(await evaluate('document.querySelector(".zipco-bp-fold").inert'),true);
 const gap=await evaluate('(()=>{const r=document.querySelector(".zipco-bp").getBoundingClientRect(),n=document.querySelector(".zipco-bp-next").getBoundingClientRect();return r.bottom-n.bottom})()');assert(gap>=10,'Collapsed margin missing: '+gap);
 await ctx.screenshot('closed-'+spec.case+'-'+spec.width);
 const closeDialog=async()=>{await evaluate('[...document.querySelectorAll("[role=dialog] button")].find(b=>b.textContent.includes("Cerrar")||b.getAttribute("aria-label")==="Cerrar detalle"||b.textContent==="Volver").dataset.bpClose="true"');await tap('[data-bp-close]');await wait('!document.querySelector("[role=dialog]")');};
 await tap('.zipco-bp-next');await delay(spec.case==='reduced'?50:450);
 assert.equal(await evaluate('document.querySelector(".zipco-bp-fold").inert'),false);
 assert.equal(await evaluate('document.querySelector(".zipco-bp-next").getBoundingClientRect().height'),0,'Closed invitation must not leave blank space when open');
 if(spec.case==='controls'){
  await tap('.zipco-bp .zipco-product-thumb');await wait('!!document.querySelector(".zipco-product-sheet")');await tap('.zipco-product-close');
  assert.equal(await evaluate('document.querySelector(".zipco-bp-toggle").getAttribute("aria-expanded")'),'true');
  await tap('.zipco-bp-cond');await wait('!!document.querySelector("[role=dialog]")');await closeDialog();
  await evaluate('[...document.querySelectorAll(".zipco-bp button")].find(b=>b.textContent.includes("Retirar mi permiso")).dataset.bpRevoke="true"');await tap('[data-bp-revoke]');await wait('!!document.querySelector("[role=dialog]")');await closeDialog();
  assert.equal(await evaluate('document.querySelector(".zipco-bp").scrollTop'),0);
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  const fits=await evaluate('(()=>{const root=document.querySelector(".zipco-bp").getBoundingClientRect();return [...document.querySelectorAll(".zipco-bp-lbl span")].every(el=>{const range=document.createRange();range.selectNodeContents(el);const r=range.getBoundingClientRect();return r.left>=root.left&&r.right<=root.right;});})()');assert(fits);
  await ctx.screenshot('open-'+spec.width);await tap('.zipco-bp-hide');await delay(450);
  assert.equal(await evaluate('document.querySelector(".zipco-bp-fold").inert'),true);
  assert.equal(await evaluate('document.activeElement===document.querySelector(".zipco-bp-next")'),true);
  await tap('#home-test');assert.equal(await evaluate('window.posts.length'),0);return;
 }
 if(spec.case==='blocked'){
  assert.equal(await evaluate('document.querySelector(".zipco-bp .zipco-ec-hd").disabled'),true);
  assert.equal(await evaluate('window.posts.length'),0);return;
 }
 const drag=async fraction=>{
  await evaluate('document.querySelector(".zipco-bp .zipco-ec-hd").scrollIntoView({block:"center",behavior:"instant"})');await delay(100);
  const point=await evaluate('(()=>{const h=document.querySelector(".zipco-bp .zipco-ec-hd"),r=h.getBoundingClientRect(),track=h.parentElement.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,travel:track.width-56,hit:h.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))};})()');assert(point.hit);
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point.x,y:point.y}]});
  for(const part of [.2,.5,1])await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x+point.travel*fraction*part,y:point.y}]});
  await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(60);
 };
 if(spec.case==='slide'){
  await tap('.zipco-bp .zipco-ec-hd');assert.equal(await evaluate('window.posts.length'),0);
  await drag(.4);assert.equal(await evaluate('window.posts.length'),0);await delay(500);
 }
 if(spec.case==='recovery')await evaluate('window.lost=true');else await evaluate('window.delayPost=true');
 await drag(.96);await wait('window.posts.length===1');
 if(spec.case==='recovery'){
  await wait('document.querySelector(".zipco-bp").dataset.bpRecovery==="true"');
  assert.equal(await evaluate('!!document.querySelector(".zipco-bp .zipco-ec-sent>svg")'),false);
  await tap('.zipco-bp-hide');await delay(450);assert.equal(await evaluate('document.querySelector(".zipco-bp-next").textContent.includes("Operación por resolver")'),true);
  await delay(500);assert.equal(await evaluate('window.posts.length'),1);return;
 }
 assert.equal(await evaluate('document.querySelector(".zipco-bp .zipco-ec-hd").disabled'),true);
 assert.equal(await evaluate('!!document.querySelector(".zipco-bp .zipco-ec-sent>svg")'),false);
 await evaluate('window.delayPost=false;window.releasePost()');await wait('!!document.querySelector(".zipco-bp .zipco-ec-sent>svg")');
 await delay(spec.case==='reduced'?50:620);
 assert(Number(await evaluate('getComputedStyle(document.querySelector(".zipco-bp .zipco-ec-hd"),"::after").opacity'))>.98,'Bell must appear before the hologram');
 if(spec.case==='reduced')assert.equal(await evaluate('getComputedStyle(document.querySelector(".zipco-bp .zipco-ec-hd"),"::after").animationName'),'none');
 await ctx.screenshot('sent-'+spec.case);await wait('window.counts.ready===1');await evaluate('window.chooseView("ready")');
 await wait('!!document.querySelector(".zipco-ec-dk")');assert.equal(await evaluate('!!document.querySelector(".zipco-bp")'),false);
 assert.equal(await evaluate('window.posts.length'),1);assert.equal(await evaluate('window.posts[0].url.endsWith("/mark-ready")'),true);
},process.argv.slice(2));

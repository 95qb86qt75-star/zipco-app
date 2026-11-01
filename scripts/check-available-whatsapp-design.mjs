import {runSuite} from './qa/run-suite.mjs';
const catalog=[...[320,393,430].map(width=>({case:'layout',role:'customer',width,height:852})),...['decline','recovery','motion','pickup','reference'].map(name=>({case:name,role:'customer',width:393,height:852}))];
await runSuite('available-whatsapp-design','acceptance',catalog,async(ctx,spec)=>{
 const {assert,evaluate,wait,tap}=ctx;
 await ctx.visit('available-design=1'+(spec.case==='pickup'?'&pickup=1':spec.case==='reference'?'&reference-photo=1':''),spec.width,852);
 await wait('!!document.querySelector(".zipco-av-available")');
 if(spec.case==='pickup'){
  assert.equal(await evaluate('!!document.querySelector(".zipco-av-available-pk")'),true);
  await tap('.zipco-av-disclosure');await wait('document.querySelector(".zipco-av-disclosure").getAttribute("aria-expanded")==="true"');
  await tap('.zipco-av-decline');await wait('!!document.querySelector("[role=alertdialog]")');
  assert.equal(await evaluate('document.querySelector("[role=alertdialog]").classList.contains("zipco-av-alert-decline")'),false);
  return;
 }
 const card='.zipco-av-available-wa';
 assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
 assert.equal(await evaluate('document.querySelector(".zipco-avwa-detail").closest("[inert]")!==null'),true);
 await tap('.zipco-avwa-dis');await ctx.delay(700);
 assert.equal(await evaluate('document.querySelector(".zipco-avwa-dis").getAttribute("aria-expanded")'),'true');
 assert.equal(await evaluate('!!document.querySelector(".zipco-avwa-detail").closest("[inert]")'),false);
 if(spec.case==='layout'){
  await tap('.zipco-product-thumb');await wait('!!document.querySelector(".zipco-product-sheet")');
  assert((await evaluate('document.querySelector(".zipco-product-sheet").textContent')).includes('Precio unitario'));
  await tap('.zipco-product-done');await wait('!document.querySelector(".zipco-product-sheet")');
  const before=await evaluate('window.flowCalls.filter(c=>c.method==="POST").length');
  await tap('[role=switch]');assert.equal(await evaluate('document.querySelector("[role=switch]").getAttribute("aria-checked")'),'false');
  assert.equal(await evaluate('document.querySelector(".zipco-avwa-state").textContent'),'No permitido');
  assert.equal(await evaluate('window.flowCalls.filter(c=>c.method==="POST").length'),before);
  await ctx.screenshot('expanded-'+spec.width);
  await tap('.zipco-avwa-dis');
  assert.equal(await evaluate('document.querySelector(".zipco-avwa-detail").closest("[inert]")!==null'),true);
  await ctx.delay(700);assert.equal(await evaluate('document.querySelector(".zipco-avwa-detail").getBoundingClientRect().height>0'),true);
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".zipco-avwa-detail")).visibility'),'hidden');
 }
 if(spec.case==='decline'){
  await tap('.zipco-av-decline');await wait('!!document.querySelector(".zipco-av-alert-decline")');
  assert((await evaluate('document.querySelector("[role=alertdialog]").textContent')).includes('¿Cerrar esta solicitud?'));
  await tap('[role=alertdialog] .zipco-av-primary');await wait('!document.querySelector("[role=alertdialog]")');
  assert.equal(await evaluate('window.flowCalls.filter(c=>c.method==="POST").length'),0);
  await tap('.zipco-av-decline');await tap('[role=alertdialog] .zipco-av-secondary');
  await wait('!!document.querySelector(".zipco-toast-action")');
  assert.equal(await evaluate('window.flowCalls.filter(c=>c.method==="POST"&&c.url.endsWith("/decline-request")).length'),1);
  await tap('.zipco-toast-action');await wait('window.currentView==="history"');
 }
 if(spec.case==='recovery'){
  await evaluate('(()=>{const real=window.fetch;window.fetch=async(url,init)=>String(url).endsWith("/continue-request")?new Response(JSON.stringify({code:"TEST_FAILURE",message:"No se pudo confirmar"}),{status:400}):real(url,init);})()');
  await tap('.zipco-avwa-decisions .zipco-accept-btn');await wait('!!document.querySelector(".zipco-avwa-recovery")');
  await tap('.zipco-avwa-dis');await ctx.delay(700);
  assert.equal(await evaluate('!!document.querySelector(".zipco-avwa-recovery").closest("[inert]")'),false);
  const before=await evaluate('window.flowCalls.filter(c=>c.method==="POST").length');await tap('.zipco-avwa-recovery');await ctx.delay(200);
  assert.equal(await evaluate('window.flowCalls.filter(c=>c.method==="POST").length'),before);
 }
 if(spec.case==='motion'){
  await tap('.zipco-avwa-dis');await ctx.delay(700);
  await evaluate('document.querySelector(".zipco-av-available-wa").parentElement.setAttribute("data-request-list-scrolling","true")');
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".zipco-avwa-pill"),"::after").animationPlayState'),'paused');
  await ctx.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".zipco-avwa-pill")).animationName'),'none');
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".zipco-avwa-fold")).transitionDuration'),'0s');
 }
 if(spec.case==='reference'){
  await tap('.zipco-avwa-extra button');await wait('!!document.querySelector("[role=dialog]")');
  await wait('document.querySelector("[role=dialog] img")?.naturalWidth===192');
  await ctx.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape'});await ctx.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape'});
  await wait('!document.querySelector("[role=dialog]")');
  assert.equal(await evaluate('document.querySelector(".zipco-avwa-dis").getAttribute("aria-expanded")'),'true');
 }
 assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
},process.argv.slice(2));

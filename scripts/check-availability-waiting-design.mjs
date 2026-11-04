import {runSuite} from './qa/run-suite.mjs';
const catalog=[...['whatsapp','pickup'].flatMap(name=>[320,390,430].map(width=>({case:name,role:'business',width,height:852}))),...['recovery','motion'].map(name=>({case:name,role:'business',width:390,height:852}))];
await runSuite('availability-waiting-design','acceptance',catalog,async(ctx,spec)=>{
 const {assert,evaluate,wait,tap}=ctx;
 await ctx.visit('available-design=1&reference-photo=1'+(spec.case==='pickup'?'&pickup=1':''),spec.width,852);
 await evaluate('window.switchRole("business")');
 await wait('!!document.querySelector(".zipco-aw")');
 const expanded=()=>evaluate('document.querySelector(".zipco-aw").dataset.expanded');
 assert.equal(await expanded(),'false');
 assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
 assert.equal(await evaluate('!!document.querySelector(".zipco-aw-dt").closest("[inert]")'),true);
 await tap('.zipco-aw-th .zipco-product-thumb');
 await wait('!!document.querySelector(".zipco-product-sheet")');
 assert((await evaluate('document.querySelector(".zipco-product-sheet").textContent')).includes('Precio unitario'));
 await tap('.zipco-product-done');await wait('!document.querySelector(".zipco-product-sheet")');
 assert.equal(await expanded(),'false');
 await tap('.zipco-avw-toggle');await ctx.delay(500);
 assert.equal(await expanded(),'true');
 assert.equal(await evaluate('!!document.querySelector(".zipco-aw-dt").closest("[inert]")'),false);
 const text=await evaluate('document.querySelector(".zipco-aw-dt").textContent');
 assert(text.includes('Pedido para'));
 assert.equal(text.includes('Horario o dirección de retiro'),spec.case==='pickup');
 await tap('.zipco-aw-ref>button');await wait('!!document.querySelector(\'[aria-label="Cerrar imagen"]\')');
 await tap('[aria-label="Cerrar imagen"]');await ctx.delay(350);
 assert.equal(await expanded(),'true');
 if(spec.case==='recovery'){
  await evaluate('(()=>{const original=window.fetch;window.fetch=async(url,init)=>String(url).endsWith("/withdraw-availability")?new Response(JSON.stringify({code:"TEST_FAILURE",message:"No se pudo retirar"}),{status:400}):original(url,init);})()');
 }
 await tap('.zipco-aw-wd');await wait('!!document.querySelector("[role=alertdialog]")');
 assert((await evaluate('document.querySelector("[role=alertdialog]").textContent')).includes('Retirar la disponibilidad'));
 assert.equal(await evaluate('window.flowCalls.filter(c=>c.method==="POST").length'),0);
 if(spec.case==='recovery'){
  await tap('[role=alertdialog] .zipco-av-secondary');
  await wait('!!document.querySelector(".zipco-aw-err .zipco-av-error")');
  if(await evaluate('!!document.querySelector("[role=alertdialog]")'))await tap('[role=alertdialog] .zipco-av-primary');
 }else await tap('[role=alertdialog] .zipco-av-primary');
 await wait('!document.querySelector("[role=alertdialog]")');
 await tap('.zipco-aw-hide');await ctx.delay(500);
 assert.equal(await expanded(),'false');
 assert.equal(await evaluate('document.activeElement.classList.contains("zipco-avw-toggle")'),true);
 assert.equal(await evaluate('document.querySelector(".zipco-aw").scrollTop'),0);
 if(spec.case==='recovery'){
  assert.equal(await evaluate('!!document.querySelector(".zipco-aw-err").closest("[inert]")'),false);
  await tap('.zipco-aw-err button');await ctx.delay(200);
  assert.equal(await evaluate('window.flowCalls.filter(c=>c.method==="POST").length'),0);
 }
 if(spec.case==='motion'){
  await ctx.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".zipco-aw-pill i")).animationName'),'none');
  await ctx.send('Emulation.setEmulatedMedia',{features:[]});
  await tap('.zipco-avw-toggle');await ctx.delay(500);
  await evaluate('document.querySelector("[data-requests-scroll]").setAttribute("data-request-list-scrolling","true")');
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".zipco-aw-pill i")).animationPlayState'),'paused');
 }
 await ctx.screenshot(spec.case+'-'+spec.width);
},process.argv.slice(2));

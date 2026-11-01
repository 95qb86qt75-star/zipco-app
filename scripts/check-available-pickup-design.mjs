import {runSuite} from './qa/run-suite.mjs';
const variants=['none','no-offer','simple-free','simple-paid','simple-advisory-free','simple-advisory-paid','legacy-free','legacy-paid','no-contact'];
const catalog=[...variants.map(name=>({case:name,role:'customer',width:393,height:852})),...[320,430].map(width=>({case:'none',role:'customer',width,height:852})),{case:'recovery',role:'customer',width:393,height:852},{case:'exit',role:'customer',width:393,height:852}];
await runSuite('available-pickup-design','acceptance',catalog,async(ctx,spec)=>{
 const {assert,evaluate,wait,tap}=ctx;
 const variant=['no-contact','no-message','recovery'].includes(spec.case)?'none':spec.case;
 const query='available-design=1&pickup=1'+(!['no-offer','exit'].includes(variant)?'&reservation='+variant:'')+(spec.case==='no-contact'?'&no-contact=1':'')+(spec.case==='no-message'?'&no-message=1':'');
 await ctx.visit(query,spec.width,852);await wait('!!document.querySelector(".zipco-av-available-pk")');
 const text=await evaluate('document.querySelector(".zipco-av-available-pk").textContent');assert(text.includes('RETIRO'));
 assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
 const simple=variant.startsWith('simple'),paid=variant.endsWith('paid'),legacy=variant.startsWith('legacy');
 if(simple){assert(text.includes('Puedes reservar este producto'));assert(text.includes(paid?'PAGO PREVIO':'RESERVA GRATIS'));}
 await tap('.zipco-avwa-dis');await ctx.delay(700);
 assert.equal(await evaluate('!!document.querySelector(".zipco-avwa-detail").closest("[inert]")'),false);
 if(simple||legacy)assert.equal(await evaluate('document.querySelectorAll(".zipco-avpk-det section, .zipco-avpk-offer section").length'),1);
 assert.equal(await evaluate('document.querySelector(".zipco-av-available-pk").scrollWidth>document.querySelector(".zipco-av-available-pk").clientWidth+1'),false);
 if(simple){
  assert.equal(await evaluate('!!document.querySelector(".zipco-av-available-pk [role=switch]")'),false);
  if(variant.includes('advisory'))assert.equal(await evaluate('document.querySelector(".zipco-av-available-pk").textContent.includes("El horario de atención es informativo")'),false);
  await tap('.zipco-avwa-decisions .zipco-accept-btn');await wait('!!document.querySelector("[role=dialog]")');
  await wait('[...document.querySelectorAll("[role=dialog] button")].some(b=>b.textContent.startsWith("Reservar")&&!b.disabled)');
  assert.equal(await evaluate('window.flowCalls.some(c=>c.url.includes("/reservation-options"))'),true);
  if(variant.includes('advisory'))assert((await evaluate('document.querySelector("[role=dialog]").textContent')).includes('no tiene vencimiento automático'));
  if(paid){
   await tap('[role=dialog] input[type=checkbox]');
   assert.equal(await evaluate('[...document.querySelectorAll("[role=dialog] button")].find(b=>b.textContent.startsWith("Reservar")).disabled'),true);
  }
  await ctx.screenshot(spec.case+'-dialog');
  assert.equal(await evaluate('window.flowCalls.filter(c=>c.method==="POST").length'),0);return;
 }
 if(legacy){
  await tap('.zipco-avpk-nt');await wait('!!document.querySelector(".zipco-avpk-field textarea")');
  await evaluate('(()=>{const input=document.querySelector(".zipco-avpk-field textarea");Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set.call(input,"x".repeat(310));input.dispatchEvent(new Event("input",{bubbles:true}));})()');
  assert.equal(await evaluate('document.querySelector(".zipco-avpk-field textarea").value.length'),300);
  await tap('.zipco-avpk-nt');await tap('.zipco-avpk-nt');assert.equal(await evaluate('document.querySelector(".zipco-avpk-field textarea").value.length'),300);
  await evaluate('(()=>{const real=window.fetch;window.fetch=async(url,init)=>{if(String(url).endsWith("/continue-request")){window.capturedBody=JSON.parse(init.body);return new Response(JSON.stringify({message:"Synthetic rejection"}),{status:400});}return real(url,init);};})()');
  await tap('.zipco-avpk-res .zipco-accept-btn');await wait('!!window.capturedBody');
  assert.equal(await evaluate('window.capturedBody.reservationChoice.choice'),'REQUEST_RESERVATION');
  assert.equal(await evaluate('window.capturedBody.reservationChoice.note.length'),300);return;
 }
 if(spec.case==='no-contact')assert.equal(await evaluate('!!document.querySelector("[role=switch]")'),false);
 if(spec.case==='no-message')assert((await evaluate('document.querySelector(".zipco-avpk-msg").textContent')).includes('Acércate al local'));
 if(spec.case==='recovery'){
  await evaluate('(()=>{const real=window.fetch;window.fetch=async(url,init)=>String(url).endsWith("/reservation-options?processContract=availability-v3")?real(url,init):String(url).endsWith("/continue-request")?new Response(JSON.stringify({message:"Synthetic rejection"}),{status:400}):real(url,init);})()');
  await tap('.zipco-avwa-decisions .zipco-accept-btn');await wait('!!document.querySelector("[role=dialog]")');
  await wait('[...document.querySelectorAll("[role=dialog] button")].some(b=>b.textContent==="Confirmar que iré"&&!b.disabled)');
  await evaluate('(()=>{const b=[...document.querySelectorAll("[role=dialog] button")].find(b=>b.textContent==="Confirmar que iré");b.id="confirm-without"})()');await tap('#confirm-without');
  await wait('!!document.querySelector(".zipco-avwa-recovery")');
  await ctx.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape'});await ctx.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape'});await wait('!document.querySelector("[role=dialog]")');
  await tap('.zipco-avwa-dis');await ctx.delay(700);assert.equal(await evaluate('!!document.querySelector(".zipco-avwa-recovery").closest("[inert]")'),false);return;
 }
 if(spec.case==='exit'){
  await tap('.zipco-avwa-decisions .zipco-accept-btn');await wait('!!document.querySelector(".zipco-ah")');
  await wait('document.querySelector(".zipco-status-flow")?.dataset.designExit==="true"');
  assert.equal(await evaluate('document.querySelector(".zipco-av-available-pk").dataset.leaving'),'true');
  assert.equal(await evaluate('document.querySelector(".zipco-av-available-pk").inert'),true);
  await wait('!!document.querySelector(".zipco-toast-action")');await tap('.zipco-toast-action');await wait('window.currentView==="active"');return;
 }
 await ctx.screenshot(spec.case+'-'+spec.width);
 await tap('.zipco-avwa-dis');assert.equal(await evaluate('!!document.querySelector(".zipco-avwa-detail").closest("[inert]")'),true);
 assert.equal(await evaluate('window.flowCalls.filter(c=>c.method==="POST").length'),0);
},process.argv.slice(2));

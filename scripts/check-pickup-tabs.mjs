import {runSuite} from './qa/run-suite.mjs';

const cases=[
 ...[320,393,430].map(width=>({case:'layout',role:'customer',width,height:852})),
 ...['free','paid','advisory','permissions','dialogs','reservation-error','motion'].map(name=>({case:name,role:'customer',width:393,height:852})),
];
await runSuite('pickup-tabs','coordination',cases,async(ctx,spec)=>{
 const {assert,evaluate,wait,tap}=ctx;
 const reservation=['free','paid','advisory','reservation-error'].includes(spec.case)?'&reservation='+(spec.case==='reservation-error'?'free':spec.case):'';
 await ctx.visit('pickup=1&pickup-progress=1&pickup-design=1&no-access=1'+reservation+(spec.case==='permissions'?'&no-open=1&no-options=1':''),spec.width,spec.height);
 await tap('.zipco-pickup-c-head');await ctx.delay(650);
 assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".zipco-own-step")).flexDirection'),'column');
 assert.equal(await evaluate('document.querySelectorAll(".zipco-receipt-details").length'),1);
 if(spec.case==='permissions'){
  assert.equal(await evaluate('document.querySelectorAll("[role=tablist]").length'),0);
  assert.equal(await evaluate('!!document.querySelector(".zipco-pickup-wa,.zipco-pickup-cancel,.zipco-pickup-revoke")'),false);
  return;
 }
 await wait('document.querySelectorAll("[role=tab]").length===2');
 const first='.zipco-pickup-tabs button:first-child',second='.zipco-pickup-tabs button:last-child';
 const instructions=await evaluate('document.querySelector(".zipco-pickup-panel").textContent');
 assert(instructions.includes('Retiro en el local')&&instructions.includes('Condiciones aceptadas'));
 assert(instructions.indexOf('Retiro en el local')<instructions.indexOf('Condiciones aceptadas'));
 if(reservation){
  assert.equal(await evaluate('document.querySelectorAll("[data-reservation-panel]").length'),1);
  assert(!instructions.includes('No es una reserva ni un pago verificado.'));
  assert(instructions.includes(spec.case==='paid'?'Reserva con pago previo':'Reserva sin pago previo'));
  if(spec.case==='advisory')assert(instructions.includes('no tiene vencimiento automático'));
 }
 if(spec.case==='layout'){
  await tap('.zipco-co-strip2');await wait('!!document.querySelector("[role=dialog]")');
  await evaluate('(()=>{const button=[...document.querySelectorAll("[role=dialog] button")].find(e=>e.textContent.includes("Cerrar"));button.id="close-conditions";})()');
  await tap('#close-conditions');await wait('!document.querySelector("[role=dialog]")');
  await evaluate('document.querySelector(".zipco-pickup-tabs button:first-child").focus()');
  for(const key of ['ArrowLeft','ArrowRight','End','Home']){
   await ctx.send('Input.dispatchKeyEvent',{type:'keyDown',key});await ctx.send('Input.dispatchKeyEvent',{type:'keyUp',key});
   assert.equal(await evaluate('document.activeElement.getAttribute("aria-selected")'),'true');
   assert.equal(await evaluate('document.activeElement.textContent'),['ArrowLeft','End'].includes(key)?'Contacto y opciones':'Cómo retirar');
  }
 }
 await tap(second);
 assert.equal(await evaluate('document.querySelector(".zipco-pickup-panel").hidden'),true);
 const panelIdentity=await evaluate('(()=>{window.originalPickupPanel=document.querySelector(".zipco-pickup-panel");return !!window.originalPickupPanel})()');assert(panelIdentity);
 if(spec.case==='paid')assert.equal(await evaluate('!!document.querySelector(".zipco-pickup-consent,.zipco-pickup-revoke")'),false);
 if(spec.case==='dialogs'){
  await tap('.zipco-pickup-cancel');await wait('!!document.querySelector("[role=dialog] textarea")');
  await evaluate('(()=>{const input=document.querySelector("[role=dialog] textarea");Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set.call(input,"Motivo conservado");input.dispatchEvent(new Event("input",{bubbles:true}));})()');
  await evaluate('window.refreshOrders()');await ctx.delay(150);
  assert.equal(await evaluate('document.querySelector("[role=dialog] textarea").value'),'Motivo conservado');
  assert.equal(await evaluate('!!document.querySelector("[role=dialog]").closest("[role=tabpanel]")'),false);
  await evaluate('(()=>{const button=[...document.querySelectorAll("[role=dialog] button")].find(e=>e.textContent==="Volver");button.id="close-cancel";})()');await tap('#close-cancel');
  await wait('!document.querySelector("[role=dialog]")');await tap(first);await tap(second);await tap('.zipco-pickup-cancel');
  await wait('!!document.querySelector("[role=dialog] textarea")');assert.equal(await evaluate('document.querySelector("[role=dialog] textarea").value'),'Motivo conservado');
  await evaluate('(()=>{const button=[...document.querySelectorAll("[role=dialog] button")].find(e=>e.textContent==="Volver");button.id="close-cancel";})()');await tap('#close-cancel');
 }
 if(spec.case==='reservation-error'){
  await evaluate('window.triggerReservationReadError()');
  await wait('!!document.querySelector("[data-reservation-panel] [role=alert]")');
  await wait('document.querySelector(".zipco-pickup-tabs button:first-child").getAttribute("aria-selected")==="true"');
  assert.equal(await evaluate('getComputedStyle(document.querySelector("[data-reservation-panel] [role=alert] p")).color'),'rgb(159, 18, 57)');
  await evaluate('window.readFailed=false');await tap('[data-reservation-panel] [role=alert] button');
  await wait('!document.querySelector("[data-reservation-panel] [role=alert]")');
 }
 if(spec.case==='motion'){
  await evaluate('document.querySelector(".zipco-pickup-c").parentElement.setAttribute("data-request-list-scrolling","true")');
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".zipco-own-node[data-kind=wait]"),"::before").animationPlayState'),'paused');
  await ctx.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".zipco-own-node[data-kind=wait]"),"::before").animationName'),'none');
 }
 if(spec.case!=='reservation-error'){
  await tap('.zipco-pickup-c-head');await tap('.zipco-pickup-c-head');await ctx.delay(650);
  assert.equal(await evaluate('document.querySelector(".zipco-pickup-tabs button:last-child").getAttribute("aria-selected")'),'true');
 }
 assert.equal(await evaluate('document.querySelector(".zipco-pickup-panel")===window.originalPickupPanel'),true);
 assert.equal(await evaluate('window.posts.length'),0);
 await ctx.screenshot(spec.case+'-'+spec.width);
},process.argv.slice(2));

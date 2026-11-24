import {runSuite} from './qa/run-suite.mjs';
const cases=[{case:'flow',role:'business',width:390,height:852},{case:'active',role:'customer',width:320,height:852},{case:'uncertain',role:'customer',width:390,height:852},{case:'committed',role:'customer',width:430,height:852}];
await runSuite('local-pickup-information','acceptance',cases,async(c,s)=>{
 const {assert,evaluate,wait,tap}=c;
 const label=async text=>{await evaluate('document.querySelectorAll("[data-test-tap]").forEach(e=>e.removeAttribute("data-test-tap"))');await evaluate('(()=>{const scope=[...document.querySelectorAll("[role=dialog]")].at(-1)??document;const b=[...scope.querySelectorAll("button")].find(e=>(e.querySelector(".zipco-accept-label")?.textContent??e.textContent).trim()==='+JSON.stringify(text)+');if(!b)throw Error("Missing button '+text+'");b.setAttribute("data-test-tap","true");})()');await tap('[data-test-tap]');};
 await c.visit('available-design=1&information='+(s.case==='flow'?'initial':'active'),s.width,852);
 if(s.case==='flow'){
  await evaluate('window.switchRole("business")');
  await wait('!!document.querySelector(".zipco-av-business")');await tap('.zipco-av-disclosure');
  await tap('.zipco-av-business-actions .zipco-accept-btn');await wait('!!document.querySelector(".zipco-av-channel-pickup")');await tap('.zipco-av-channel-pickup');
  await tap('[role=dialog] .zipco-av-input-icon input');await c.send('Input.insertText',{text:'Hasta las 19:00'});
  await wait('document.querySelector("[role=dialog] .zipco-av-primary")?.disabled===false');await tap('[role=dialog] .zipco-av-primary');
  await wait('!!document.querySelector(".zipco-toast-action")');assert.equal(await evaluate('window.liveCounts.history'),1);assert.equal(await evaluate('window.liveCounts.waiting'),0);
  await tap('.zipco-toast-action');await wait('window.currentView==="history"');
  assert((await evaluate('document.querySelector(".zipco-information-card").textContent')).includes('Disponibilidad informada'));
  assert.equal(await evaluate('!!document.querySelector(".zipco-ec-slider")'),false);
  await evaluate('window.switchRole("customer")');await wait('!!document.querySelector(".zipco-av-available-pk")');
  await label('Sí, continuar con la compra');await wait('!!document.querySelector(".zipco-action-dialog")');await wait('[...document.querySelectorAll(".zipco-action-dialog button")].some(b=>b.textContent==="Confirmar que iré"&&!b.disabled)');await label('Confirmar que iré');
  await wait('!!document.querySelector(".zipco-toast-action")');await tap('.zipco-toast-action');await wait('window.currentView==="active"');
 }else await evaluate('window.switchRole("customer")');
 await wait('!!document.querySelector(".zipco-information-primary")');
 assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
 await tap('.zipco-information-toggle');await c.delay(450);
 assert((await evaluate('document.querySelector(".zipco-information-detail").textContent')).includes('Hasta las 19:00'));
 assert.equal(await evaluate('!!document.querySelector(".zipco-ec-slider")'),false);
 if(['uncertain','committed'].includes(s.case)){
  await evaluate('(()=>{const original=window.fetch;window.ackAttempts=[];window.fetch=async(url,init)=>{if(!String(url).endsWith("/ack-local-pickup-information"))return original(url,init);window.ackAttempts.push({key:init.headers["Idempotency-Key"],body:init.body});if(window.ackAttempts.length===1){'+(s.case==='committed'?'await original(url,init);':'')+'throw new TypeError("network");}return original(url,init);};})()');
 }
 await tap('.zipco-information-primary');
 if(['uncertain','committed'].includes(s.case)){
  await wait('!!document.querySelector(".zipco-information-recovery")');
  assert.equal(await evaluate('window.ackAttempts.length'),1);await c.delay(250);assert.equal(await evaluate('window.ackAttempts.length'),1);
  await label('Actualizar estado');await c.delay(400);
  if(s.case==='uncertain'){
   assert.equal(await evaluate('window.ackAttempts.length'),1);await label('Reintentar operación pendiente');
   await wait('!!document.querySelector(".zipco-toast-action")');
   assert.equal(await evaluate('window.ackAttempts.length'),2);assert.equal(await evaluate('window.ackAttempts[0].key===window.ackAttempts[1].key&&window.ackAttempts[0].body===window.ackAttempts[1].body'),true);
  }else{
   assert.equal(await evaluate('window.ackAttempts.length'),1);await evaluate('window.switchRole("customer")');
  }
 }
 if(s.case!=='committed'){await wait('!!document.querySelector(".zipco-toast-action")');await tap('.zipco-toast-action');}
 await wait('window.currentView==="history"');await wait('!!document.querySelector(".zipco-information-card")');
 assert((await evaluate('document.querySelector(".zipco-information-card").textContent')).includes('Indicaciones recibidas'));
 assert.equal(await evaluate('!!document.querySelector(".zipco-information-primary")'),false);
 assert.equal(await evaluate('window.liveCounts.history'),1);assert.equal(await evaluate('window.liveCounts.active'),0);
 await tap('.zipco-information-toggle');await c.delay(450);assert((await evaluate('document.querySelector(".zipco-information-detail").textContent')).includes('Hasta las 19:00'));
 await c.screenshot(s.case);
 return {counts:await evaluate('window.liveCounts'),posts:await evaluate('window.flowCalls.filter(c=>c.method==="POST").map(c=>c.url.split("/").at(-1))')};
},process.argv.slice(2));

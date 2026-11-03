import {withBrowser} from './qa/browser.mjs';
const transitionOnly=process.argv.includes('--preparing-transition-only');
const preparingOnly=process.argv.includes('--preparing-only')||transitionOnly;
await withBrowser(preparingOnly?'whatsapp-preparing-design':'whatsapp-waiting-design','coordination',async ctx=>{
 const {assert,evaluate,wait,tap,delay,send}=ctx;
 const visit=async(width=390,extra='')=>{await send('Emulation.setEmulatedMedia',{features:[]});await ctx.visit('own-pending=1&waiting-design=1&details=1&no-access=1&navigate=1'+extra,width,852);await wait('!!document.querySelector(".zipco-wa-w")');if(preparingOnly){assert.equal(await evaluate('document.querySelector(".zipco-wa-w-pill b").textContent'),'ESPERANDO AL NEGOCIO');await evaluate('window.makePreparing()');await wait('document.querySelector(".zipco-wa-w-pill b")?.textContent==="PREPARANDO TU PEDIDO"');}};
 const closeDialog=async()=>{await evaluate('[...document.querySelectorAll("[role=dialog] button")].find(button=>button.textContent.includes("Cerrar")||button.textContent==="Volver"||button.getAttribute("aria-label")==="Cerrar").dataset.testClose="true"');await tap('[data-test-close]');await wait('!document.querySelector("[role=dialog]")');};
 if(!process.argv.includes('--recovery-only')){
 if(!transitionOnly)for(const width of [320,390,430]){
  await visit(width,width===320?'&long=1':'');await ctx.screenshot('closed-'+width);
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  await tap('.zipco-wa-w-h h3');await delay(450);
  assert.equal(await evaluate('document.querySelector(".zipco-wa-w-toggle").getAttribute("aria-expanded")'),'true');
  assert.equal(await evaluate('document.querySelector(".zipco-wa-w-body").closest("[inert]")'),null);
  await tap('.zipco-wa-w-tile');await wait('!!document.querySelector("[role=dialog]")');await closeDialog();
  await tap('.zipco-wa-w-hide');assert.equal(await evaluate('document.activeElement===document.querySelector(".zipco-wa-w-toggle")'),true);
  await tap('.zipco-wa-w .zipco-product-thumb');await wait('!!document.querySelector(".zipco-product-sheet")');
  assert.equal(await evaluate('document.querySelector(".zipco-wa-w-toggle").getAttribute("aria-expanded")'),'false');await tap('.zipco-product-close');
  await tap('.zipco-wa-w .zipco-own-rail');await delay(450);await ctx.screenshot('open-'+width);
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  await evaluate('[...document.querySelectorAll(".zipco-wa-w button")].find(button=>button.textContent.includes("Retirar mi permiso")).dataset.revoke="true"');
  await tap('[data-revoke]');await wait('!!document.querySelector("[role=dialog]")');await closeDialog();
  await tap('.zipco-wa-w-toggle');await delay(450);
  assert.equal(await evaluate('!!document.querySelector(".zipco-wa-w-body").closest("[inert]")'),true);
  assert.equal(await evaluate('window.posts.length'),0);
  await tap('#home-test');assert.equal(await evaluate('document.body.dataset.home'),'clicked');
  console.log('PASS layout/real-preview/conditions/revoke-cancel/fold/focus/navigation '+width);
 }
 if(preparingOnly){
  await visit();await tap('.zipco-wa-w-toggle');await delay(450);
  assert.equal(await evaluate('document.querySelector(".zipco-wa-w-msg").textContent'),'El negocio está preparando tu pedido.');
  assert.equal(await evaluate('document.querySelector(".zipco-own-rail").textContent.includes("Preparando")'),true);
  await evaluate('window.delayPost=true');await tap('.zipco-wa-w-wa');await wait('window.posts.length===1');
  assert.equal(await evaluate('document.querySelector(".zipco-wa-w-body").inert'),true);
  await evaluate('window.delayPost=false;window.releasePost()');await wait('window.navigations.length===1');
  await evaluate('window.makeReady()');await wait('window.counts.ready===1');await evaluate('window.chooseView("ready")');
  await wait('!!document.querySelector(".zipco-own-cta")');
  assert.equal(await evaluate('!!document.querySelector(".zipco-wa-w")'),false);
  assert.equal(await evaluate('window.posts.length'),1);await ctx.screenshot('ready');
  console.log('PASS preparing/copy/real-contact/busy/transition-to-ready');return;
 }
 await visit(390,'&no-open=1');await tap('.zipco-wa-w-toggle');await delay(450);
 assert.equal(await evaluate('!!document.querySelector(".zipco-wa-w-wa")'),false);
 assert.equal(await evaluate('window.posts.length'),0);console.log('PASS no-contact-permission');
 await visit();await tap('.zipco-wa-w-toggle');await delay(450);
 await evaluate('window.delayPost=true');await tap('.zipco-wa-w-wa');await wait('window.posts.length===1');
 assert.equal(await evaluate('document.querySelector(".zipco-wa-w-wa").disabled'),true);
 assert.equal(await evaluate('document.querySelector(".zipco-wa-w-body").inert'),true);
 await evaluate('window.delayPost=false;window.releasePost()');await wait('window.navigations.length===1');
 assert.equal(await evaluate('window.posts.length'),1);console.log('PASS real-open/busy/inert/single-operation');
 await visit();await tap('.zipco-wa-w-toggle');await delay(450);
 await evaluate('window.savedRail=document.querySelector(".zipco-own-rail");window.savedControls=document.querySelector(".zipco-wa-w-opts-bd");window.savedPermission=document.querySelector("[data-revoke]");window.makePreparing()');
 await wait('document.querySelector(".zipco-wa-w-pill b")?.textContent==="PREPARANDO TU PEDIDO"');
 assert.equal(await evaluate('window.savedRail===document.querySelector(".zipco-own-rail")'),true);
 assert.equal(await evaluate('window.savedControls.isConnected'),true);
 assert.equal(await evaluate('document.body.textContent.includes("Preparando")||document.body.textContent.includes("preparando")'),true);
 await ctx.screenshot('preparing');console.log('PASS waiting-to-preparing/stable-rail-and-contact-controls');
 await visit();await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await tap('.zipco-wa-w-toggle');await delay(100);
 assert.equal(await evaluate('document.querySelector(".zipco-wa-w-fg").getAnimations({subtree:true}).some(animation=>animation.playState==="running")'),false);
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".zipco-wa-w-chv")).transitionDuration'),'0s');console.log('PASS reduced-motion');
 }
 await visit();await tap('.zipco-wa-w-toggle');await delay(450);
 await evaluate('window.lost=true');await tap('.zipco-wa-w-wa');
 await wait('document.body.textContent.includes("Reintentar")||document.body.textContent.includes("Actualizar estado")');
 assert.equal(await evaluate('window.posts.length'),1);
 assert.equal(await evaluate('window.navigations.length'),0);
 await tap('.zipco-wa-w-toggle');await delay(450);
 assert.equal(await evaluate('!!document.querySelector(".zipco-avw-query-recovery")'),true);
 await delay(600);assert.equal(await evaluate('window.posts.length'),1);
 await ctx.screenshot('recovery-collapsed');console.log('PASS uncertain-send/recovery-visible/no-automatic-retry');
});

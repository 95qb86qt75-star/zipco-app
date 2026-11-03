import {withBrowser} from './qa/browser.mjs';
await withBrowser('whatsapp-detail-entry','coordination',async ctx=>{
 const {assert,evaluate,wait,tap,delay}=ctx;
 await ctx.visit('own-pending=1&waiting-design=1&details=1&no-access=1&multi=1',390,852);
 await evaluate('window.makePreparing()');await wait('document.querySelector("#order-20 .zipco-wa-w-pill b")?.textContent==="PREPARANDO TU PEDIDO"');
 for(const gate of ['data-request-motion','data-request-list-scrolling','data-coordination-motion']){
 await evaluate(`document.querySelector('main').setAttribute('${gate}','${gate==='data-request-list-scrolling'?'true':'idle'}')`);
 for(const [id,label]of [[20,'preparing'],[21,'waiting']]){
  // List scheduling can pause a card before its detail is revealed. Its real
  // content must remain visible even if an entrance effect cannot advance.
  await tap(`#order-${id} .zipco-wa-w-toggle`);await delay(460);
  const visible=await evaluate(`(()=>{const card=document.querySelector('#order-${id}');return [...card.querySelectorAll('.zipco-wa-w-state,.zipco-wa-w-tile,.zipco-wa-w-opts')].filter(el=>getComputedStyle(el).display!=='none').map(el=>({class:el.className,opacity:getComputedStyle(el).opacity,visibility:getComputedStyle(el).visibility,animation:getComputedStyle(el).animationPlayState}));})()`);
  console.log(label,JSON.stringify(visible));
  assert(visible.length>=3);assert(visible.every(el=>Number(el.opacity)===1&&el.visibility==='visible'),'Paused entrance hid real content');
  await ctx.screenshot(label+'-'+gate+'-paused-open');
  assert(visible.every(el=>el.animation==='paused'),'Fixture must exercise a paused entrance');
  await tap(`#order-${id} .zipco-wa-w-tile`);await wait('!!document.querySelector("[role=dialog]")');
  await evaluate('[...document.querySelectorAll("[role=dialog] button")].find(button=>button.textContent.includes("Cerrar")).dataset.closeEntry="true"');
  await tap('[data-close-entry]');await wait('!document.querySelector("[role=dialog]")');
  await tap(`#order-${id} .zipco-wa-w-hide`);
  assert.equal(await evaluate(`document.activeElement===document.querySelector('#order-${id} .zipco-wa-w-toggle')`),true);
  console.log('PASS paused entrance/conditions/focus '+label+' '+gate);
 }
 await evaluate(`document.querySelector('main').removeAttribute('${gate}')`);
 }
 assert.equal(await evaluate('window.posts.length'),0);
});

import {runSuite} from './qa/run-suite.mjs';
const cases=[...[320,393].map(width=>({case:'own-pending',role:'customer',width,height:852})),{case:'legacy',role:'customer',width:393,height:852},{case:'local-parity',role:'customer',width:393,height:852}];
await runSuite('customer-design-parity','coordination',cases,async(ctx,spec)=>{
 const {assert,evaluate,wait,tap}=ctx;
 if(spec.case==='local-parity'){
  await ctx.visit('receipt-v2=1&pickup=1&no-access=1',393,852);
  const signature=await evaluate(`(()=>{const root=document.querySelector('.zipco-pickup-c');return [root,...root.querySelectorAll('.zipco-pickup-c-head,.zipco-own-rail,.zipco-own-fold')].map(e=>({tag:e.tagName,classes:e.className,background:getComputedStyle(e).background,borderRadius:getComputedStyle(e).borderRadius}));})()`);
  const origin=await evaluate('location.origin');await ctx.send('Page.navigate',{url:origin+'/scripts/qa/previews/customer-course/index.html'});await wait('!!document.querySelector("[data-pickup-preview] .zipco-pickup-c")');
  const local=await evaluate(`(()=>{const root=document.querySelector('[data-pickup-preview] .zipco-pickup-c');return [root,...root.querySelectorAll('.zipco-pickup-c-head,.zipco-own-rail,.zipco-own-fold')].map(e=>({tag:e.tagName,classes:e.className,background:getComputedStyle(e).background,borderRadius:getComputedStyle(e).borderRadius}));})()`);
  assert.deepEqual(local,signature,'Preview and app must use the same pickup shell/styles');
  await tap('[data-pickup-preview] .zipco-pickup-c-head');await wait('document.querySelector("[data-pickup-preview] .zipco-pickup-c-head").getAttribute("aria-expanded")==="true"');
  assert.equal(await evaluate('document.querySelectorAll("[data-pickup-preview] .zipco-receipt-details").length'),1);
  await ctx.screenshot('shared-local-detail');return;
 }
 await ctx.visit(spec.case==='legacy'?'legacy-ready=1&no-access=1':'own-pending=1&no-access=1',spec.width,spec.height);
 await wait('!!document.querySelector("#order-20 .zipco-own-rail")');
 assert.equal(await evaluate('document.querySelectorAll("#order-20 article").length'),0,'No old card nested under the new header');
 assert.equal(await evaluate('document.querySelectorAll(".zipco-cp").length'),0,'No legacy product layout');
 await tap('#order-20 .zipco-own-chv');await wait('document.querySelector("#order-20").dataset.expanded==="true"');
 assert.equal(await evaluate('document.querySelectorAll("#order-20 .zipco-receipt-details").length'),1);
 assert.equal(await evaluate('document.querySelectorAll("#order-20 .zipco-cp-orb,#order-20 .zipco-customer-coordination-steps").length'),0);
 await ctx.screenshot(spec.case+'-expanded-'+spec.width);
 await tap('#order-20 .zipco-co-strip2');await wait('!!document.querySelector("[role=dialog]")');
 const close=await evaluate(`(()=>{const b=[...document.querySelectorAll('[role=dialog] button')].find(e=>e.textContent.includes('Cerrar'));if(!b)throw Error('Close missing');b.id='conditions-close-parity';return '#'+b.id;})()`);await tap(close);await wait('!document.querySelector("[role=dialog]")');
 if(spec.case==='legacy'){
  assert.equal(await evaluate('document.querySelector(".zipco-own-cta").textContent.includes("Confirmar aviso")'),true);
  await tap('.zipco-own-cta');await wait('!!document.querySelector("[role=alertdialog]")');await tap('[role=alertdialog] button');
  await wait('window.posts.length===1&&window.posts[0].url.endsWith("/ack-ready-notice")');
  await wait('document.querySelector(".zipco-own-cta")?.textContent.includes("Confirmar recepción")===true');
  assert.equal(await evaluate('window.counts.ready'),1);assert.equal(await evaluate('window.counts.history'),0);
  assert.equal(await evaluate('document.querySelector(".zipco-own-rail").dataset.stage'),'ready','ACK is not product receipt');
  await tap('.zipco-own-cta');await wait('!!document.querySelector("[role=alertdialog]")');await tap('[role=alertdialog] button');
  await wait('window.posts.length===2&&window.posts[1].url.endsWith("/confirm-receipt")');
  await wait('window.counts.history===1');
 }
},process.argv.slice(2));

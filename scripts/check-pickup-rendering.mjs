import { runSuite } from "./qa/run-suite.mjs";
await runSuite('pickup-rendering','coordination',['preparing','ready','received'].map(caseName=>({case:caseName,role:'customer',width:393,height:852})),async(ctx,spec)=>{
 const {assert,evaluate,wait,tap}=ctx;
 await ctx.visit('pickup=1&no-access=1&'+(spec.case==='preparing'?'pickup-progress=1':'receipt-v2=1'+(spec.case==='received'?'&received=1':'')),393,852);
 await wait('!!document.querySelector("#order-20.zipco-pickup-c")');
 assert.equal(await evaluate('document.querySelectorAll(".zipco-cp,.zipco-co-fb,.zipco-customer-coordination-detail").length'),0);
 await tap('.zipco-pickup-c-head');await wait('document.querySelector(".zipco-pickup-c-head").getAttribute("aria-expanded")==="true"');
 await ctx.delay(750);
 assert.equal(await evaluate('document.querySelectorAll(".zipco-receipt-details").length'),1);
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".zipco-co-strip2-v")).color'),'rgb(15, 23, 42)');
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".zipco-co-strip2-l")).color'),'rgb(15, 118, 110)');
 await tap('.zipco-co-strip2');await wait('!!document.querySelector("[role=dialog]")');
 const close=await evaluate(`(()=>{const button=[...document.querySelectorAll('[role=dialog] button')].find(e=>e.textContent.includes('Cerrar'));button.id='pickup-close-conditions';return '#'+button.id;})()`);await tap(close);await wait('!document.querySelector("[role=dialog]")');
 await ctx.screenshot(spec.case+'-expanded');
 assert.equal(await evaluate('window.posts.length'),0);
},process.argv.slice(2));

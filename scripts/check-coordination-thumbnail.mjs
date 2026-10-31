import {runSuite} from './qa/run-suite.mjs';
const cases=[...[320,393].map(width=>({case:'photo',role:'customer',width,height:852})),{case:'broken',role:'customer',width:393,height:852},{case:'missing',role:'customer',width:393,height:852}];
await runSuite('coordination-thumbnail','coordination',cases,async(ctx,spec)=>{
 const {assert,evaluate,wait,tap}=ctx;
 await ctx.visit('thumbnail-layout=1&no-access=1'+(spec.case==='broken'?'&broken-image=1':spec.case==='missing'?'&missing-image=1':''),spec.width,spec.height);
 if(spec.case==='photo'){
   await wait('document.querySelector("#order-20 .zipco-product-thumb img")?.naturalWidth>0');
   assert.equal(await evaluate('document.querySelector("#order-20 .zipco-product-thumb img").loading'),'eager');
   assert.equal(await evaluate('document.querySelector("#order-20 .zipco-product-thumb:nth-child(2) img").loading'),'lazy');
   assert.equal(await evaluate('document.querySelector("[data-default-preview] img").loading'),'lazy');
   const shape=await evaluate('(()=>{const im=document.querySelector("#order-20 .zipco-product-thumb img"),r=im.getBoundingClientRect(),s=getComputedStyle(im);return{width:r.width,height:r.height,display:s.display,visibility:s.visibility,opacity:s.opacity};})()');
   assert(shape.width>=40&&shape.height>=40&&shape.display!=='none'&&shape.visibility==='visible'&&shape.opacity==='1');
 }else{
   await wait('!!document.querySelector("#order-20 .zipco-product-image-fallback svg")');
   assert(await evaluate('document.querySelector("#order-20 .zipco-product-image-fallback").getBoundingClientRect().width>=40'));
 }
 await ctx.screenshot(spec.case+'-'+spec.width);
 await tap('#order-20 .zipco-product-thumb');await wait('!!document.querySelector(".zipco-product-sheet")');
 assert.equal(await evaluate('document.querySelector(".zipco-product-title").textContent'),'Producto QA');
 if(spec.case==='photo')await wait('document.querySelector(".zipco-product-hero img")?.naturalWidth>0');
 else await wait('!!document.querySelector(".zipco-product-hero .zipco-product-image-fallback")');
 await tap('.zipco-product-done');await wait('!document.querySelector(".zipco-product-sheet")');
 assert.equal(await evaluate('document.querySelector("#order-20").dataset.expanded'),'false');
 assert.equal(await evaluate('document.activeElement.classList.contains("zipco-product-thumb")'),true);
 assert.equal(await evaluate('window.posts.length'),0);
},process.argv.slice(2));

import {runSuite} from './qa/run-suite.mjs';
const cases=[...[320,393,430].flatMap(width=>['whatsapp','pickup'].map(caseName=>({case:caseName,role:'customer',width,height:852}))),...['business','recovery','conflict','read-failure','reload','forbidden'].map(caseName=>({case:caseName,role:caseName==='business'?'business':'customer',width:393,height:852})),{case:'reduced',role:'customer',width:393,height:852,reduce:true}];
await runSuite('receipt-finalization','coordination',cases,async(ctx,spec)=>{
 const {assert,evaluate,wait,tap}=ctx;
 if(spec.reduce)await ctx.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await ctx.visit('receipt-v2=1&no-access=1&persist=1'+(spec.case==='pickup'?'&pickup=1':'')+(spec.case==='business'?'&business=1&received=1':'')+(spec.case==='reload'?'&received=1':'')+(spec.case==='forbidden'?'&forbidden=1':''),spec.width,spec.height);
 if(spec.case==='business'){
  await wait('document.body.textContent.includes("Producto recibido")');
  assert.equal(await evaluate('window.counts.active'),1);assert.equal(await evaluate('window.counts.ready'),0);
  assert.equal(await evaluate('!!document.querySelector(".zipco-own-cta")'),false);assert.equal(await evaluate('window.posts.length'),0);return;
 }
 await wait('!!document.querySelector(".zipco-own-cta")');
 assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'No horizontal overflow');
 const identity=await evaluate('document.querySelector("#order-20").textContent');assert(identity.includes('Negocio QA'));
 await ctx.screenshot(spec.case+'-'+spec.width);
 if(spec.case==='forbidden'){assert(await evaluate('document.querySelector(".zipco-own-cta").disabled'));return;}
 if(spec.case==='conflict'){
  await evaluate('window.receiptConflict=true');await tap('.zipco-own-cta');await wait('document.body.textContent.includes("Actualizar estado")');assert.equal(await evaluate('window.posts.length'),1);assert.equal(await evaluate('!!document.querySelector(".zipco-own-cta[data-final=true]")'),false);return;
 }
 if(spec.case==='read-failure'){
  await evaluate('window.failAfterPost=true');await tap('.zipco-own-cta');await wait('document.body.textContent.includes("Actualizar estado")');assert.equal(await evaluate('window.posts.length'),1);assert.equal(await evaluate('!!document.querySelector(".zipco-own-cta[data-final=true]")'),false);
  await evaluate('window.readFailed=false');await tap('.zipco-receipt-recovery button');await wait('window.counts.active===1');await tap('.zipco-toast-action');await wait('!!document.querySelector(".zipco-own-cta[data-final=true]")');assert.equal(await evaluate('window.posts.length'),1);return;
 }
 if(spec.case!=='reload'){
  if(spec.case==='recovery'){
   await evaluate('window.lost=true');await tap('.zipco-own-cta');await wait('document.body.textContent.includes("Reintentar el mismo envío")');
   const first=await evaluate('window.posts[0]');await evaluate('window.lost=false');await tap('.zipco-receipt-recovery button:last-child');await wait('window.counts.active===1');await tap('.zipco-toast-action');await wait('!!document.querySelector(".zipco-own-cta[data-final=true]")');
   assert.equal(await evaluate('window.posts[1].key'),first.key);assert.deepEqual(await evaluate('window.posts[1].body'),first.body);return;
  }
  await evaluate('window.delayPost=true');await tap('.zipco-own-cta');await wait('window.posts.length===1');
  assert(await evaluate('document.querySelector(".zipco-own-cta").disabled'));await evaluate('window.delayPost=false;window.releasePost()');
  await wait('window.counts.active===1&&window.counts.ready===0');
  // The category remains unchanged. Ver explicitly opens En curso.
  assert.equal(await evaluate('document.querySelector("main").dataset.view'),'ready');
  await wait('!!document.querySelector(".zipco-toast-action")');await tap('.zipco-toast-action');await wait('!!document.querySelector(".zipco-own-cta[data-final=true]")');
  assert.equal(await evaluate('window.posts.length'),1);
 }
 const declareKey=await evaluate('window.posts[0]?.key');
 if(spec.case==='reload'){
  await ctx.send('Page.reload');await wait('!!document.querySelector(".zipco-own-cta[data-final=true]")');assert.equal(await evaluate('window.posts.length'),0);
 }
 await tap('.zipco-own-cta[data-final=true]');await wait('window.counts.history===1');
 assert.equal(await evaluate('document.querySelector("main").dataset.view'),'active');
 if(declareKey)assert.notEqual(await evaluate('window.posts.at(-1).key'),declareKey);
 await tap('.zipco-toast-action');await wait('document.querySelector("main").dataset.view==="history"');
 assert.equal(await evaluate('window.counts.active'),0);
},process.argv.slice(2));

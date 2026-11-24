import {runSuite} from './qa/run-suite.mjs';
const cases=[...[320,390,430].map(width=>({case:'controls',role:'business',width,height:852})),...['authorize','blocked','recovery','motion'].map(name=>({case:name,role:'business',width:390,height:852}))];
await runSuite('business-initial-glass','coordination',cases,async(ctx,spec)=>{
 const {assert,evaluate,wait,tap,delay,send}=ctx;
 await ctx.visit('business=1&business-initial=1&before=1&details=1&navigate=1'+(spec.case==='authorize'?'&business-consent=1':'')+(spec.case==='blocked'?'&needs-consent=1&no-open=1':'')+(spec.width===430?'&long=1':''),spec.width,spec.height);
 await wait('!!document.querySelector(".zipco-bi")');
 const open=async()=>{await tap('.zipco-bi-toggle');await delay(450);};
 const closeDialog=async()=>{await evaluate('[...document.querySelectorAll("[role=dialog] button")].find(b=>b.textContent.includes("Cerrar")||b.getAttribute("aria-label")==="Cerrar detalle"||b.textContent==="Volver").dataset.closeGlass="true"');await tap('[data-close-glass]');await wait('!document.querySelector("[role=dialog]")');};
 assert.equal(await evaluate('document.querySelector(".zipco-bi-fold").inert'),true);
 assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
 await ctx.screenshot('closed-'+spec.case+'-'+spec.width);
 if(spec.case==='controls'){
  await tap('.zipco-bi .zipco-product-thumb');await wait('!!document.querySelector(".zipco-product-sheet")');
  assert.equal(await evaluate('document.querySelector(".zipco-bi-toggle").getAttribute("aria-expanded")'),'false');await tap('.zipco-product-close');
  await tap('.zipco-bi-next');await delay(450);
  assert.equal(await evaluate('document.querySelector(".zipco-bi-fold").inert'),false);
  await tap('.zipco-bi-cond');await wait('!!document.querySelector("[role=dialog]")');await closeDialog();
  await tap('.zipco-bi-annul');await wait('!!document.querySelector("[role=dialog]")');await closeDialog();
  await evaluate('[...document.querySelectorAll(".zipco-bi button")].find(b=>b.textContent.includes("Retirar mi permiso")).dataset.revokeGlass="true"');
  await tap('[data-revoke-glass]');await wait('!!document.querySelector("[role=dialog]")');await closeDialog();
  assert.equal(await evaluate('document.querySelector(".zipco-bi").scrollTop'),0,'Focus must not scroll the clipped card internally');
  await ctx.screenshot('open-'+spec.width);assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  await tap('.zipco-bi-hide');await delay(450);
  assert.equal(await evaluate('document.activeElement===document.querySelector(".zipco-bi-next")'),true);
  assert.equal(await evaluate('document.querySelector(".zipco-bi-fold").inert'),true);
  assert.equal(await evaluate('window.posts.length'),0);
  await tap('#home-test');return;
 }
 await open();
 if(spec.case==='blocked'){
  assert.equal(await evaluate('document.querySelector(".zipco-bi-tile.last .zipco-co-go").disabled'),true);
  assert.equal(await evaluate('document.body.textContent.includes("Esperando autorización de contacto del cliente")'),true);
  assert.equal(await evaluate('window.posts.length'),0);return;
 }
 if(spec.case==='motion'){
  await evaluate('document.querySelector("main").dataset.requestMotion="idle"');
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".zipco-bi .zipco-co-go")).opacity'),'1');
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".zipco-bi-mi")).animationPlayState'),'paused');
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".zipco-bi .zipco-co-go")).animationName'),'none');return;
 }
 if(spec.case==='authorize'){
  assert.equal(await evaluate('document.querySelector(".zipco-bi-tile.last button").disabled'),true);
  await evaluate('window.delayPost=true');await tap('.zipco-bi-tile:not(.last) .zipco-co-go');await wait('window.posts.length===1');
  assert.equal(await evaluate('document.querySelector(".zipco-bi-tile:not(.last) .zipco-co-go")?.disabled!==false'),true);
  await evaluate('window.delayPost=false;window.releasePost()');
  await wait('!!document.querySelector(".zipco-bi .zipco-co-ld")');
  await wait('!!document.querySelector(".zipco-bi-tile.last .zipco-co-go")');
  await wait('!document.querySelector(".zipco-ah")');
  assert.equal(await evaluate('window.posts.length'),1);
 }
 if(spec.case==='recovery')await evaluate('window.lost=true');
 await tap('.zipco-bi-tile.last .zipco-co-go');
 if(spec.case==='recovery'){
  await wait('document.querySelector(".zipco-bi").dataset.biRecovery==="true"');
  await tap('.zipco-bi-hide');await delay(450);
  assert.equal(await evaluate('document.querySelector(".zipco-bi-next").textContent.includes("Operación por resolver")'),true);
  const posts=await evaluate('window.posts.length');await delay(500);assert.equal(await evaluate('window.posts.length'),posts);
  assert.equal(await evaluate('window.navigations.length'),0);return;
 }
 await wait('window.navigations.length===1');assert.equal(await evaluate('window.posts.filter(p=>p.url.endsWith("/open-whatsapp")).length'),1);
},process.argv.slice(2));

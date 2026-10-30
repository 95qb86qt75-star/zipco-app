// Hit testing over real cards. HTTP/navigation stay simulated. No HTMLElement.click().
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
let source=fs.readFileSync('scripts/check-coordination-inline.mjs','utf8');
const start=source.indexOf("if(!process.argv.includes('--shared-only'))");
if(start<0)throw Error('Coordination fixture entry changed');
source=source.slice(0,start).replaceAll('coordination-inline-browser','coordination-detail-taps');
source=source.replace("['OPEN_WHATSAPP',...(accesses.has(p.id)", "[...(!q.has('no-open')?['OPEN_WHATSAPP']:[]),...(accesses.has(p.id)");
source+=String.raw`
 await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 const tap=async selector=>{
   await evaluate('document.querySelector('+JSON.stringify(selector)+')?.scrollIntoView({block:"center",behavior:"instant"})');
   await delay(160);
   const point=await evaluate('(()=>{const el=document.querySelector('+JSON.stringify(selector)+');if(!el)throw Error("Missing target");const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,hit=document.elementFromPoint(x,y);return {x,y,hits:!!hit&&el.contains(hit),pointer:getComputedStyle(el).pointerEvents,inert:!!el.closest("[inert]")};})()');
   assert.equal(point.hits,true,'Physical tap blocked: '+selector+' '+JSON.stringify(point));
   await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point.x,y:point.y}]});
   await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await delay(120);
 };
 const openDetail=async()=>{await tap('#order-20 .zipco-avw-query-detail');await wait('document.querySelector("#order-20")?.dataset.expanded==="true"');await delay(450);};
 const closeDialog=()=>tap('[role=dialog] button[aria-label="Cerrar"],[role=dialog] button[aria-label="Cerrar detalle"]');
 const conditions=async()=>{const posts=await evaluate('window.posts.length');await tap('#order-20 .zipco-customer-conditions');await wait('!!document.querySelector("[role=dialog]")');assert.equal(await evaluate('window.posts.length'),posts);await closeDialog();await wait('!document.querySelector("[role=dialog]")');};
 const options=async()=>{const posts=await evaluate('window.posts.length');await tap('#order-20 .zipco-customer-coordination-controls button:last-child');await wait('document.querySelector("#order-20 .zipco-customer-coordination-fold").dataset.open==="true"');assert.equal(await evaluate('document.querySelector("#order-20 .zipco-customer-coordination-fold").inert'),false);assert.equal(await evaluate('window.posts.length'),posts);await tap('#order-20 .zipco-customer-coordination-controls button:last-child');await wait('document.querySelector("#order-20 .zipco-customer-coordination-fold").inert');};
 const collapse=async()=>{await tap('#order-20 .zipco-avw-query-detail');await delay(500);assert.equal(await evaluate('document.querySelector("#order-20 .zipco-avw-reveal").inert'),true);assert.equal(await evaluate('getComputedStyle(document.querySelector("#order-20 .zipco-customer-coordination-open")).pointerEvents'),'none');};
 if(process.argv.includes('--expect-blocked')){
   await visit('details=1');await openDetail();
   const blocked=await evaluate('(()=>{const el=document.querySelector("#order-20 .zipco-customer-conditions");el.scrollIntoView({block:"center"});const r=el.getBoundingClientRect();return {pointer:getComputedStyle(el).pointerEvents,hits:el.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))};})()');
   assert.deepEqual(blocked,{pointer:'none',hits:false});console.log(JSON.stringify({baselineReproduced:true,blocked}));
 }else{
   for(const width of [393,320]){
     await visit('details=1&navigate=1',width);await openDetail();await conditions();await options();await collapse();await openDetail();
     assert.equal(await evaluate('window.posts.length'),0);await tap('#order-20 .zipco-customer-coordination-open');await wait('!!document.querySelector(".zipco-ah")');await wait('window.navigations.length===1');assert.equal(await evaluate('window.posts.length'),1);assert.equal(await evaluate('window.posts[0].url.endsWith("/open-whatsapp")'),true);await evaluate('window.departWhatsapp();window.resumeWhatsapp()');pass('question-touch-controls-closed-guard-and-redirect-'+width);
     await visit('details=1&navigate=1',width);await tap('#order-20 .zipco-avw-query-no');await tap('#order-20 .zipco-avw-query-yes');await wait('document.querySelector("#order-20")?.dataset.mode==="declined"');await wait('!!document.querySelector(".zipco-toast")');await tap('.zipco-toast-close');await openDetail();
     assert.equal(await evaluate('window.posts.length'),1);await conditions();await options();await tap('#order-20 .zipco-customer-coordination-open');await wait('!!document.querySelector(".zipco-ah")');await wait('window.navigations.length===1');assert.equal(await evaluate('window.posts.length'),2);assert.equal(await evaluate('window.posts[1].url.endsWith("/open-whatsapp")'),true);await evaluate('window.departWhatsapp();window.resumeWhatsapp()');await wait('document.querySelector("#order-20")?.dataset.mode==="question"');pass('declined-touch-controls-and-new-open-'+width);
   }
   await visit('details=1&no-open=1');await openDetail();assert.equal(await evaluate('document.querySelector("#order-20 .zipco-customer-coordination-open").disabled'),true);await tap('#order-20 .zipco-customer-coordination-open');assert.equal(await evaluate('window.posts.length'),0);await conditions();await options();pass('disabled-open-remains-disabled-other-controls-work');
   console.log(JSON.stringify({passed:results.length,results,transport:'synthetic',input:'CDP touchStart/touchEnd; elementFromPoint',artifacts:directory}));
 }
}finally{socket?.close();browser.kill();await new Promise(r=>server.close(r));}
`;
const file=path.resolve('node_modules/.cache/coordination-detail-taps-runner.mjs');fs.writeFileSync(file,source);
await import(pathToFileURL(file).href);

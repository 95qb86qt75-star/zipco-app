import fs from 'node:fs';
export const initialCases=[...[320,393,430].map(width=>({case:'controls',role:'customer',width,height:852})),
 {case:'authorize',role:'customer',width:393,height:852},
 {case:'blocked',role:'customer',width:320,height:852},
 {case:'revoke',role:'customer',width:393,height:852},
 {case:'recovery',role:'customer',width:393,height:852}];
const signature='(()=>{const root=document.querySelector("[data-coordination-sheet]");return [root,...root.querySelectorAll("*")].map(el=>{const s=getComputedStyle(el);return {tag:el.tagName,classes:el.getAttribute("class"),text:el.children.length?null:el.textContent,style:Object.fromEntries(["background","color","fontFamily","fontSize","fontWeight","lineHeight","padding","border","borderRadius","boxShadow","width","height"].map(k=>[k,s[k]]))};});})()';
export async function runInitialCase(ctx,spec){
 const {assert,evaluate,tap,wait,delay,send}=ctx;
 await send('Emulation.setEmulatedMedia',{features:spec.case==='authorize'?[{name:'prefers-reduced-motion',value:'reduce'}]:[]});
 await ctx.visit('details=1&before=1&navigate=1'+(spec.case==='authorize'?'&needs-consent=1':'')+(spec.case==='blocked'?'&no-open=1':'')+(spec.width===430?'&long=1':''),spec.width,spec.height);
 await wait('!!document.querySelector("[data-customer-initial]")');
 await tap('#order-20 .zipco-co-colrow');await delay(700);
 assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
 if(spec.case==='authorize'){
   await tap('#order-20 .zipco-ci-lnk');
   assert.equal(await evaluate('window.posts.length'),0);
   await tap('#order-20 .zipco-co-go2');
   await tap('#order-20 .zipco-contact-consent');
   await wait('!!document.querySelector("#order-20 .zipco-co-go")');
   assert.equal(await evaluate('window.posts.length'),1);
   assert.equal(await evaluate('window.posts[0].url.endsWith("/authorize-contact")'),true);
   await wait('!document.querySelector(".zipco-ah")');
 }
 if(spec.case==='controls'){
   await tap('#order-20 .zipco-co-strip2');await wait('!!document.querySelector("[data-coordination-sheet]")');await delay(250);
   assert.equal(await evaluate('window.posts.length'),0);
   if(spec.width===393)assert.deepEqual(await evaluate(signature),JSON.parse(fs.readFileSync('scripts/qa/fixtures/customer-conditions-original.json','utf8')),'Original conditions appearance must remain unchanged');
   await tap('[data-coordination-sheet] button[aria-label="Cerrar detalle"]');await wait('!document.querySelector("[data-coordination-sheet]")');
   await tap('#order-20 .zipco-product-thumb');await wait('!!document.querySelector(".zipco-product-sheet")');
   await tap('.zipco-product-done');await wait('!document.querySelector(".zipco-product-sheet")');
 }
 await tap('#order-20 .zipco-ci-dtl');await wait('!!document.querySelector("[data-customer-steps-sheet]")');
 assert(await evaluate('(()=>{const r=document.querySelector("[data-customer-steps-sheet]").getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1;})()'));
 if(spec.case==='blocked'){
   assert.equal(await evaluate('document.querySelector(".zipco-ci-sp li:last-child").textContent.includes("Esperando permiso")'),true);
 }
 if(spec.case==='controls'){
   await tap('[data-customer-steps-sheet] .zipco-ci-ob');await wait('!!document.querySelector("[data-coordination-sheet]")');
   assert.equal(await evaluate('!!document.querySelector("[data-customer-steps-sheet]")'),false);
   assert.equal(await evaluate('window.posts.length'),0);
   await tap('[data-coordination-sheet] button[aria-label="Cerrar"]');await wait('!document.querySelector("[data-coordination-sheet]")');
   await tap('#order-20 .zipco-ci-dtl');await wait('!!document.querySelector("[data-customer-steps-sheet]")');
   await tap('[data-customer-steps-sheet] [aria-label="Opciones de esta solicitud"] button');
   await wait('!!document.querySelector(".zipco-action-dialog")');
   assert.equal(await evaluate('document.querySelector(".zipco-action-dialog").textContent.includes("¿Retirar tu permiso de contacto?")'),true);
   await tap('.zipco-action-dialog button');await wait('!document.querySelector(".zipco-action-dialog")');
   assert.equal(await evaluate('!!document.querySelector("[data-customer-steps-sheet]")'),true);
 }
 if(spec.case==='revoke'){
   await tap('[data-customer-steps-sheet] [aria-label="Opciones de esta solicitud"] button');
   await wait('!!document.querySelector(".zipco-action-dialog")');
   await tap('.zipco-action-dialog button:last-child');
   await wait('!document.querySelector(".zipco-action-dialog")');
   assert.equal(await evaluate('window.posts.length'),1);
   assert.equal(await evaluate('window.posts[0].url.endsWith("/revoke-contact-consent")'),true);
   await tap('.zipco-ci-close');await wait('!document.querySelector("[data-customer-steps-sheet]")');
   await wait('!!document.querySelector("#order-20 .zipco-contact-consent")');
   assert.equal(await evaluate('document.querySelector("main").dataset.view'),'coordination');return;
 }
 await tap('.zipco-ci-close');await wait('!document.querySelector("[data-customer-steps-sheet]")');await delay(100);
 assert.equal(await evaluate('document.activeElement.classList.contains("zipco-ci-dtl")'),true);
 await ctx.screenshot(spec.case+'-'+spec.width);
 if(spec.case==='controls'){
   await tap('#order-20 .zipco-ci-hide');await delay(700);
   assert.equal(await evaluate('document.querySelector("#order-20 .zipco-co-fb").inert'),true);
   await tap('#order-20 .zipco-co-colrow');await delay(700);
 }
 const initial=await evaluate('window.posts.length');
 if(spec.case==='blocked'){
   assert.equal(await evaluate('document.querySelector("#order-20 .zipco-co-go").disabled'),true);
   await tap('#order-20 .zipco-co-go');assert.equal(await evaluate('window.posts.length'),initial);return;
 }
 if(spec.case==='recovery')await evaluate('window.lost=true');
 await tap('#order-20 .zipco-co-go');
 if(spec.case==='recovery'){
   await wait('!!document.querySelector(".zipco-ci-recovery")');await delay(500);
   assert.equal(await evaluate('window.posts.length'),1);assert.equal(await evaluate('window.navigations.length'),0);return;
 }
 await wait('!!document.querySelector(".zipco-ah")');await wait('window.navigations.length===1');
 assert.equal(await evaluate('window.posts.length'),initial+1);
 await evaluate('window.departWhatsapp();window.resumeWhatsapp()');
 await wait('document.querySelector("#order-20")?.dataset.mode==="question"');
}

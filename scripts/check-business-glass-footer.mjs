import {withBrowser} from './qa/browser.mjs';
await withBrowser('business-glass-footer','coordination',async ctx=>{
 const {assert,evaluate,tap,wait,delay}=ctx;
 for(const width of [320,390,430]){
  await ctx.visit('business=1&business-initial=1&before=1&details=1&navigate=1',width,852);
  await wait('!!document.querySelector(".zipco-bi")');
  const gap=await evaluate('(()=>{const root=document.querySelector(".zipco-bi"),r=root.getBoundingClientRect(),n=root.querySelector(".zipco-bi-next").getBoundingClientRect();return r.bottom-n.bottom;})()');
  assert(gap>=10,'Collapsed action needs bottom breathing room: '+gap);
  await tap('.zipco-bi-next');await delay(450);
  await evaluate('[...document.querySelectorAll(".zipco-bi button")].find(b=>b.textContent.includes("Retirar mi permiso")).dataset.parityRevoke="true"');
  const row=await evaluate('(()=>{const revoke=document.querySelector("[data-parity-revoke]"),annul=document.querySelector(".zipco-bi-annul"),a=revoke.getBoundingClientRect(),b=annul.getBoundingClientRect();return {revokeY:a.y,annulY:b.y,bg:getComputedStyle(revoke).backgroundColor,border:getComputedStyle(revoke).borderTopWidth,right:a.right,annulLeft:b.left};})()');
  console.log('footer',width,JSON.stringify(row));
  assert(Math.abs(row.revokeY-row.annulY)<=1,'Permission and annul must share the row');
  assert.equal(row.bg,'rgba(0, 0, 0, 0)');assert.equal(row.border,'0px');assert(row.right<=row.annulLeft);
  const shine=await evaluate('(()=>{const b=document.querySelector(".zipco-bi-tile.last .zipco-co-go");const s=getComputedStyle(b,"::after");return {iterations:s.animationIterationCount,z:s.zIndex,pointer:s.pointerEvents};})()');
  assert.equal(shine.iterations,'infinite');assert(Number(shine.z)>=0);assert.equal(shine.pointer,'none');
  await tap('[data-parity-revoke]');await wait('!!document.querySelector("[role=dialog]")');
  await evaluate('[...document.querySelectorAll("[role=dialog] button")].find(b=>b.textContent==="Volver").dataset.parityBack="true"');
  await tap('[data-parity-back]');await wait('!document.querySelector("[role=dialog]")');
  await tap('.zipco-bi-annul');await wait('!!document.querySelector("[role=dialog]")');
  await evaluate('[...document.querySelectorAll("[role=dialog] button")].find(b=>b.textContent==="Volver").dataset.parityBack="true"');
  await tap('[data-parity-back]');await wait('!document.querySelector("[role=dialog]")');
  await ctx.screenshot('footer-'+width);
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  assert.equal(await evaluate('window.posts.length'),0);console.log('PASS footer/real-dialogs/shine '+width);
 }
 await ctx.visit('business=1&business-initial=1&before=1&details=1&navigate=1',390,852);
 await tap('.zipco-bi-next');await delay(450);
 await evaluate('window.lost=true');await tap('.zipco-bi-foot>.zipco-pickup-revoke');await wait('!!document.querySelector("[role=dialog]")');
 await evaluate('[...document.querySelectorAll("[role=dialog] button")].find(b=>b.textContent==="Confirmar").dataset.parityConfirm="true"');
 await tap('[data-parity-confirm]');await wait('!!document.querySelector(".zipco-bi-footer-alerts")');
 await evaluate('[...document.querySelectorAll("[role=dialog] button")].find(b=>b.textContent==="Volver").dataset.parityBack="true"');
 await tap('[data-parity-back]');await wait('!document.querySelector("[role=dialog]")');
 assert.equal(await evaluate('document.querySelector(".zipco-bi-footer-alerts").textContent.includes("Actualizar estado")'),true);
 await delay(500);assert.equal(await evaluate('window.posts.length'),1);console.log('PASS real-permission-error/remains-visible/no-automatic-retry');
});

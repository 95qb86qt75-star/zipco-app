import {withBrowser} from './qa/browser.mjs';
await withBrowser('whatsapp-rail-fit','coordination',async ctx=>{
 const {assert,evaluate,wait,tap}=ctx;
 for(const width of [320,390,430]){
  await ctx.visit('own-pending=1&waiting-design=1&details=1&no-access=1&multi=1',width,852);
  await evaluate('window.makePreparing()');await wait('document.querySelector("#order-20 .zipco-wa-w-pill b")?.textContent==="PREPARANDO TU PEDIDO"');
  for(const id of [20,21]){
   const geometry=await evaluate(`(()=>{const card=document.querySelector('#order-${id}'),rail=card.querySelector('.zipco-own-rail'),bounds=rail.getBoundingClientRect();return [...rail.querySelectorAll('.zipco-own-steptx')].map(el=>{const range=document.createRange();range.selectNodeContents(el);const r=range.getBoundingClientRect();return {text:el.textContent,left:r.left,right:r.right,railLeft:bounds.left,railRight:bounds.right,scroll:el.scrollWidth,client:el.clientWidth};});})()`);
   assert(geometry.every(g=>g.left>=g.railLeft&&g.right<=g.railRight&&g.scroll<=g.client+1),JSON.stringify({width,id,geometry}));
   await tap(`#order-${id} .zipco-wa-w-toggle`);await ctx.delay(450);
   assert.equal(await evaluate(`document.querySelector('#order-${id} .zipco-wa-w-toggle').getAttribute('aria-expanded')`),'true');
   assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
   await ctx.screenshot('rail-'+width+'-'+id);console.log('PASS complete rail text '+width+' '+id);
  }
  assert.equal(await evaluate('window.posts.length'),0);
 }
});

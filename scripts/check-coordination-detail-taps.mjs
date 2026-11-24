import {runSuite} from './qa/run-suite.mjs';
import {coordinationCases,runCoordinationCase} from './qa/coordination-cases.mjs';
import {withBrowser} from './qa/browser.mjs';
let args=process.argv.slice(2),catalog=coordinationCases;
if(args.includes('--reveal-only')){catalog=catalog.filter(c=>['reveal','fits'].includes(c.case));args=args.filter(a=>a!=='--reveal-only');}
if(args.includes('--expect-blocked')){
 await withBrowser('coordination-historical-baseline','coordination',async ctx=>{await ctx.visit('details=1');await ctx.tap('#order-20 .zipco-avw-query-detail');await ctx.delay(450);const blocked=await ctx.evaluate('(()=>{const el=document.querySelector("#order-20 .zipco-customer-conditions");el.scrollIntoView({block:"center"});const r=el.getBoundingClientRect();return {pointer:getComputedStyle(el).pointerEvents,hits:el.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))};})()');ctx.assert.deepEqual(blocked,{pointer:'none',hits:false});});
}else await runSuite('coordination-detail','coordination',catalog,runCoordinationCase,args,['pointer-events','duplicate-open']);

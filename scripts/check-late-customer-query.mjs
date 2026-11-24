import {runSuite} from './qa/run-suite.mjs';
const cases=[...[320,390,430].map(width=>({case:'layout',role:'customer',width,height:852})),...['yes','no','recovery','permissions','business','still'].map(name=>({case:name,role:name==='business'?'business':'customer',width:390,height:852}))];
await runSuite('late-customer-query','acceptance',cases,async(c,s)=>{
 const {assert,evaluate,wait,tap}=c;
 await c.visit('available-design=1&reference-photo=1&late-query='+(s.case==='still'?'still':s.case==='layout'?'long':'waiting')+(s.case==='permissions'?'&no-answer=1':''),s.width,852);
 if(s.case==='business'){await evaluate('window.switchRole("business")');await wait('!!document.querySelector(".zipco-late-card--business")');assert.equal(await evaluate('!!document.querySelector(".zipco-late-card--query")'),false);return;}
 if(s.case==='still'){await evaluate('window.switchRole("customer")');await wait('!!document.querySelector(".zipco-late-customer")');assert.equal(await evaluate('!!document.querySelector(".zipco-late-card--query")'),false);return;}
 await wait('!!document.querySelector(".zipco-late-card--query")');
 assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
 assert.equal(await evaluate('document.querySelector(".zipco-lq-vd").getAttribute("aria-expanded")'),'false');
 assert.equal(await evaluate('document.getElementById(document.querySelector(".zipco-lq-vd").getAttribute("aria-controls")).hidden'),true);
 if(s.case==='permissions'){assert.equal(await evaluate('!!document.querySelector(".zipco-lq-acts")'),false);return;}
 if(s.case==='layout'){
  await tap('.zipco-lq-th .zipco-product-thumb');await wait('!!document.querySelector(".zipco-product-sheet")');await tap('.zipco-product-done');await wait('!document.querySelector(".zipco-product-sheet")');
  assert.equal(await evaluate('document.querySelector(".zipco-lq-vd").getAttribute("aria-expanded")'),'false');
  await tap('.zipco-lq-vd');await wait('!!document.querySelector(".zipco-lq-details")');
  await tap('.zipco-lq-tile>button');await wait('!!document.querySelector(\'[aria-label="Cerrar imagen"]\')');await tap('[aria-label="Cerrar imagen"]');await c.delay(350);
  assert.equal(await evaluate('document.querySelector(".zipco-lq-vd").getAttribute("aria-expanded")'),'true');
  await c.screenshot('expanded-'+s.width);await tap('.zipco-lq-hide');
  assert.equal(await evaluate('document.activeElement.classList.contains("zipco-lq-vd")'),true);
  assert.equal(await evaluate('document.querySelector(".zipco-late-card--query").scrollTop'),0);
  const t=await evaluate('document.querySelector(".zipco-lq-hand").getAnimations()[0]?.currentTime');await c.delay(200);assert(await evaluate('document.querySelector(".zipco-lq-hand").getAnimations()[0]?.currentTime')>t);
  await evaluate('document.querySelector("#order-20").dataset.requestMotion="idle"');assert.equal(await evaluate('getComputedStyle(document.querySelector(".zipco-lq-hand")).animationPlayState'),'paused');
  await evaluate('document.querySelector("#order-20").dataset.requestMotion="active"');
  await evaluate('document.querySelector("[data-requests-scroll]").dataset.requestListScrolling="true"');assert.equal(await evaluate('getComputedStyle(document.querySelector(".zipco-lq-hand")).animationPlayState'),'paused');
  await evaluate('delete document.querySelector("[data-requests-scroll]").dataset.requestListScrolling');
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".zipco-lq-hand")).animationPlayState'),'running');
  await c.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});assert.equal(await evaluate('getComputedStyle(document.querySelector(".zipco-lq-hand")).animationName'),'none');await c.send('Emulation.setEmulatedMedia',{features:[]});
  assert.equal(await evaluate('window.flowCalls.filter(x=>x.method==="POST").length'),0);return;
 }
 const yes=s.case!=='no',selector=yes?'.zipco-lq-yes':'.zipco-lq-no';
 await evaluate('(()=>{const original=window.fetch;window.queryAttempts=[];window.fetch=async(url,init)=>{if(!/\\/(?:confirm|decline)-late-request-need$/.test(String(url)))return original(url,init);window.queryAttempts.push({key:init.headers["Idempotency-Key"],body:init.body});'+(s.case==='recovery'?'if(window.queryAttempts.length===1)throw new TypeError("network");':'await new Promise(resolve=>window.releaseQuery=resolve);')+'return original(url,init);};})()');
 await tap(selector);
 if(s.case==='recovery'){
  await wait('!!document.querySelector(".zipco-lq-rec")');assert.equal(await evaluate('document.querySelector(".zipco-lq-no").disabled'),true);
  await tap('.zipco-lq-rec button');await c.delay(250);assert.equal(await evaluate('window.queryAttempts.length'),1);
  await tap(selector);
 }else{
  await wait('!!window.releaseQuery');assert.equal(await evaluate('document.querySelector("'+selector+'").dataset.waiting'),'true');assert.equal(await evaluate('document.querySelector(".zipco-lq-yes").disabled&&document.querySelector(".zipco-lq-no").disabled'),true);
  assert.equal(await evaluate('window.queryAttempts.length'),1);await evaluate('window.releaseQuery()');
 }
 await wait('!!document.querySelector(".zipco-toast-action")');await tap('.zipco-toast-action');await wait('window.currentView==="'+(yes?'pending':'history')+'"');
 const posts=await evaluate('window.flowCalls.filter(x=>x.method==="POST")');assert.equal(posts.length,1);assert(posts[0].url.endsWith(yes?'confirm-late-request-need':'decline-late-request-need'));
 if(s.case==='recovery')assert.equal(await evaluate('window.queryAttempts[0].key===window.queryAttempts[1].key&&window.queryAttempts[0].body===window.queryAttempts[1].body'),true);
 if(yes)assert((await evaluate('document.querySelector(".zipco-late-card").textContent')).includes('Falta acordar una nueva hora'));
},process.argv.slice(2));

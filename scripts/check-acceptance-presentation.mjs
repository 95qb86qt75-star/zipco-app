// Reuse the checkout/availability fixture and real presentation; all transport is synthetic.
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
let driver=fs.readFileSync('scripts/check-availability-status-flow.mjs','utf8');
const end=driver.indexOf('const generated=');if(end<0)throw Error('Availability adapter changed');
driver=driver.slice(0,end);
const tests=String.raw`
  const until=async expression=>{for(let i=0;i<220;i++){if(await evaluate(expression))return;await delay(50);}throw Error('Timeout '+expression+' / '+await evaluate('document.body.textContent'));};
  const physical=async selector=>{
    await evaluate('document.querySelector('+JSON.stringify(selector)+').scrollIntoView({block:"center",behavior:"instant"})');await delay(100);
    const point=await evaluate('(()=>{const el=document.querySelector('+JSON.stringify(selector)+'),r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;return{x,y,hit:el.contains(document.elementFromPoint(x,y))};})()');assert.equal(point.hit,true,'Control receives the physical tap');
    await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point.x,y:point.y}]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(80);
  };
  await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  const results=[];
  for(const {width,height} of [{width:393,height:844},{width:320,height:844},{width:393,height:540}]){
    await create(width);await confirmButton();await click('.zipco-av-channel-whatsapp');await wait('document.body.textContent.includes("Esperando al cliente")');await role('customer');await wait('document.body.textContent.includes("DISPONIBLE")');
    const before=await evaluate('document.querySelector(".zipco-status-flow").getBoundingClientRect().height');
    await evaluate('(()=>{const real=window.fetch;window.fetch=async(...args)=>{if(String(args[0]).endsWith("/continue-request"))await new Promise(r=>window.releaseContinue=r);return real(...args);};})()');
    await evaluate('(()=>{const b=[...document.querySelectorAll("button")].find(b=>b.textContent.includes("Sí, continuar con la compra"));b.dataset.testContinue="true";})()');await physical('[data-test-continue]');
    await until('document.querySelector(".zipco-status-flow")?.dataset.stage==="saving"');
    const saving=await evaluate('(()=>{const root=document.querySelector(".zipco-status-flow"),source=root.querySelector(".zipco-status-source"),result=root.querySelector(".zipco-status-result");return{height:root.getBoundingClientRect().height,resultHeight:result.getBoundingClientRect().height,sourceVisible:getComputedStyle(source).display!=="none",inert:source.inert};})()');
    assert(Math.abs(saving.height-before)<1,'saving keeps the original height');assert(saving.resultHeight<180,'saving status stays compact');assert(saving.sourceVisible&&saving.inert,'original card remains rendered and locked');await shot('saving-'+width);
    await evaluate('window.releaseContinue()');await until('document.querySelector(".zipco-ah")?.textContent.includes("Solicitud confirmada")');await shot('hologram-'+width);
    await until('!document.querySelector(".zipco-ah")&&!!document.querySelector(".zipco-status-result")');
    const success=await evaluate('({height:document.querySelector(".zipco-status-flow").getBoundingClientRect().height,text:document.querySelector(".zipco-status-result").textContent,compact:document.querySelector(".zipco-status-result").getBoundingClientRect().height<180})');
    assert(success.height<=before+1,'success never grows beyond the source while exiting');assert(success.text.includes('Solicitud confirmada')&&!success.text.includes('Falta coordinar'));assert(success.compact);await shot('confirmed-'+width);
    await until('!!document.querySelector(".zipco-toast-action")');assert.equal(await evaluate('window.currentView'),'waiting');
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});
    const toast=await evaluate('document.querySelector(".zipco-toast").textContent');assert(toast.includes('Solicitud confirmada')&&!toast.includes('aún falta coordinar'));assert.equal(await evaluate('window.flowCalls.filter(c=>c.method==="POST").length'),3);
    await physical('.zipco-toast-action');await until('window.currentView==="coordination"&&!!document.querySelector("#order-20.zipco-co-dk")');await delay(700);
    const destination=await evaluate('(()=>{const card=document.querySelector("#order-20"),scroller=document.querySelector("[data-requests-scroll]"),r=card.getBoundingClientRect(),s=scroller.getBoundingClientRect();return{top:r.top,listTop:s.top,scrollY:window.scrollY,highlight:card.dataset.arrived,text:card.textContent,posts:window.flowCalls.filter(c=>c.method==="POST").length};})()');
    assert(destination.top>=destination.listTop+10&&destination.top<=destination.listTop+16,'Ver aligns the complete card header below the fixed app header');assert.equal(destination.scrollY,0);assert.equal(destination.posts,3);assert.equal(destination.highlight,'true');assert(destination.text.includes('Ya puedes coordinar por WhatsApp'));await shot('arrival-'+width);
    results.push({width,height,before,saving,success,destination});
  }
  console.log(JSON.stringify({passed:results.length,results,realMutations:0,transport:'synthetic'}));
}finally{socket?.close();browser.kill();await server.close();}
`;
driver+=String.raw`
const testStart=source.indexOf('  const results=[];');if(testStart<0)throw Error('Checkout fixture changed');
source=source.slice(0,testStart).replaceAll('availability-status-flow','acceptance-presentation');
source=source.replace('<main data-view={view}', '<header style={{position:"fixed",top:0,height:180,left:0,right:0,background:"white",zIndex:20}}>Solicitudes · Mis Pedidos</header><main data-requests-scroll data-view={view}');
source=source.replace("padding:16,paddingTop:70,minHeight:'100dvh',background:'#f1f3fa'","padding:16,paddingBottom:160,position:'fixed',top:180,bottom:70,left:0,right:0,overflowY:'auto',background:'#f1f3fa'");
source=source.replace("{actor==='checkout'?", "<div data-fixture-list-controls style={{height:320}}>Resumen de solicitudes</div>{actor==='checkout'?");
source=source.replace('</main><ActionHologramHost/>','<div data-summary-scroll-space aria-hidden="true"/></main><ActionHologramHost/>');
`;
driver+='source+='+JSON.stringify(tests)+';\n';
driver+="const generated=path.resolve('node_modules/.cache/acceptance-presentation-runner.mjs');fs.writeFileSync(generated,source);await import(pathToFileURL(generated).href);";
const generated=path.resolve('node_modules/.cache/acceptance-presentation-driver.mjs');fs.writeFileSync(generated,driver);await import(pathToFileURL(generated).href);

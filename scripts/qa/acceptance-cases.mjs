export const acceptanceCases = [
  { case: 'acceptance', role: 'customer', width: 393, height: 844 },
  { case: 'acceptance', role: 'customer', width: 320, height: 844 },
  { case: 'short-viewport', role: 'customer', width: 393, height: 540 },
];

export async function runAcceptanceCase(ctx, spec, negative) {
  const { assert, evaluate, send, wait, delay, tap } = ctx;
  const clickLabel = async label => {
    const selector = await evaluate('(()=>{const root=document.querySelector("[role=alertdialog]")??[...document.querySelectorAll("[role=dialog]")].at(-1)??document;const b=[...root.querySelectorAll("button")].find(b=>(b.querySelector(".zipco-accept-label")?.textContent??b.textContent).trim()===' + JSON.stringify(label) + ');if(!b)throw Error("Missing label");b.dataset.qaLabel="active";return "[data-qa-label=active]";})()');
    await tap(selector); await evaluate('document.querySelector("[data-qa-label=active]")?.removeAttribute("data-qa-label")');
  };
  const role = async name => {
    await wait('!document.querySelector(".zipco-status-result")');
    if (await evaluate('!!document.querySelector(".zipco-toast-action")')) await tap('.zipco-toast-action');
    await evaluate('window.switchRole(' + JSON.stringify(name) + ')'); await delay(250);
  };
  await ctx.visit('', spec.width, 844);
  await clickLabel('Ahora'); await clickLabel('Requiero este producto'); await clickLabel('Enviar solicitud');
  await wait('document.body.textContent.includes("EN ESPERA")||document.body.textContent.includes("Enviar sin verificar el horario")');
  if (await evaluate('document.body.textContent.includes("Enviar sin verificar el horario")')) await clickLabel('Enviar sin verificar el horario');
  await wait('document.body.textContent.includes("EN ESPERA")'); await role('business'); await wait('document.body.textContent.includes("NUEVO PEDIDO")');
  await tap('.zipco-av-business-actions .zipco-accept-btn'); await wait('!!document.querySelector("[role=dialog]")');
  await tap('.zipco-av-channel-whatsapp');
  await wait('!!document.querySelector(".zipco-toast-action")'); await tap('.zipco-toast-action');
  await wait('document.body.textContent.includes("Esperando al cliente")');
  await role('customer'); await wait('document.body.textContent.includes("DISPONIBLE")');
  const before = await evaluate('document.querySelector(".zipco-status-flow").getBoundingClientRect().height');
  await evaluate('(()=>{const real=window.fetch;window.fetch=async(...args)=>{if(String(args[0]).endsWith("/continue-request"))await new Promise(r=>window.releaseContinue=r);return real(...args);};})()');
  await clickLabel('Sí, continuar con la compra'); await wait('document.querySelector(".zipco-status-flow")?.dataset.stage==="saving"');
  const saving = await evaluate('(()=>{const root=document.querySelector(".zipco-status-flow"),source=root.querySelector(".zipco-status-source"),result=root.querySelector(".zipco-status-result");return{height:root.getBoundingClientRect().height,resultHeight:result.getBoundingClientRect().height,sourceVisible:getComputedStyle(source).display!=="none",inert:source.inert};})()');
  assert(Math.abs(saving.height - before) < 1); assert(saving.resultHeight < 180); assert(saving.sourceVisible && saving.inert);
  await evaluate('window.releaseContinue()'); await wait('document.querySelector(".zipco-ah")?.textContent.includes("Solicitud confirmada")===true');
  await wait('!document.querySelector(".zipco-ah")&&!!document.querySelector(".zipco-status-result")');
  const success = await evaluate('({height:document.querySelector(".zipco-status-flow").getBoundingClientRect().height,text:document.querySelector(".zipco-status-result").textContent,compact:document.querySelector(".zipco-status-result").getBoundingClientRect().height<180})');
  assert(success.height <= before + 1); assert(success.text.includes('Solicitud confirmada') && !success.text.includes('Falta coordinar')); assert(success.compact);
  await wait('!!document.querySelector(".zipco-toast-action")'); assert.equal(await evaluate('window.currentView'), 'waiting');
  await send('Emulation.setDeviceMetricsOverride', { width: spec.width, height: spec.height, deviceScaleFactor: 1, mobile: true });
  if (negative === 'toast') await evaluate('document.querySelector(".zipco-toast b").textContent="Falta coordinar"');
  const toast = await evaluate('document.querySelector(".zipco-toast").textContent');
  assert(toast.includes('Solicitud confirmada') && !toast.includes('aún falta coordinar'));
  assert.equal(await evaluate('window.flowCalls.filter(c=>c.method==="POST").length'), 3);
  if (negative === 'scroll') await evaluate('document.querySelector("[data-requests-scroll]").scrollTo=()=>{}');
  await tap('.zipco-toast-action'); await wait('window.currentView==="coordination"&&!!document.querySelector("#order-20.zipco-co-dk")'); await delay(700);
  const destination = await evaluate('(()=>{const card=document.querySelector("#order-20"),scroller=document.querySelector("[data-requests-scroll]"),r=card.getBoundingClientRect(),s=scroller.getBoundingClientRect();return{top:r.top,listTop:s.top,scrollY:window.scrollY,highlight:card.dataset.arrived,text:card.textContent,posts:window.flowCalls.filter(c=>c.method==="POST").length};})()');
  assert(destination.top >= destination.listTop + 10 && destination.top <= destination.listTop + 16);
  assert.equal(destination.scrollY, 0); assert.equal(destination.posts, 3); assert.equal(destination.highlight, 'true');
  assert(destination.text.includes('Ya puedes coordinar por WhatsApp'));
  return { before, saving, success, destination };
}

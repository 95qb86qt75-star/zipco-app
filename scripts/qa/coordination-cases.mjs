export const coordinationCases = [
  ...[393, 320].flatMap(width => ['controls', 'declined'].map(name => ({ case: name, role: 'customer', width, height: 852 }))),
  { case: 'disabled', role: 'customer', width: 393, height: 852 },
  { case: 'reveal', role: 'customer', width: 393, height: 852, confirm: true, reduce: false },
  { case: 'reveal', role: 'customer', width: 320, height: 852, confirm: false, reduce: true },
  { case: 'fits', role: 'customer', width: 393, height: 1400 },
  ...['controls', 'declined', 'ready'].map(name => ({ case: name, role: 'business', width: 393, height: 852 })),
];

export async function runCoordinationCase(ctx, spec, negative) {
  const { assert, evaluate, send, wait, delay, tap } = ctx;
  const business = spec.role === 'business', disabled = spec.case === 'disabled';
  await send('Emulation.setEmulatedMedia', { features: spec.reduce ? [{ name: 'prefers-reduced-motion', value: 'reduce' }] : [] });
  const query = 'details=1&navigate=1' + (business ? '&business=1' : '') +
    (spec.case === 'ready' ? '&before=1' : '') + (disabled ? '&no-open=1' : '');
  await ctx.visit(query, spec.width, spec.height);
  if (negative === 'pointer-events') await evaluate('(()=>{const s=document.createElement("style");s.textContent=".zipco-customer-coordination-detail button{pointer-events:none!important}";document.head.append(s);})()');
  if (negative === 'duplicate-open') await evaluate('(()=>{const real=window.fetch;window.fetch=async(i,o)=>{const result=await real(i,o);if(o?.method==="POST"&&String(i).endsWith("/open-whatsapp"))await real(i,o);return result;};})()');
  const detailButton = '#order-20 .zipco-avw-query-detail';
  const closeDialog = () => tap('[role=dialog] button[aria-label="Cerrar"],[role=dialog] button[aria-label="Cerrar detalle"]');
  const openDetail = async () => { await tap(detailButton); await wait('document.querySelector("#order-20")?.dataset.expanded==="true"'); await delay(450); };
  const conditions = async () => {
    const posts = await evaluate('window.posts.length');
    await tap(business ? '#order-20 .zipco-co-strip2' : '#order-20 .zipco-customer-conditions');
    await wait('!!document.querySelector("[role=dialog]")'); assert.equal(await evaluate('window.posts.length'), posts);
    await closeDialog(); await wait('!document.querySelector("[role=dialog]")');
  };
  const options = async () => {
    const posts = await evaluate('window.posts.length');
    await tap('#order-20 .zipco-customer-coordination-controls button:last-child');
    await wait('document.querySelector("#order-20 .zipco-customer-coordination-fold")?.dataset.open==="true"');
    assert.equal(await evaluate('document.querySelector("#order-20 .zipco-customer-coordination-fold").inert'), false);
    assert.equal(await evaluate('window.posts.length'), posts);
    await tap('#order-20 .zipco-customer-coordination-controls button:last-child');
    await wait('document.querySelector("#order-20 .zipco-customer-coordination-fold")?.inert===true');
  };
  if (spec.case === 'reveal' || spec.case === 'fits') {
    if (spec.confirm) await tap('#order-20 .zipco-avw-query-no');
    await evaluate('(()=>{const s=document.querySelector("[data-requests-scroll]");s.style.cssText="position:fixed;top:200px;bottom:70px;left:0;right:0;overflow:auto;padding:12px 16px 160px";const intro=document.createElement("div");intro.style.height="230px";s.prepend(intro);const spacer=document.createElement("div");spacer.dataset.summaryScrollSpace="";s.append(spacer);s.scrollTop=0;window.scrollTo(0,0);const native=s.scrollTo.bind(s);window.revealScrolls=[];s.scrollTo=options=>{window.revealScrolls.push(options);native(options);};})()');
    await tap(detailButton, false); await wait('document.querySelector("#order-20")?.dataset.expanded==="true"'); await delay(950);
    const p = await evaluate('(()=>{const c=document.querySelector("#order-20"),s=document.querySelector("[data-requests-scroll]");return{scrollTop:s.scrollTop,top:c.getBoundingClientRect().top,listTop:s.getBoundingClientRect().top,detailTop:c.querySelector(".zipco-avw-query-body").getBoundingClientRect().top,listBottom:s.getBoundingClientRect().bottom,mode:c.dataset.mode,calls:window.revealScrolls.length,behavior:window.revealScrolls[0]?.behavior,posts:window.posts.length,windowY:window.scrollY};})()');
    assert.equal(p.posts, 0); assert.equal(p.windowY, 0); assert.equal(p.mode, spec.confirm ? 'confirm' : 'question');
    if (spec.case === 'fits') { assert.equal(p.calls, 0); assert.equal(p.scrollTop, 0); }
    else { assert(p.scrollTop > 40); assert(p.top >= p.listTop + 10 && p.top <= p.listTop + 16); assert(p.detailTop < p.listBottom - 40); assert.equal(p.calls, 1); assert.equal(p.behavior, spec.reduce ? 'instant' : 'smooth'); }
    await tap(detailButton, false); await wait('document.querySelector("#order-20")?.dataset.expanded==="false"'); await delay(550);
    assert.equal(await evaluate('window.revealScrolls.length'), p.calls); assert.equal(await evaluate('window.posts.length'), 0);
    return;
  }
  if (spec.case === 'declined') {
    await tap('#order-20 .zipco-avw-query-no'); await tap('#order-20 .zipco-avw-query-yes');
    await wait('document.querySelector("#order-20")?.dataset.mode==="declined"');
    await wait('!!document.querySelector(".zipco-toast")'); await tap('.zipco-toast-close');
  }
  if (spec.case === 'ready') { await tap('#order-20 .zipco-co-colrow'); await delay(500); }
  else await openDetail();
  const initial = await evaluate('window.posts.length');
  assert.equal(initial, spec.case === 'declined' ? 1 : 0);
  await conditions();
  if (business) {
    await tap('#order-20 .zipco-co-lk.rose');
    await wait('document.querySelector("[role=dialog]")?.textContent.includes("¿Por qué la anulas?")===true');
    assert.equal(await evaluate('window.posts.length'), initial); await closeDialog(); await wait('!document.querySelector("[role=dialog]")');
  } else {
    await options();
    if (spec.case === 'controls') {
      await tap(detailButton); await delay(500);
      assert.equal(await evaluate('document.querySelector("#order-20 .zipco-avw-reveal").inert'), true);
      assert.equal(await evaluate('getComputedStyle(document.querySelector("#order-20 .zipco-customer-coordination-open")).pointerEvents'), 'none');
      await openDetail();
    }
  }
  const openButton = business ? '#order-20 .zipco-co-go' : '#order-20 .zipco-customer-coordination-open';
  if (disabled) {
    assert.equal(await evaluate('document.querySelector("' + openButton + '").disabled'), true);
    await tap(openButton); assert.equal(await evaluate('window.posts.length'), 0);
    return;
  }
  await tap(openButton); await wait('!!document.querySelector(".zipco-ah")'); await wait('window.navigations.length===1');
  assert.equal(await evaluate('window.posts.length'), initial + 1);
  assert.equal(await evaluate('window.posts.at(-1).url.endsWith("/open-whatsapp")'), true);
  await evaluate('window.departWhatsapp();window.resumeWhatsapp()');
  if (spec.case === 'declined') await wait('document.querySelector("#order-20")?.dataset.mode==="question"');
}

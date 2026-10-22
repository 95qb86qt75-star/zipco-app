import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ slots: [] as any[], cursor: 0, run: vi.fn(), update: vi.fn(), retry: vi.fn(), announce:vi.fn(),release:vi.fn(),prompt:null as any,actor:true, latest: null as any, busy: false, recovery: false, pending: false }));
vi.mock('./useStartWorkPrompt',()=>({default:(props:unknown)=>{state.prompt=props;return state.release;}}));
vi.mock('./ActionHologram',()=>({announceAction:state.announce}));
vi.mock('react', async original => ({ ...await original<typeof import('react')>(),
  useState: (initial: any) => { const i=state.cursor++; if (!(i in state.slots)) state.slots[i]=initial; return [state.slots[i], (v:any)=>state.slots[i]=typeof v==='function'?v(state.slots[i]):v]; },
  useRef: (initial:any) => { const i=state.cursor++; return state.slots[i] ??= {current:initial}; }, useEffect: vi.fn(),
}));
vi.mock('./useCoordination', () => ({ default: (_order:unknown,business:boolean) => {state.actor=business;return { busy:state.busy, message:'', needsUpdate:state.recovery, storageWarning:()=>'', restored:()=>false,
  pending:()=>state.pending?{}:null, run:state.run, update:state.update, retry:state.retry, currentOrder:()=>state.latest };} }));
import BusinessCoordinationCard from './BusinessCoordinationCard';
import { AnnulSheet, ConditionsSheet, StartWorkSheet } from './CoordinationSheets';
import { rawOrder, coordinationProcess, agreementFixture } from './requestProcessFixtures';
import { normalizeBusinessOrdersPayload, normalizeMyOrdersPayload } from './orderNormalization';
import type { BusinessRequest,MyOrder } from './types';
type Node = React.ReactElement<any>;
const nodes=(root:React.ReactNode):Node[]=>React.Children.toArray(root).flatMap(n=>React.isValidElement(n)?[n,...nodes((n.props as any).children)]:[]);
function order(authorized=false, actions=['AUTHORIZE_CONTACT','OPEN_WHATSAPP','START_WORK','ANNUL_COORDINATION']) {
  return normalizeBusinessOrdersPayload([{...rawOrder,status:'accepted',requestProcess:{...coordinationProcess,
    coordination:{businessContactAuthorized:authorized,customerContactAuthorized:false},allowedActions:actions}}])[0];
}
const render=(input:BusinessRequest|MyOrder=order(),business=true)=>{state.cursor=0;return BusinessCoordinationCard({order:input,business,name:business?'Cliente QA':'Negocio QA',price:12000,statusLabel:'Coordinación pendiente',
  negotiated:true,acceptedAt:agreementFixture.confirmedAt,accepted:agreementFixture,conditionsTitle:'Producto QA',conditionsSubtitle:'',conditionsWhen:'Ahora',conditionsSummary:'Producto QA · Ahora',onOpenAgreement:vi.fn(),refresh:vi.fn()});};
const click=(view:React.ReactNode,text:string)=>{const n=nodes(view).find(n=>n.type==='button'&&renderToStaticMarkup(n).includes(text));expect(n).toBeDefined();return n!.props.onClick();};
beforeEach(()=>{vi.useFakeTimers();state.slots=[];state.cursor=0;state.latest=null;state.busy=false;state.recovery=false;state.pending=false;state.prompt=null;state.release.mockReset();state.announce.mockReset();state.run.mockReset().mockResolvedValue(false);state.update.mockReset();state.retry.mockReset();vi.stubGlobal('React',React);const events=new EventTarget();vi.stubGlobal('window',{matchMedia:()=>({matches:true}),setTimeout,clearTimeout,dispatchEvent:events.dispatchEvent.bind(events)});});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
it('does not authorize locally when the permission is absent',async()=>{
 const view=render(order(false,['OPEN_WHATSAPP']));expect(nodes(view).find(n=>n.type==='button'&&renderToStaticMarkup(n).includes('Autorizo comenzar'))?.props.disabled).toBe(true);
 await click(view,'Autorizo comenzar');expect(state.run).not.toHaveBeenCalled();expect(renderToStaticMarkup(render())).not.toContain('Coordinación autorizada');
});
it.each([false,true])('requires an authoritative own consent after the POST, including read failure (run=%s)',async result=>{
 state.run.mockResolvedValue(result);await click(render(),'Autorizo comenzar');expect(renderToStaticMarkup(render())).not.toContain('Coordinación autorizada');
 expect(nodes(render()).find(n=>n.type==='button'&&renderToStaticMarkup(n).includes('Iniciar coordinación'))?.props.disabled).toBe(true);
});
it('keeps independent client consent and only unlocks WhatsApp after verified authorization and decoration',async()=>{
 const original=order();state.latest={...order(true),requestProcess:{...order(true).requestProcess!,version:coordinationProcess.version+1}};state.run.mockResolvedValue(true);
 await click(render(original),'Autorizo comenzar');expect(state.run).toHaveBeenCalledTimes(1);
 let view=render(original);expect(renderToStaticMarkup(view)).toContain('Coordinación autorizada');expect(renderToStaticMarkup(view)).toContain('Preparando WhatsApp');
 click(view,'Ocultar tarjeta');view=render(original);expect(renderToStaticMarkup(view)).toContain('Preparando WhatsApp');
 vi.advanceTimersByTime(500);view=render(original);click(view,'Mostrar coordinación');view=render(original);
 await click(view,'Iniciar coordinación');expect(state.run).toHaveBeenLastCalledWith('OPEN_WHATSAPP','COORDINATION_NOT_REACHED','');
 expect(renderToStaticMarkup(view)).toContain('ZIPCO no procesa ni verifica pagos.');
});
it('blocks a rapid second authorization before React renders',async()=>{
 let resolve!:(v:boolean)=>void;state.run.mockReturnValue(new Promise<boolean>(r=>resolve=r));const view=render();const first=click(view,'Autorizo comenzar');await click(view,'Autorizo comenzar');expect(state.run).toHaveBeenCalledTimes(1);resolve(false);await first;
});
it.each(['recovery','pending'] as const)('preserves %s without a new action',key=>{
 state[key]=true;const view=render();expect(renderToStaticMarkup(view)).not.toContain('Autorizo comenzar coordinación');click(view,key==='recovery'?'Actualizar estado':'Reintentar operación pendiente');expect(state[key==='recovery'?'update':'retry']).toHaveBeenCalledOnce();expect(state.run).not.toHaveBeenCalled();
});
it('opens condition and annulment sheets without submitting and retains server reasons',()=>{
 let view=render();click(view,'Condiciones aceptadas');view=render();expect(nodes(view).find(n=>n.type===ConditionsSheet)?.props.open).toBe(true);
 click(view,'Anular solicitud');view=render();const sheet=nodes(view).find(n=>n.type===AnnulSheet)!;expect(sheet.props.open).toBe(true);expect(sheet.props.reasons).toHaveLength(3);expect(state.run).not.toHaveBeenCalled();
});
const customer=(own=false,other=true)=>normalizeMyOrdersPayload([{...rawOrder,status:'accepted',requestProcess:{...coordinationProcess,
 coordination:{customerContactAuthorized:own,businessContactAuthorized:other},allowedActions:['AUTHORIZE_CONTACT','OPEN_WHATSAPP','ANNUL_COORDINATION','START_WORK']}}])[0];
it('renders the customer card with its consent button, defer option, annulment and no business work action',()=>{
 const view=render(customer(),false);const html=renderToStaticMarkup(view);expect(state.actor).toBe(false);
 expect(view.props['data-coordination-role']).toBe('customer');expect(html).toContain('Autorizo iniciar coordinación');expect(html).toContain('Ahora no');
 expect(html).toContain('Anular solicitud');expect(html).toContain('zipco-contact-consent');expect(html).not.toContain('comenzar pedido');
 click(view,'Ahora no');expect(state.run).not.toHaveBeenCalled();const deferred=render(customer(),false);expect(renderToStaticMarkup(deferred)).toContain('Revisar autorización de contacto');
 click(deferred,'Revisar autorización de contacto');expect(renderToStaticMarkup(render(customer(),false))).toContain('Autorizo iniciar coordinación');
});
it('does not confuse business consent with customer consent, including a successful POST without verified customer authorization',async()=>{
 const input=customer(false,true);state.run.mockResolvedValue(true);state.latest=input;
 await click(render(input,false),'Autorizo iniciar coordinación');expect(renderToStaticMarkup(render(input,false))).not.toContain('Coordinación autorizada');
 expect(state.actor).toBe(false);expect(state.run).toHaveBeenCalledWith('AUTHORIZE_CONTACT','COORDINATION_NOT_REACHED','');
});
it('uses verified customer consent for progress and keeps WhatsApp independently permission gated',async()=>{
 const input=customer(false,false);state.run.mockResolvedValue(true);
 state.latest={...customer(true,false),requestProcess:{...customer(true,false).requestProcess!,version:coordinationProcess.version+1,allowedActions:['ANNUL_COORDINATION']}};
 await click(render(input,false),'Autorizo iniciar coordinación');let view=render(input,false);expect(renderToStaticMarkup(view)).toContain('Preparando WhatsApp');
 vi.advanceTimersByTime(500);view=render(input,false);expect(renderToStaticMarkup(view)).toContain('Esperando autorización de contacto del negocio.');
 expect(nodes(view).find(n=>n.type==='button'&&renderToStaticMarkup(n).includes('Iniciar coordinación por WhatsApp'))?.props.disabled).toBe(true);
 await click(view,'Iniciar coordinación por WhatsApp');expect(state.run).toHaveBeenCalledTimes(1);
});
it('shows the progress and button growth before the authorization hologram instead of covering both',async()=>{
 window.matchMedia=()=>({matches:false}) as MediaQueryList;const original=order();state.run.mockResolvedValue(true);
 state.latest={...order(true),requestProcess:{...order(true).requestProcess!,version:coordinationProcess.version+1}};
 await click(render(original),'Autorizo comenzar');render(original);vi.advanceTimersByTime(3900);render(original);
 expect(state.announce).not.toHaveBeenCalled();vi.advanceTimersByTime(2899);expect(state.announce).not.toHaveBeenCalled();
 vi.advanceTimersByTime(1);expect(state.announce).toHaveBeenCalledWith('authorized',expect.objectContaining({key:expect.any(String)}));
});
it('does not let a delayed authorization notice replace a newer WhatsApp action',async()=>{
 window.matchMedia=()=>({matches:false}) as MediaQueryList;const original=order();state.run.mockResolvedValue(true);
 state.latest={...order(true),requestProcess:{...order(true).requestProcess!,version:coordinationProcess.version+1}};
 await click(render(original),'Autorizo comenzar');render(original);vi.advanceTimersByTime(3900);await click(render(original),'Iniciar coordinación');
 vi.advanceTimersByTime(3000);expect(state.announce).not.toHaveBeenCalled();
});
const coordinating=()=>({...order(true),requestProcess:{...order(true).requestProcess!,state:'COORDINATING'}});
it('offers the delayed sheet only to the business in the server-permitted coordinating state',()=>{
 render(coordinating());expect(state.prompt.enabled).toBe(true);expect(nodes(render(coordinating())).some(n=>n.type==='button'&&renderToStaticMarkup(n).includes('comenzar pedido'))).toBe(false);
 render(order());expect(state.prompt.enabled).toBe(false);const clientView=render(customer(true,true),false);expect(state.prompt.enabled).toBe(false);expect(nodes(clientView).some(n=>n.type===StartWorkSheet)).toBe(false);
});
it('opens confirmation without POST, closes No without POST, and requires explicit Yes',async()=>{
 render(coordinating());state.prompt.onOpen();let view=render(coordinating());let sheet=nodes(view).find(n=>n.type===StartWorkSheet)!;expect(sheet.props.open).toBe(true);expect(state.run).not.toHaveBeenCalled();
 sheet.props.onOpenChange(false);expect(state.run).not.toHaveBeenCalled();expect(state.release).toHaveBeenCalled();
 render(coordinating());state.prompt.onOpen();view=render(coordinating());sheet=nodes(view).find(n=>n.type===StartWorkSheet)!;
 await sheet.props.onConfirm();expect(state.run).toHaveBeenCalledWith('START_WORK','COORDINATION_NOT_REACHED','');expect(nodes(render(coordinating())).find(n=>n.type===StartWorkSheet)?.props.open).toBe(true);
});
it('blocks double confirmation and retains the sheet when submission fails',async()=>{
 render(coordinating());state.prompt.onOpen();let resolve!:(value:boolean)=>void;state.run.mockReturnValue(new Promise<boolean>(r=>resolve=r));
 const sheet=nodes(render(coordinating())).find(n=>n.type===StartWorkSheet)!;sheet.props.onConfirm();sheet.props.onConfirm();expect(state.run).toHaveBeenCalledTimes(1);
 resolve(false);await Promise.resolve();expect(nodes(render(coordinating())).find(n=>n.type===StartWorkSheet)?.props.open).toBe(true);
});
it('offers reconciliation or the exact pending retry within the confirmation sheet',()=>{
 render(coordinating());state.prompt.onOpen();state.pending=true;let sheet=nodes(render(coordinating())).find(n=>n.type===StartWorkSheet)!;expect(renderToStaticMarkup(sheet.props.recovery)).toContain('Reintentar operación pendiente');
 state.pending=false;state.recovery=true;sheet=nodes(render(coordinating())).find(n=>n.type===StartWorkSheet)!;expect(renderToStaticMarkup(sheet.props.recovery)).toContain('Actualizar estado');
});
it('retains the folded body while making all its controls inaccessible',()=>{
 click(render(),'Ocultar tarjeta');const view=render();const body=nodes(view).find(n=>n.props.className==='zipco-co-fb')!;
 expect(body.props['data-folded']).toBe(true);expect(body.props['aria-hidden']).toBe(true);expect(body.props.inert).toBe('');
 expect(nodes(body).some(n=>n.type==='button'&&renderToStaticMarkup(n).includes('Autorizo comenzar'))).toBe(true);expect(state.run).not.toHaveBeenCalled();
});

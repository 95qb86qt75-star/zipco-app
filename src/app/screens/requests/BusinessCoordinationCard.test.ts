import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ slots: [] as any[], cursor: 0, run: vi.fn(), update: vi.fn(), retry: vi.fn(), latest: null as any, busy: false, recovery: false, pending: false }));
vi.mock('react', async original => ({ ...await original<typeof import('react')>(),
  useState: (initial: any) => { const i=state.cursor++; if (!(i in state.slots)) state.slots[i]=initial; return [state.slots[i], (v:any)=>state.slots[i]=typeof v==='function'?v(state.slots[i]):v]; },
  useRef: (initial:any) => { const i=state.cursor++; return state.slots[i] ??= {current:initial}; }, useEffect: vi.fn(),
}));
vi.mock('./useCoordination', () => ({ default: () => ({ busy:state.busy, message:'', needsUpdate:state.recovery, storageWarning:()=>'', restored:()=>false,
  pending:()=>state.pending?{}:null, run:state.run, update:state.update, retry:state.retry, currentOrder:()=>state.latest }) }));
import BusinessCoordinationCard from './BusinessCoordinationCard';
import { AnnulSheet, ConditionsSheet } from './CoordinationSheets';
import { rawOrder, coordinationProcess, agreementFixture } from './requestProcessFixtures';
import { normalizeBusinessOrdersPayload } from './orderNormalization';
type Node = React.ReactElement<any>;
const nodes=(root:React.ReactNode):Node[]=>React.Children.toArray(root).flatMap(n=>React.isValidElement(n)?[n,...nodes((n.props as any).children)]:[]);
function order(authorized=false, actions=['AUTHORIZE_CONTACT','OPEN_WHATSAPP','START_WORK','ANNUL_COORDINATION']) {
  return normalizeBusinessOrdersPayload([{...rawOrder,status:'accepted',requestProcess:{...coordinationProcess,
    coordination:{businessContactAuthorized:authorized,customerContactAuthorized:false},allowedActions:actions}}])[0];
}
const render=(input=order())=>{state.cursor=0;return BusinessCoordinationCard({order:input,name:'Cliente QA',price:12000,statusLabel:'Coordinación pendiente',
  negotiated:true,acceptedAt:agreementFixture.confirmedAt,accepted:agreementFixture,conditionsTitle:'Producto QA',conditionsSubtitle:'',conditionsWhen:'Ahora',conditionsSummary:'Producto QA · Ahora',onOpenAgreement:vi.fn(),refresh:vi.fn()});};
const click=(view:React.ReactNode,text:string)=>{const n=nodes(view).find(n=>n.type==='button'&&renderToStaticMarkup(n).includes(text));expect(n).toBeDefined();return n!.props.onClick();};
beforeEach(()=>{vi.useFakeTimers();state.slots=[];state.cursor=0;state.latest=null;state.busy=false;state.recovery=false;state.pending=false;state.run.mockReset().mockResolvedValue(false);state.update.mockReset();state.retry.mockReset();vi.stubGlobal('React',React);vi.stubGlobal('window',{matchMedia:()=>({matches:true}),setTimeout,clearTimeout});});
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

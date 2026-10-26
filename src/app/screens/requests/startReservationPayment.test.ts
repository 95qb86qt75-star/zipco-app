import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const state=vi.hoisted(()=>({read:vi.fn(),send:vi.fn(),session:{userId:'1',businessId:null,token:'synthetic',revision:1} as object|null}));
vi.mock('./coordinationApi',()=>({refreshCoordinationOrder:state.read}));
vi.mock('./coordinationSession',()=>({readCoordinationSession:()=>state.session,operationScope:()=> 'customer-test-only'}));
vi.mock('./reservationApi',async load=>({...await load<typeof import('./reservationApi')>(),sendReservationAction:state.send}));
import {startReservationPayment} from './startReservationPayment';
import {simplePaidPending} from './simplifiedReservationFixtures';
import {createReservationIntents} from './reservationIntent';
vi.mock('./reservationIntent',async load=>({...await load<typeof import('./reservationIntent')>(),reservationIntents:()=>intents}));
let intents:ReturnType<typeof createReservationIntents>,markers:Map<string,string>;
const order=()=>({id:20,status:'accepted',recordState:'available',requestProcess:simplePaidPending});
beforeEach(()=>{
  markers=new Map();state.session={userId:'1',businessId:null,token:'synthetic',revision:1};state.read.mockReset().mockImplementation(()=>Promise.resolve(order()));state.send.mockReset().mockResolvedValue({navigation:'https://wa.me/56900000000?text=Reserva',receipt:{orderId:20,orderStatus:'accepted',requestProcess:{...simplePaidPending,version:5}}});
  intents=createReservationIntents(undefined,()=>crypto.randomUUID(),async()=> 'a'.repeat(64));
  vi.stubGlobal('sessionStorage',{getItem:(k:string)=>markers.get(k)??null,setItem:(k:string,v:string)=>markers.set(k,v)});
});
afterEach(()=>vi.unstubAllGlobals());
it('opens only with server navigation after a confirmed customer decision and fresh authorized reads',async()=>{
  state.read.mockResolvedValueOnce(order()).mockResolvedValueOnce({...order(),requestProcess:{...simplePaidPending,version:5}});
  const r=await startReservationPayment(20,state.session as any,new AbortController().signal);
  expect(r.navigation).toBe('https://wa.me/56900000000?text=Reserva');expect(state.send.mock.calls[0][3]).toBe('OPEN_RESERVATION_WHATSAPP');expect(state.send.mock.calls[0][4]).toMatchObject({purpose:'RECEIPT',reservationId:801,expectedVersion:4});expect([...markers.values()].join('')).not.toContain('wa.me');
});
it('does not reopen automatically after an uncertain navigation request or failed read',async()=>{
  state.read.mockResolvedValueOnce(order()).mockRejectedValueOnce(Error('network'));
  await expect(startReservationPayment(20,state.session as any,new AbortController().signal)).rejects.toThrow();
  const again=await startReservationPayment(20,state.session as any,new AbortController().signal);expect(again.navigation).toBeNull();expect(state.send).toHaveBeenCalledOnce();
});
it('does not open if the latest grants are unavailable, without fabricating contact',async()=>{
  state.read.mockResolvedValue({...order(),requestProcess:{...simplePaidPending,reservationFollowUp:{...simplePaidPending.reservationFollowUp!,allowedActions:[]}}});
  expect((await startReservationPayment(20,state.session as any,new AbortController().signal)).navigation).toBeNull();expect(state.send).not.toHaveBeenCalled();
});
it('suppresses a navigation URL if permissions disappear after the POST',async()=>{
  state.read.mockResolvedValueOnce(order()).mockResolvedValueOnce({...order(),requestProcess:{...simplePaidPending,version:5,reservationFollowUp:{...simplePaidPending.reservationFollowUp!,allowedActions:[]}}});
  expect((await startReservationPayment(20,state.session as any,new AbortController().signal)).navigation).toBeNull();expect(state.send).toHaveBeenCalledOnce();
});
it('does not post under a session changed during the first read',async()=>{
  const session=state.session;state.read.mockImplementation(async()=>{state.session={userId:'another'};return order();});
  expect((await startReservationPayment(20,session as any,new AbortController().signal)).navigation).toBeNull();expect(state.send).not.toHaveBeenCalled();
});

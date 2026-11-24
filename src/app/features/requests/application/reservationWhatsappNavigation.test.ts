import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const state=vi.hoisted(()=>({read:vi.fn(),session:null as any}));
vi.mock('../api/coordinationApi',async original=>({...await original<typeof import('../api/coordinationApi')>(),refreshCoordinationOrder:state.read}));
vi.mock('./intents/coordinationSession',()=>({readCoordinationSession:()=>state.session}));
import {offerReservationWhatsapp,getReservationWhatsappNavigation,dismissReservationWhatsappNavigation,
 markReservationWhatsappOpened,recordReservationWhatsappDeparture,refreshReservationWhatsappReturn} from './reservationWhatsappNavigation';
import {simplePaidPending} from '../fixtures/simplifiedReservationFixtures';
import {RequestProcessError} from '../domain/requestProcessErrors';

let events:string[];
const input=()=>({orderId:20,business:false,session:state.session,url:'https://wa.me/56900000000?text=Comprobante',processId:simplePaidPending.id,minVersion:4,receipt:true});
const latest=()=>({id:20,status:'accepted',requestProcess:simplePaidPending});
beforeEach(()=>{
 state.session={userId:'1',token:'synthetic',businessId:null,revision:1};state.read.mockReset().mockResolvedValue(latest());events=[];
 const target=new EventTarget();for(const type of ['zipco-process-receipt','zipco-requests-refresh','zipco-availability-view'])target.addEventListener(type,()=>events.push(type));
 vi.stubGlobal('window',target);
});
afterEach(()=>{dismissReservationWhatsappNavigation();vi.unstubAllGlobals();});
it('offers only an authorized HTTPS link for the same session, without opening/replacing any document',()=>{
 expect(offerReservationWhatsapp({...input(),url:'https://untrusted.test/'})).toBe(false);
 expect(getReservationWhatsappNavigation()).toBeNull();
 expect(offerReservationWhatsapp(input())).toBe(true);expect(state.read).not.toHaveBeenCalled();expect(events).toEqual([]);
 expect(getReservationWhatsappNavigation()?.attempted).toBe(false);
});
it('does not refresh on initial focus or without an actual link attempt and departure',async()=>{
 offerReservationWhatsapp(input());await refreshReservationWhatsappReturn();recordReservationWhatsappDeparture();await refreshReservationWhatsappReturn();
 markReservationWhatsappOpened();await refreshReservationWhatsappReturn();expect(state.read).not.toHaveBeenCalled();
});
it('reconciles only a GET on return and publishes the read state/category once',async()=>{
 offerReservationWhatsapp(input());markReservationWhatsappOpened();recordReservationWhatsappDeparture();
 await Promise.all([refreshReservationWhatsappReturn(),refreshReservationWhatsappReturn(),refreshReservationWhatsappReturn()]);
 expect(state.read).toHaveBeenCalledOnce();expect(state.read.mock.calls[0].slice(0,4)).toEqual([20,false,'synthetic',null]);
 expect(events).toEqual(['zipco-process-receipt','zipco-requests-refresh','zipco-availability-view']);expect(getReservationWhatsappNavigation()).toBeNull();
});
it('keeps a network failure visible, avoids automatic retry storms, and permits an explicit GET retry',async()=>{
 state.read.mockRejectedValueOnce(Error('offline'));offerReservationWhatsapp(input());markReservationWhatsappOpened();recordReservationWhatsappDeparture();
 await refreshReservationWhatsappReturn();expect(getReservationWhatsappNavigation()?.status).toBe('failed');expect(events).toEqual([]);
 await refreshReservationWhatsappReturn();expect(state.read).toHaveBeenCalledOnce();
 await refreshReservationWhatsappReturn(true);expect(state.read).toHaveBeenCalledTimes(2);expect(getReservationWhatsappNavigation()).toBeNull();
});
it.each([{...latest(),id:99},{...latest(),requestProcess:{...simplePaidPending,id:99}},{...latest(),requestProcess:{...simplePaidPending,version:3}},null])('does not publish a stale, absent or different order read %#',async response=>{
 state.read.mockResolvedValue(response);offerReservationWhatsapp(input());markReservationWhatsappOpened();recordReservationWhatsappDeparture();await refreshReservationWhatsappReturn();
 expect(getReservationWhatsappNavigation()?.status).toBe('failed');expect(events).toEqual([]);
});
it('invalidates the link before opening if the authenticated session changes',()=>{
 offerReservationWhatsapp(input());state.session={...state.session,userId:'other'};expect(markReservationWhatsappOpened()).toBe(false);expect(getReservationWhatsappNavigation()).toBeNull();
});
it('drops a read completing after session change and never publishes to another account',async()=>{
 let resolve:(value:any)=>void=()=>{};state.read.mockImplementation(()=>new Promise(r=>resolve=r));
 offerReservationWhatsapp(input());markReservationWhatsappOpened();recordReservationWhatsappDeparture();const running=refreshReservationWhatsappReturn();
 state.session={...state.session,token:'other'};resolve(latest());await running;expect(events).toEqual([]);expect(getReservationWhatsappNavigation()).toBeNull();
});
it('dismisses the transient link without cancelling or closing the request',async()=>{
 offerReservationWhatsapp(input());dismissReservationWhatsappNavigation();await refreshReservationWhatsappReturn();
 expect(state.read).not.toHaveBeenCalled();expect(events).toEqual([]);
});
it('clears the prepared link and uses existing session-expiry handling on HTTP401',async()=>{
 const expired=vi.fn();window.addEventListener('zipco-coordination-session-expired',expired);
 state.read.mockRejectedValue(new RequestProcessError('Expired session',401));
 offerReservationWhatsapp(input());markReservationWhatsappOpened();recordReservationWhatsappDeparture();await refreshReservationWhatsappReturn();
 expect(getReservationWhatsappNavigation()).toBeNull();expect(expired).toHaveBeenCalledOnce();expect(events).toEqual([]);
});

import {afterEach,it,expect,vi} from 'vitest';
import {normalizeRequestProcess} from './requestProcess';
import {normalizeReservationOffer,processContractHeaders} from './reservationContract';
import {normalizeReservationTiming,simpleOfferInput} from './simplifiedReservationContract';
import {simpleFree,simplePaid,simpleInitial,simpleWaiting,simpleReserved,simplePaidPending} from './simplifiedReservationFixtures';
import {reservationRequested,paidRequested} from './reservationFixtures';
import {readReservationCapabilities} from './reservationCapabilities';
import {reservationAllowed,sendReservationAction} from './reservationApi';
import {readReservationOptions,canChooseWithoutPreview} from './reservationOptions';
import {fulfillmentFromPlan} from './availabilityChoice';
import {normalizeAgreement} from './agreement';
import {agreementFixture} from './requestProcessFixtures';
import {coordinationAllowed} from './coordinationApi';
import {whatsappPlan} from './availabilityFixtures';
const key='123e4567-e89b-42d3-a456-426614174000';
afterEach(()=>vi.unstubAllGlobals());
it.each([simpleInitial,simpleWaiting,simpleReserved,simplePaidPending])('reads V3 public summary %# without interpreting it as V2',p=>expect(normalizeRequestProcess(p)).toEqual(p));
it('preserves manual V2 reservations and rejects mixed contracts',()=>{
  expect(normalizeRequestProcess(reservationRequested)).toEqual(reservationRequested);
  expect(normalizeRequestProcess(paidRequested)).toEqual(paidRequested);
  expect(normalizeRequestProcess({...simpleWaiting,flowContract:'AVAILABILITY_V2'})).toBeNull();
  expect(normalizeRequestProcess({...reservationRequested,flowContract:'AVAILABILITY_V3'})).toBeNull();
  expect(processContractHeaders(simpleInitial)).toEqual({'X-Process-Contract':'availability-v3'});
});
it('does not accept invented dates, old absolute deadlines, duration chips or wrong totals',()=>{
  expect(normalizeReservationOffer({...simpleFree,pickupBy:'2099-10-25T15:00:00Z'})).toBeNull();
  expect(normalizeReservationOffer({...simpleFree,simplified:{...simpleFree.simplified,holdMinutes:60}})).toBeNull();
  expect(normalizeReservationOffer({...simpleFree,simplified:{...simpleFree.simplified,timeZone:'UTC'}})).toBeNull();
  expect(normalizeReservationOffer(simplePaid,500)).toBeNull();
  expect(normalizeReservationOffer({...simplePaid,paymentKind:'FULL'},2000)).toBeNull();
  expect(normalizeReservationOffer({...simplePaid,paymentKind:'FULL'},1000)?.mode).toBe('PREPAYMENT');
});
it('distinguishes automatically accepted offer from a fabricated business click',()=>{
  expect(normalizeRequestProcess({...simpleReserved,reservation:{...simpleReserved.reservation,confirmedByUserId:2}})).toBeNull();
  expect(normalizeRequestProcess({...simpleReserved,reservation:{...simpleReserved.reservation,confirmationSource:'BUSINESS_ACTION'}})).toBeNull();
  expect(normalizeRequestProcess({...simpleReserved,allowedActions:['CONFIRM_PICKUP_RESERVATION']})).toBeNull();
  expect(coordinationAllowed(simpleReserved,true,'MARK_READY')).toBe(true);
});
it('requires current terms and an explicit no-reservation acknowledgement',()=>{
  expect(normalizeRequestProcess({...simpleReserved,reservationChoice:{offerId:31,choice:'REQUEST_RESERVATION'}})).toBeNull();
  const p={...simpleReserved,reservation:undefined,reservationChoice:{offerId:31,choice:'NONE',termsVersion:simpleFree.simplified.termsVersion}};
  expect(normalizeRequestProcess(p)).toBeNull();expect(normalizeRequestProcess({...p,reservationChoice:{...p.reservationChoice,noReservationAcknowledged:true}})).not.toBeNull();
});
it('keeps ordinary V3 WhatsApp without a pickup acknowledgement or reservation',()=>{
  const p={...simpleReserved,availability:whatsappPlan,reservation:undefined,reservationChoice:{offerId:whatsappPlan.availabilityConfirmationId,choice:'NONE'},state:'COORDINATION_PENDING',allowedActions:['OPEN_WHATSAPP']};
  expect(normalizeRequestProcess(p)).not.toBeNull();
});
it('validates actor-scoped reminder against permissions, reservation and version',()=>{
  for(const patch of [{expectedVersion:2},{reservationId:999},{eligible:false}])expect(normalizeRequestProcess({...simplePaidPending,reservationFollowUp:{...simplePaidPending.reservationFollowUp,paymentConfirmationReminder:{...simplePaidPending.reservationFollowUp!.paymentConfirmationReminder,...patch}}})).toBeNull();
  expect(reservationAllowed(simplePaidPending,false,'CONFIRM_PICKUP_RESERVATION')).toBe(false);
});
it('strips immutable public terms before a business proposal, preserving explicit own consent',()=>{
  expect(simpleOfferInput(simpleFree)).toEqual({mode:'FREE'});
  expect(fulfillmentFromPlan(simplePaidPending.availability)).toMatchObject({reservationOffer:{mode:'PREPAYMENT',requiredAmountClp:1000},businessContactConsent:{accepted:true}});
  expect(JSON.stringify(fulfillmentFromPlan(simplePaidPending.availability))).not.toContain('termsVersion');
});
it('retains choice and public offer in the accepted agreement',()=>{
  expect(normalizeAgreement({...agreementFixture,availability:simpleReserved.availability,reservationChoice:simpleReserved.reservationChoice})?.reservationChoice).toEqual(simpleReserved.reservationChoice);
});
it('keeps V2 and V3 activation flags independent',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({supportedContracts:['availability-v2','availability-v3'],reservationCreationEnabled:true,simplifiedReservationCreationEnabled:false}))).mockResolvedValueOnce(new Response(JSON.stringify({supportedContracts:['availability-v2'],reservationCreationEnabled:false,simplifiedReservationCreationEnabled:true}))));
  expect(await readReservationCapabilities('synthetic')).toEqual({reservationCreationEnabled:true,simplifiedReservationCreationEnabled:false});
  expect((await readReservationCapabilities('synthetic')).simplifiedReservationCreationEnabled).toBe(false);
});
it('reads authenticated, uncached options and rejects a stale preview without mutating',async()=>{
  const response={serverNow:'2026-10-26T03:00:00Z',version:2,offerId:31,reservationOffer:simpleFree,previewTiming:simpleReserved.reservation!.timing};
  const fetcher=vi.fn().mockImplementation(()=>Promise.resolve(new Response(JSON.stringify(response))));vi.stubGlobal('fetch',fetcher);
  expect((await readReservationOptions(7,2,'synthetic',false,31)).reservationOffer).toEqual(simpleFree);
  expect(fetcher.mock.calls[0][0]).toContain('reservation-options?processContract=availability-v3');expect(fetcher.mock.calls[0][1].cache).toBe('no-store');expect(fetcher.mock.calls[0][1].method).toBeUndefined();
  await expect(readReservationOptions(7,3,'synthetic',false,31)).rejects.toThrow('cambió');
});
it('cancels only a V3 free reservation as business and accepts the minimal receipt',async()=>{
  const p=simpleReserved;
  const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({orderId:20,orderStatus:'accepted',requestProcess:{id:7,state:'IN_PROGRESS',version:5,currentProposalId:123,agreementPublicId:p.agreementPublicId,flowContract:p.flowContract,availability:p.availability,allowedActions:[]}})));vi.stubGlobal('fetch',fetcher);
  expect(reservationAllowed(p,false,'CANCEL_PICKUP_RESERVATION')).toBe(false);
  expect(reservationAllowed(reservationRequested,true,'CANCEL_PICKUP_RESERVATION')).toBe(false);
  const result=await sendReservationAction(p,20,true,'CANCEL_PICKUP_RESERVATION',{expectedVersion:4,reservationId:801,reasonDetail:'No puedo apartar'},'synthetic',key);
  expect(result.receipt.orderStatus).toBe('accepted');expect(fetcher.mock.calls[0][1].headers['X-Process-Contract']).toBe('availability-v3');
});
it('never uses a reversed or missing row timing as a valid expiry',()=>{
  expect(normalizeReservationTiming({...simpleReserved.reservation!.timing,pickupBy:'2000-01-01T00:00:00Z'})).toBeNull();
  expect(normalizeRequestProcess({...simpleReserved,reservation:{...simpleReserved.reservation,timing:undefined}})).toBeNull();
});
it('allows a new explicit without-reservation decision after a server deadline rejection, never after an authentication failure',async()=>{
  const fetcher=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({code:'RESERVATION_PAYMENT_WINDOW_UNAVAILABLE'}),{status:409})).mockResolvedValueOnce(new Response('{}',{status:401}));vi.stubGlobal('fetch',fetcher);
  const expired=await readReservationOptions(7,2,'synthetic',false,31).catch(e=>e),unauthorized=await readReservationOptions(7,2,'synthetic',false,31).catch(e=>e);
  expect(canChooseWithoutPreview(expired)).toBe(true);expect(canChooseWithoutPreview(unauthorized)).toBe(false);
});

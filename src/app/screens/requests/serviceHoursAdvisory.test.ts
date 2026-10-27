import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {normalizeSubmissionAdvisory,readSubmissionAdvisory,readResponseAdvisory,responseHoursText,chileSchedule,type SubmissionAdvisory} from './serviceHoursAdvisory';
import {normalizeSimpleTerms,normalizeReservationTiming,simpleOfferInput} from './simplifiedReservationContract';
import {normalizeRequestProcess} from './requestProcess';
import {simpleFree,simplePaid,simpleReserved,simplePaidPending} from './simplifiedReservationFixtures';
import {readReservationCapabilities} from './reservationCapabilities';
import {readReservationOptions} from './reservationOptions';
import {createAvailabilityIntents} from './availabilityIntent';
import {createProposalIntents} from './proposalIntent';
import {createReservationIntents} from './reservationIntent';
import {AvailabilityError} from './availabilityApi';
import {ProposalError} from './proposalApi';
import {processApiError} from './requestProcessErrors';
import {processContractHeaders} from './reservationContract';
import ReservationOfferSummary from './ReservationOfferSummary';
import {createCoordinationIntents} from './coordinationIntent';

const advice=(status:SubmissionAdvisory['status']='OUTSIDE_SERVICE_HOURS'):SubmissionAdvisory=>({contract:'request-submission-advisory-v1',businessId:5,businessName:'Negocio QA',checkedAt:'2026-10-27T20:29:00.000Z',timeZone:'America/Santiago',localDate:'2026-10-27',status,reason:status==='UNKNOWN'?'INVALID_SCHEDULE':status==='IN_SERVICE_HOURS'?'WITHIN_WINDOW':'AFTER_CLOSING',requiresConfirmation:status==='OUTSIDE_SERVICE_HOURS',todayWindow:{opensAt:'2026-10-27T11:00:00Z',closesAt:'2026-10-27T20:30:00Z'},activeWindow:null,nextWindow:null});
const terms={...simpleFree.simplified,hoursPolicy:'ADVISORY_ONLY' as const,opensAt:null,closesAt:null,holdMinutes:null,scheduledFor:'2099-10-25T20:35:00Z'};
const timing={holdStartsAt:'2099-10-25T20:35:00Z',pickupBy:null,paymentDueAt:null};
const reply=(v:unknown)=>new Response(JSON.stringify(v));
afterEach(()=>vi.unstubAllGlobals());
describe('server hours advisories',()=>{
  it.each(['IN_SERVICE_HOURS','OUTSIDE_SERVICE_HOURS','UNKNOWN'] as const)('keeps the server status %s without deciding from the phone clock',status=>{
    expect(normalizeSubmissionAdvisory(advice(status),5)?.status).toBe(status);
    expect(normalizeSubmissionAdvisory(advice(status),6)).toBeNull();
  });
  it.each([{timeZone:'UTC'},{requiresConfirmation:false},{todayWindow:{opensAt:'bad',closesAt:'bad'}},{contract:'other'}])('rejects malformed advice %j',patch=>{
    expect(normalizeSubmissionAdvisory({...advice(),...patch},5)).toBeNull();
  });
  it.each([
    ['IN_SERVICE_HOURS','OUTSIDE_SERVICE_HOURS','La hora solicitada'],
    ['OUTSIDE_SERVICE_HOURS','IN_SERVICE_HOURS','Estás respondiendo fuera'],
    ['OUTSIDE_SERVICE_HOURS','OUTSIDE_SERVICE_HOURS','Estás respondiendo y la hora solicitada'],
    ['UNKNOWN','IN_SERVICE_HOURS','No pudimos determinar'],
  ] as const)('distinguishes current %s and requested %s', (now,requested,text)=>{
    expect(responseHoursText({contract:'business-response-hours-advisory-v1',current:advice(now),requested:{requestedFor:advice().checkedAt,advisory:advice(requested)},canContinue:true})).toContain(text);
  });
  it('does not warn when both evaluations are within the schedule',()=>{
    expect(responseHoursText({contract:'business-response-hours-advisory-v1',current:advice('IN_SERVICE_HOURS'),requested:null,canContinue:true})).toBeNull();
    expect(chileSchedule('2026-10-27T20:35:00Z')).toEqual({date:'2026-10-27',time:'17:35'});
  });
  it('uses authenticated no-store GETs with both local date/time or neither',async()=>{
    const fetcher=vi.fn(async(url:string)=>reply(url.includes('/submission-advisory')?advice():{contract:'business-response-hours-advisory-v1',current:advice('IN_SERVICE_HOURS'),requested:url.includes('?')?{requestedFor:advice().checkedAt,advisory:advice()}:null,canContinue:true}));vi.stubGlobal('fetch',fetcher);
    await readSubmissionAdvisory(5,'synthetic');await readResponseAdvisory(5,'synthetic',{date:'2026-10-27',time:'17:35'});await readResponseAdvisory(5,'synthetic');
    expect(fetcher.mock.calls[1][0]).toContain('requestedDate=2026-10-27&requestedTime=17%3A35');
    expect(fetcher.mock.calls[2][0]).not.toContain('?');
    for(const [,init] of fetcher.mock.calls as unknown as [string,RequestInit][]){expect(init.cache).toBe('no-store');expect(init.method).toBeUndefined();expect(init.headers).toMatchObject({Authorization:'Bearer synthetic'});}
  });
  it.each([401,403,404,500])('preserves response status %s',async status=>{
    vi.stubGlobal('fetch',vi.fn(async()=>new Response(null,{status})));
    await expect(readSubmissionAdvisory(5,'synthetic')).rejects.toMatchObject({status});
  });
});
describe('advisory reservation policy preserves earlier terms',()=>{
  it('accepts explicit null deadlines only for the new terms',()=>{
    expect(normalizeSimpleTerms(terms)).toEqual(terms);
    expect(normalizeSimpleTerms({...terms,hoursPolicy:undefined})).toBeNull();
    expect(normalizeSimpleTerms({...terms,holdMinutes:30})).toBeNull();
    expect(normalizeSimpleTerms({...terms,closesAt:'2099-10-25T20:30:00Z'})).toBeNull();
    expect(normalizeReservationTiming(timing)).toEqual(timing);
    expect(normalizeReservationTiming({...timing,paymentDueAt:timing.holdStartsAt})).toBeNull();
    expect(normalizeSimpleTerms(simpleFree.simplified)).toEqual(simpleFree.simplified);
  });
  it.each([simpleReserved,simplePaidPending])('normalizes saved advisory free/paid processes without inventing a date',process=>{
    const p={...process,availability:{...process.availability!,reservationOffer:{...process.availability!.reservationOffer!,simplified:terms}},reservation:{...process.reservation!,timing}};
    expect(normalizeRequestProcess(p)?.reservation?.timing).toEqual(timing);
    expect(normalizeRequestProcess({...process,reservation:{...process.reservation!,timing}})).toBeNull();
    expect(normalizeRequestProcess({...p,reservation:{...p.reservation,timing:process.reservation!.timing}})).toBeNull();
  });
  it.each([simpleFree,simplePaid])('renders new terms without old countdowns and preserves policy in negotiation',offer=>{
    const next={...offer,simplified:terms};
    const html=renderToStaticMarkup(React.createElement(ReservationOfferSummary,{offer:next}));
    expect(html).toContain('no tiene vencimiento automático');expect(html).not.toMatch(/30 minutos|hasta el cierre|Cierre:|1970/);
    expect(simpleOfferInput(next)).toMatchObject({mode:offer.mode,hoursPolicy:'ADVISORY_ONLY'});
    expect(simpleOfferInput(offer)).not.toHaveProperty('hoursPolicy');
    expect(renderToStaticMarkup(React.createElement(ReservationOfferSummary,{offer}))).toContain('hasta el cierre');
  });
  it.each([true,false])('creates only with an active compatible capability: %s',async enabled=>{
    vi.stubGlobal('fetch',vi.fn(async()=>reply({supportedContracts:['availability-v3'],reservationCreationEnabled:true,simplifiedReservationCreationEnabled:true,serviceHoursAdvisory:{contract:'service-hours-advisory-v1',reservationCreationEnabled:enabled}})));
    expect((await readReservationCapabilities('synthetic')).serviceHoursAdvisoryEnabled).toBe(enabled);
  });
  it('keeps the technical header on V3 decisions and preview reads even when creation becomes disabled',async()=>{
    expect(processContractHeaders(simpleReserved)).toHaveProperty('X-Service-Hours-Contract','service-hours-advisory-v1');
    expect(processContractHeaders({flowContract:'AVAILABILITY_V2'})).not.toHaveProperty('X-Service-Hours-Contract');
    const fetcher=vi.fn(async()=>reply({version:2,serverNow:'2026-10-27T20:29:00Z',offerId:31,reservationOffer:{...simpleFree,simplified:terms},previewTiming:timing}));vi.stubGlobal('fetch',fetcher);
    expect((await readReservationOptions(7,2,'synthetic',false,31)).previewTiming?.pickupBy).toBeNull();
    expect((fetcher.mock.calls as unknown as [string,RequestInit][])[0][1].headers).toMatchObject({'X-Service-Hours-Contract':'service-hours-advisory-v1'});
  });
  it.each(['SERVICE_HOURS_CONTRACT_REQUIRED','ADVISORY_RESERVATION_HOURS_DISABLED'])('releases definitively rejected fresh intentions, without automatically sending: %s',async code=>{
    const key='12345678-1234-4234-8234-123456789abc',hash=async(value:string)=> (value.includes('corrected')?'b':'a').repeat(64);
    const availability=createAvailabilityIntents(undefined,()=>key,hash),proposal=createProposalIntents(undefined,()=>key,hash),reservation=createReservationIntents(undefined,()=>key,hash);
    const body={expectedVersion:1,proposalId:123};
    const send=vi.fn(async()=>{throw new AvailabilityError('synthetic',409,code);});
    await expect(availability.run('scope',7,'CONFIRM_AVAILABILITY',body,send)).rejects.toMatchObject({code});
    expect(availability.hasPending('scope',7)).toBe(false);expect(send).toHaveBeenCalledOnce();
    const sendProposal=vi.fn(async()=>{throw new ProposalError('synthetic',409,code);});
    await expect(proposal.run('scope',7,'PROPOSE_ALTERNATIVE',{...body,confirmationAccepted:true},sendProposal)).rejects.toMatchObject({code});
    await expect(proposal.run('scope',7,'PROPOSE_ALTERNATIVE',{...body,confirmationAccepted:true,message:'corrected'},sendProposal)).rejects.toMatchObject({code});
    expect(sendProposal).toHaveBeenCalledTimes(2);
    await expect(reservation.run('scope',7,'CONFIRM_PICKUP_RESERVATION',{...body,reservationId:801},send)).rejects.toMatchObject({code});
    await expect(reservation.run('scope',7,'CONFIRM_PICKUP_RESERVATION',{...body,expectedVersion:2,reservationId:801},send)).rejects.toMatchObject({code});
    expect(processApiError(409,{code}).message).not.toContain('pedido cambió');
    const coordination=createCoordinationIntents(()=>key),sendCoordination=vi.fn(async()=>{throw processApiError(409,{code});});
    await expect(coordination.run('scope',7,'MARK_READY',{expectedVersion:1},sendCoordination)).rejects.toMatchObject({definitiveRejection:true});
    expect(coordination.read('scope',7)).toBeNull();expect(sendCoordination).toHaveBeenCalledOnce();
  });
});

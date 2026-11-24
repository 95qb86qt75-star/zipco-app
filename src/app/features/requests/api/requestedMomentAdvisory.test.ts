import {afterEach,it,expect,vi} from 'vitest';
import {normalizeRequestedMomentAdvisory,readRequestedMomentAdvisory,requestedMoment,requestedHoursMessage,weeklyHoursText,REQUESTED_HOURS_CONTRACT,type RequestedMoment,type RequestedMomentAdvisory} from './requestedMomentAdvisory';

const scheduled=(time='13:00'):RequestedMoment=>({mode:'SCHEDULED',requestedDate:'2026-11-20',requestedTime:time});
const week=[{days:['monday','tuesday','wednesday','thursday','friday'],open:'08:00',close:'15:00',crossesMidnight:false}];
const advice=(selection:RequestedMoment=scheduled(),patch:Record<string,unknown>={})=>({
  contract:REQUESTED_HOURS_CONTRACT,businessId:5,businessName:'Negocio QA',checkedAt:'2026-11-17T00:00:00Z',timeZone:'America/Santiago',
  evaluatedAt:selection.mode==='SCHEDULED'?`${selection.requestedDate}T${selection.requestedTime}:00-03:00`:'2026-11-17T00:00:00Z',
  localDate:selection.mode==='SCHEDULED'?selection.requestedDate:'2026-11-16',mode:selection.mode,
  requestedDate:selection.mode==='SCHEDULED'?selection.requestedDate:null,requestedTime:selection.mode==='SCHEDULED'?selection.requestedTime:null,
  status:'IN_SERVICE_HOURS',reason:'WITHIN_WINDOW',requiresConfirmation:false,
  dayWindow:{opensAt:'2026-11-20T11:00:00Z',closesAt:'2026-11-20T18:00:00Z'},
  activeWindow:{opensAt:'2026-11-20T11:00:00Z',closesAt:'2026-11-20T18:00:00Z'},nextWindow:null,weeklyHours:week,...patch,
});
afterEach(()=>vi.unstubAllGlobals());
it('accepts the requested Friday hour even when checked on Monday night',()=>{
  const p=normalizeRequestedMomentAdvisory(advice(),5,scheduled());
  expect(p?.status).toBe('IN_SERVICE_HOURS');expect(p?.localDate).toBe('2026-11-20');
  expect(p?.checkedAt).not.toBe(p?.evaluatedAt);
});
it.each(['15:00','15:01'])('keeps the server closing boundary %s without deciding from the phone',time=>{
  const raw=advice(scheduled(time),{status:'OUTSIDE_SERVICE_HOURS',reason:'AFTER_CLOSING',requiresConfirmation:true,activeWindow:null});
  expect(normalizeRequestedMomentAdvisory(raw,5,scheduled(time))?.requiresConfirmation).toBe(true);
});
it('preserves a closed chosen day and explains it without saying the business is closed now',()=>{
  const selection:RequestedMoment={mode:'SCHEDULED',requestedDate:'2026-11-21',requestedTime:'13:00'};
  const p=normalizeRequestedMomentAdvisory(advice(selection,{status:'OUTSIDE_SERVICE_HOURS',reason:'CLOSED_DAY',requiresConfirmation:true,dayWindow:null,activeWindow:null}),5,selection)!;
  expect(requestedHoursMessage(p)).toContain('El día elegido no tiene atención informada');
});
it('validates IMMEDIATE against the server check instant and forbids scheduled echoes',()=>{
  const selection:RequestedMoment={mode:'IMMEDIATE'};
  expect(normalizeRequestedMomentAdvisory(advice(selection),5,selection)?.mode).toBe('IMMEDIATE');
  expect(normalizeRequestedMomentAdvisory(advice(selection,{requestedDate:'2026-11-20'}),5,selection)).toBeNull();
  expect(normalizeRequestedMomentAdvisory(advice(selection,{evaluatedAt:'2026-11-20T16:00:00Z'}),5,selection)).toBeNull();
});
it.each([{contract:'request-submission-advisory-v1'},{businessId:6},{requestedTime:'14:00'},{mode:'IMMEDIATE'},{timeZone:'UTC'},{evaluatedAt:'2026-11-20T14:00:00Z'},{localDate:'2026-11-19'},{requiresConfirmation:true}])('rejects mismatched advice %j',patch=>{
  expect(normalizeRequestedMomentAdvisory(advice(scheduled(),patch),5,scheduled())).toBeNull();
});
it('keeps UNKNOWN distinct from closed and checks the weekly groups',()=>{
  expect(normalizeRequestedMomentAdvisory(advice(scheduled(),{status:'UNKNOWN',reason:'INVALID_SCHEDULE',weeklyHours:null}),5,scheduled())?.requiresConfirmation).toBe(false);
  for(const hours of [[{...week[0],days:['monday','monday']}],[{...week[0],days:['other']}],[{...week[0],open:'99:00'}],[{...week[0],crossesMidnight:true}]]){
    expect(normalizeRequestedMomentAdvisory(advice(scheduled(),{weeklyHours:hours}),5,scheduled())).toBeNull();
  }
});
it('does not invent continuous working days and labels overnight closing',()=>{
  expect(weeklyHoursText([{days:['monday','wednesday','friday'],open:'08:00',close:'15:00',crossesMidnight:false}])).toBe('lunes, miércoles y viernes, de 08:00 a 15:00');
  expect(weeklyHoursText([{days:['monday'],open:'22:00',close:'02:00',crossesMidnight:true}])).toContain('del día siguiente');
  expect(requestedHoursMessage(advice() as RequestedMomentAdvisory)).toContain('de lunes a viernes, de 08:00 a 15:00');
});
it.each(['11:10','11:30','13:00'])('sends the exact requested hour %s in authenticated no-store GET',async time=>{
  const fetcher=vi.fn(async()=>Response.json(advice(scheduled(time))));vi.stubGlobal('fetch',fetcher);
  await readRequestedMomentAdvisory(5,'synthetic',scheduled(time));
  const [url,options]=fetcher.mock.calls[0] as unknown as [string,RequestInit];const query=new URL(url).searchParams;
  expect(query.get('contract')).toBe(REQUESTED_HOURS_CONTRACT);expect(query.get('requestedDate')).toBe('2026-11-20');expect(query.get('requestedTime')).toBe(time);
  expect(options).toMatchObject({cache:'no-store',headers:{Authorization:'Bearer synthetic'}});expect(options.body).toBeUndefined();
});
it('sends no invented date/time for IMMEDIATE',async()=>{
  const selection:RequestedMoment={mode:'IMMEDIATE'},fetcher=vi.fn(async()=>Response.json(advice(selection)));vi.stubGlobal('fetch',fetcher);
  await readRequestedMomentAdvisory(5,'synthetic',selection);
  expect(String(fetcher.mock.calls[0][0])).toContain('mode=IMMEDIATE');expect(String(fetcher.mock.calls[0][0])).not.toContain('requestedDate');
});
it('rejects a successful v1 response instead of falling back to the current time',async()=>{
  const fetcher=vi.fn(async()=>Response.json(advice(scheduled(),{contract:'request-submission-advisory-v1'})));vi.stubGlobal('fetch',fetcher);
  await expect(readRequestedMomentAdvisory(5,'synthetic',scheduled())).rejects.toMatchObject({code:'ADVISORY_CONTRACT_MISMATCH'});expect(fetcher).toHaveBeenCalledOnce();
});
it.each(['REQUEST_ADVISORY_INVALID_QUERY','REQUEST_ADVISORY_INVALID_SCHEDULE','REQUEST_ADVISORY_SCHEDULE_PAST','REQUEST_ADVISORY_CLOCK_CHANGE'])('retains correctable server error %s',async code=>{
  vi.stubGlobal('fetch',vi.fn(async()=>Response.json({code},{status:400})));
  await expect(readRequestedMomentAdvisory(5,'synthetic',scheduled())).rejects.toMatchObject({status:400,code});
});
it('refuses incomplete local schedules instead of treating them as now',()=>{
  expect(()=>requestedMoment({needNow:false,deliveryDate:'2026-11-20',deliveryTime:''})).toThrow();
  expect(()=>requestedMoment({needNow:false,deliveryDate:'2026-02-30',deliveryTime:'13:00'})).toThrow();
  expect(requestedMoment({needNow:true,deliveryDate:'',deliveryTime:''})).toEqual({mode:'IMMEDIATE'});
});

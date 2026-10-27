import {describe,it,expect,vi} from 'vitest';
import {availabilityNotice} from './availabilityNotice';
import {createCustomerOrderNotices} from './orderNotice';
import {canonicalPresentationKey,presentationKey} from './notificationDelivery';
import {createNotificationNavigation,parseNotificationTarget} from './notificationNavigation';
import {availabilityInitial,availabilityWaiting,pickupPlan} from '../screens/requests/availabilityFixtures';
import {orderNotificationState} from '../screens/requests/requestProcess';
const origin='https://zipco.test';
describe('confirmed availability identity and own notice',()=>{
  it.each([2,17,101])('recognizes confirmation version %s separately from order/process/proposal IDs',version=>{
    const order={id:91,status:'pending',requestProcess:{...availabilityWaiting,id:777,version}};
    const key=`requests-customer:order-91-availability-${version}`;
    expect(availabilityNotice(order)?.key).toBe(`order-91-availability-${version}`);
    expect(canonicalPresentationKey(key)).toBe(key);
    expect(parseNotificationTarget(`/?open=requests-customer&orderId=91&notificationEvent=${key}`,origin)?.eventKey).toBe(key);
  });
  it.each(['0','-1','1.2','oops','2147483648'])('rejects malformed availability version %s',version=>{
    expect(canonicalPresentationKey(`requests-customer:order-91-availability-${version}`)).toBeNull();
  });
  it('rejects wrong order/view and quote availability identities',()=>{
    const key='requests-customer:order-91-availability-17';
    expect(parseNotificationTarget(`/?open=requests-customer&orderId=92&notificationEvent=${key}`,origin)).toBeNull();
    expect(parseNotificationTarget(`/?open=requests-business&orderId=91&notificationEvent=${key}`,origin)).toBeNull();
    expect(canonicalPresentationKey('requests-customer-quotes:quote-91-availability-17')).toBeNull();
    expect(presentationKey('order-91-availability-17','/?open=requests-customer&orderId=92',origin)).toBeNull();
  });
  it.each(['WHATSAPP','LOCAL_PICKUP'] as const)('announces a confirmed %s transition even with proposalSummary, once and not at baseline',path=>{
    const emit=vi.fn(),notify=createCustomerOrderNotices(emit);
    const order={id:91,status:'pending',requestProcess:{...availabilityWaiting,version:17,
      availability:path==='LOCAL_PICKUP'?pickupPlan:availabilityWaiting.availability,
      proposalSummary:{type:'BUSINESS_ALTERNATIVE' as const,totalPriceClp:12000,scheduledFor:null,subjectSchemaVersion:2 as const}}};
    notify([order],new Map(),false,new Set());expect(emit).not.toHaveBeenCalled();
    notify([order],new Map([[91,orderNotificationState({status:'pending',requestProcess:availabilityInitial})]]),true,new Set());
    expect(emit).toHaveBeenCalledExactlyOnceWith('order-91-availability-17',['El negocio confirmó disponibilidad','Revisa el camino propuesto y decide si continúas en ZIPCO.'],91);
    notify([order],new Map([[91,orderNotificationState(order)]]),true,new Set([91]));expect(emit).toHaveBeenCalledOnce();
  });
  it('does not turn other availability events or later states into a fresh confirmation',()=>{
    for(const state of ['AWAITING_BUSINESS_RESPONSE','COORDINATION_PENDING','IN_PROGRESS','CLOSED'] as const){
      expect(availabilityNotice({id:91,requestProcess:{...availabilityWaiting,state,version:18}})).toBeNull();
    }
  });
  it('navigates twice for two physical clicks, ignores delivery retries and still supports old minimal URLs',()=>{
    const nav=createNotificationNavigation(origin),url='/?open=requests-customer&orderId=91&notificationEvent=requests-customer:order-91-availability-17';
    const first=url+'&notificationClick=click-00000001',second=url+'&notificationClick=click-00000002';
    expect(nav.receive(first)).not.toBeNull();expect(nav.receive(first)).toBeNull();
    nav.complete(first);expect(nav.receive(first)).toBeNull();expect(nav.receive(second)).not.toBeNull();
    expect(parseNotificationTarget('/?open=requests-customer&orderId=91',origin)).not.toBeNull();
  });
});

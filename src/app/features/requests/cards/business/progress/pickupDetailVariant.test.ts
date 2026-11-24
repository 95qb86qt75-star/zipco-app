import {describe,expect,it} from 'vitest';
import {pickupDetailVariant} from '../../../shared/reservations/ReservationPanel';
import {paidRequested,reservationRequested} from '../../../fixtures/reservationFixtures';
const confirmed={...paidRequested,reservation:{...paidRequested.reservation!,status:'CONFIRMED' as const,effectiveStatus:'CONFIRMED' as const,confirmedAt:'2026-11-18T15:00:00Z',confirmedByUserId:2}};
describe('business local pickup detail scope',()=>{
  it('selects confirmed prepayment independently of the order amount or message',()=>{
    expect(pickupDetailVariant(confirmed)).toBe('A');
    expect(pickupDetailVariant({...confirmed,availability:{...confirmed.availability!,customerMessage:'Puedes reservar 999'}})).toBe('A');
  });
  it('selects no-reservation only when no reservation record exists',()=>{
    expect(pickupDetailVariant({...confirmed,reservation:undefined})).toBe('B');
    for(const effectiveStatus of ['CANCELLED','EXPIRED','NEEDS_CLARIFICATION','AWAITING_BUSINESS_CONFIRMATION'] as const)
      expect(pickupDetailVariant({...confirmed,reservation:{...confirmed.reservation,effectiveStatus}})).toBeNull();
    expect(pickupDetailVariant({...confirmed,reservation:{...confirmed.reservation,continuedWithoutReservationAt:'2026-11-18T16:00:00Z'}})).toBeNull();
  });
  it('preserves other states, channels, free reservation and cancelled pickup',()=>{
    expect(pickupDetailVariant(paidRequested)).toBeNull();
    expect(pickupDetailVariant(reservationRequested)).toBeNull();
    expect(pickupDetailVariant({...confirmed,state:'READY'})).toBeNull();
    expect(pickupDetailVariant({...confirmed,availability:{...confirmed.availability!,path:'WHATSAPP'}})).toBeNull();
    expect(pickupDetailVariant({...confirmed,reservation:{...confirmed.reservation,pickupCancellation:{actorUserId:2,cancelledAt:'2026-11-18T16:00:00Z',reasonDetail:'Motivo de prueba'}}})).toBeNull();
  });
});

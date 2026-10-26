import {afterEach,expect,it,vi} from 'vitest';
import {processApiError,RESERVATION_PROFILE_HOURS_MESSAGE} from './requestProcessErrors';
import {sendAvailabilityAction} from './availabilityApi';
import {simpleInitial} from './simplifiedReservationFixtures';
afterEach(()=>vi.unstubAllGlobals());
it.each(['Revisa las horas de apertura y cierre del negocio',['Completa el horario del negocio']])('explains missing profile hours from the documented 400 response: %j',message=>{
  expect(processApiError(400,{code:'INVALID_RESERVATION_TERMS',message}).message).toBe(RESERVATION_PROFILE_HOURS_MESSAGE);
});
it('does not echo unrecognized server messages or mistake another rejection for missing hours',()=>{
  const error=processApiError(400,{code:'INVALID_RESERVATION_TERMS',message:'private-error-user-data'});
  expect(error.message).not.toContain('private-error');expect(error.message).toContain('modalidad');
  expect(processApiError(400,{message:'Revisa las horas de apertura y cierre del negocio'}).message).not.toBe(RESERVATION_PROFILE_HOURS_MESSAGE);
  expect(processApiError(401,{code:'INVALID_RESERVATION_TERMS',message:'Completa el horario del negocio'}).message).toContain('sesión');
});
it('keeps invalid amount errors separate from the profile schedule',()=>{
  expect(processApiError(400,{code:'INVALID_RESERVATION_TERMS',message:'Revisa el monto para reservar'}).message).toContain('monto para reservar');
});
it('does not treat unavailable service hours as proof that the business is closed',()=>{
  const error=processApiError(409,{code:'RESERVATION_HOURS_UNAVAILABLE',message:'private calendar detail'});
  expect(error.message).toContain('única jornada');expect(error.message).toContain('«Ahora»');expect(error.message).toContain('superpuestas');expect(error.message).not.toContain('private');expect(error.message).not.toContain('El negocio está cerrado');
  expect(error.message).not.toBe(RESERVATION_PROFILE_HOURS_MESSAGE);
});
it('preserves the specific 30 minute paid reservation margin message',()=>{
  const error=processApiError(409,{code:'RESERVATION_PAYMENT_WINDOW_UNAVAILABLE'});
  expect(error.message).toContain('menos de 30 minutos');expect(error.message).not.toContain('superpuestas');
});
it('uses the exact outside-attention code without assuming the current instant is closed for a scheduled request',()=>{
  const error=processApiError(409,{code:'RESERVATION_OUTSIDE_SERVICE_WINDOW',message:'private internal details'});
  expect(error.message).toContain('fecha y hora de este pedido');expect(error.message).toContain('fuera del horario');expect(error.message).not.toContain('negocio está cerrado');expect(error.message).not.toContain('private');
});
it('separates ambiguous hours from outside-attention and keeps the legacy fallback',()=>{
  const ambiguous=processApiError(409,{code:'RESERVATION_AMBIGUOUS_SERVICE_WINDOW'}),legacy=processApiError(409,{code:'RESERVATION_HOURS_UNAVAILABLE'});
  expect(ambiguous.message).toContain('superpuestos');expect(ambiguous.message).toContain('Configuración');expect(ambiguous.message).not.toBe(legacy.message);expect(legacy.message).toContain('única jornada');
});
it('preserves the actionable hours message through the real confirm availability API',async()=>{
  const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({code:'INVALID_RESERVATION_TERMS',message:'Revisa las horas de apertura y cierre del negocio'}),{status:400}));vi.stubGlobal('fetch',fetcher);
  await expect(sendAvailabilityAction(simpleInitial,20,true,'CONFIRM_AVAILABILITY',{expectedVersion:1,proposalId:123,fulfillment:{path:'LOCAL_PICKUP',allowCustomerWhatsapp:true,businessContactConsent:{accepted:true,textVersion:'availability-business-whatsapp-v1'},reservationOffer:{mode:'PREPAYMENT',requiredAmountClp:5000}}},'synthetic-test-only','123e4567-e89b-42d3-a456-426614174000')).rejects.toMatchObject({status:400,code:'INVALID_RESERVATION_TERMS',message:RESERVATION_PROFILE_HOURS_MESSAGE});
  expect(fetcher).toHaveBeenCalledOnce();
});

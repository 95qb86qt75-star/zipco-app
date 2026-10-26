import {it,expect,vi} from 'vitest';
import {createAvailabilityIntents,CHECK_AVAILABILITY_MESSAGE} from './availabilityIntent';
import {AvailabilityError} from './availabilityApi';
import {simpleInitial,simpleWaiting} from './simplifiedReservationFixtures';
const key='123e4567-e89b-42d3-a456-426614174000',nextKey='123e4567-e89b-42d3-a456-426614174001';
const body={expectedVersion:1,proposalId:123,fulfillment:{path:'LOCAL_PICKUP' as const,customerMessage:'Mensaje inicial',allowCustomerWhatsapp:false,reservationOffer:{mode:'FREE' as const}}};
const receipt={orderId:20,orderStatus:'pending' as const,requestProcess:simpleWaiting};
function setup(){const map=new Map<string,string>();const storage={getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{map.set(k,v);},removeItem:(k:string)=>{map.delete(k);}};const uuid=vi.fn().mockReturnValueOnce(key).mockReturnValue(nextKey);return {map,storage,intents:createAvailabilityIntents(storage,uuid),uuid};}
it.each(['RESERVATION_OUTSIDE_SERVICE_WINDOW','RESERVATION_AMBIGUOUS_SERVICE_WINDOW','RESERVATION_HOURS_UNAVAILABLE','RESERVATION_PAYMENT_WINDOW_UNAVAILABLE'])('permits an explicitly edited confirmation after a definitive initial rejection: %s',async code=>{
  const {intents,map}=setup(),send=vi.fn().mockRejectedValueOnce(new AvailabilityError('Rechazo de horario',409,code,true)).mockResolvedValue(receipt);
  await expect(intents.run('2:business',7,'CONFIRM_AVAILABILITY',body,send)).rejects.toThrow('Rechazo');expect(map.size).toBe(0);
  await expect(intents.run('2:business',7,'CONFIRM_AVAILABILITY',{...body,fulfillment:{...body.fulfillment,customerMessage:'Mensaje corregido'}},send)).resolves.toEqual(receipt);
  expect(send.mock.calls[0][0]).toBe(key);expect(send.mock.calls[1][0]).toBe(nextKey);
});
it('retains an uncertain attempt even when its retry later returns a known rejection',async()=>{
  const {intents,map}=setup(),send=vi.fn().mockRejectedValueOnce(new TypeError('network')).mockRejectedValueOnce(new AvailabilityError('Horario',409,'RESERVATION_OUTSIDE_SERVICE_WINDOW'));
  await expect(intents.run('2:business',7,'CONFIRM_AVAILABILITY',body,send)).rejects.toThrow();
  await expect(intents.run('2:business',7,'CONFIRM_AVAILABILITY',body,send)).rejects.toThrow();
  expect(map.size).toBe(1);expect(send.mock.calls[0][0]).toBe(send.mock.calls[1][0]);
  await expect(intents.run('2:business',7,'CONFIRM_AVAILABILITY',{...body,proposalId:456},send)).rejects.toMatchObject({message:CHECK_AVAILABILITY_MESSAGE,code:'CHECK_AVAILABILITY_REQUIRED'});expect(send).toHaveBeenCalledTimes(2);
});
it('recovers an old uncertain confirmation after an explicit unchanged authoritative read without posting',async()=>{
  const {intents,map,storage}=setup();await expect(intents.run('2:business',7,'CONFIRM_AVAILABILITY',body,async()=>{throw TypeError('network');})).rejects.toThrow();
  const restored=createAvailabilityIntents(storage,()=>nextKey),send=vi.fn().mockResolvedValue(receipt);
  expect(await restored.recoverConfirmation('2:business',7,simpleInitial)).toBe(true);expect(send).not.toHaveBeenCalled();expect(map.size).toBe(0);
  await restored.run('2:business',7,'CONFIRM_AVAILABILITY',{...body,fulfillment:{...body.fulfillment,customerMessage:'Nuevo texto elegido'}},send);expect(send).toHaveBeenCalledOnce();
});
it('does not discard a known confirmed result while its read is still stale',async()=>{
  const {intents,map}=setup();await intents.run('2:business',7,'CONFIRM_AVAILABILITY',body,async()=>receipt);
  expect(await intents.recoverConfirmation('2:business',7,simpleInitial)).toBe(false);expect(map.size).toBe(1);
  await intents.reconcile('2:business',7,2);expect(map.size).toBe(0);
});
it.each([{...simpleInitial,id:99},{...simpleInitial,version:2},{...simpleInitial,allowedActions:[]},simpleWaiting])('refuses to discard unresolved confirmation from an incompatible read %#',async process=>{
  const {intents,map}=setup();await expect(intents.run('2:business',7,'CONFIRM_AVAILABILITY',body,async()=>{throw TypeError('network');})).rejects.toThrow();
  expect(await intents.recoverConfirmation('2:business',7,process)).toBe(false);expect(map.size).toBe(1);
});
it('does not forget a request that is still running in this page',async()=>{
  const {intents,map}=setup();let finish!:(v:typeof receipt)=>void;const send=vi.fn(()=>new Promise<typeof receipt>(r=>{finish=r;}));
  const running=intents.run('2:business',7,'CONFIRM_AVAILABILITY',body,send);await vi.waitFor(()=>expect(send).toHaveBeenCalledOnce());
  expect(await intents.recoverConfirmation('2:business',7,simpleInitial)).toBe(false);expect(map.size).toBe(1);finish(receipt);await running;
});
it('does not clear another actor scope or a different action',async()=>{
  const {intents,map}=setup();await expect(intents.run('1:customer',7,'CONTINUE_REQUEST',body,async()=>{throw TypeError('network');})).rejects.toThrow();
  expect(await intents.recoverConfirmation('2:business',7,simpleInitial)).toBe(false);expect(await intents.recoverConfirmation('1:customer',7,simpleInitial)).toBe(false);expect(map.size).toBe(1);
});
it('does not duplicate availability when an older request commits after the recovery read',async()=>{
  const {intents,storage}=setup();let serverVersion=1,writes=0;
  await expect(intents.run('2:business',7,'CONFIRM_AVAILABILITY',body,async()=>{throw TypeError('response lost while server still running');})).rejects.toThrow();
  const restored=createAvailabilityIntents(storage,()=>nextKey);
  expect(await restored.recoverConfirmation('2:business',7,{...simpleInitial,version:serverVersion})).toBe(true);
  // The older transaction wins the lock before the new explicit send.
  serverVersion=2;writes++;
  const send=vi.fn(async()=>{if(body.expectedVersion!==serverVersion)throw new AvailabilityError('El pedido cambió',409,'STALE_VERSION');writes++;return receipt;});
  await expect(restored.run('2:business',7,'CONFIRM_AVAILABILITY',{...body,proposalId:123},send)).rejects.toMatchObject({code:'STALE_VERSION'});
  expect(writes).toBe(1);await restored.reconcile('2:business',7,serverVersion);
});

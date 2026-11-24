import {describe,it,expect,vi} from 'vitest';
import {createCustomerOrderNotices,customerOrderNotice} from './orderNotice';
import {declaredClosure} from '../features/requests/fixtures/businessClosureFixtures';
import {coordinationProcess} from '../features/requests/fixtures/requestProcessFixtures';
import {orderNotificationState} from '../features/requests/domain/requestProcess';
describe('business closure participant notices',()=>{
 const order={id:20,status:'ready',requestProcess:{...coordinationProcess,state:'READY',version:3,businessClosure:declaredClosure}};
 it('does not describe a business delivery as MARK_READY or as customer receipt',()=>expect(customerOrderNotice(order)?.[0]).toBe('El negocio indicó que entregó tu pedido'));
 it('deduplicates the same durable event across subsequent receipt/finalization versions',()=>{
  const emit=vi.fn(),notices=createCustomerOrderNotices(emit);
  const previous=new Map([[20,'process:IN_PROGRESS']]);
  notices([order],previous,true,new Set());
  const later={...order,requestProcess:{...order.requestProcess,version:4}};
  notices([later],new Map([[20,orderNotificationState(order)]]),true,new Set([20]));
  expect(emit).toHaveBeenCalledTimes(1);
 });
 it('keeps without-delivery notice distinct from payment/refund and ready',()=>{
  const closed={...order,requestProcess:{...order.requestProcess,businessClosure:{...declaredClosure,status:'CLOSED_WITHOUT_DELIVERY' as const}}};
  expect(customerOrderNotice(closed)?.[0]).toBe('El negocio cerró la solicitud sin entrega');
 });
});

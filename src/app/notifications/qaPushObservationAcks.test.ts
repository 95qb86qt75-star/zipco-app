import { expect, it, vi } from 'vitest';
import { createQaPushObservationAcks } from './qaPushObservationAcks';
const origin='https://zipco.test';
const url='/?open=requests-customer&orderId=91&notificationEvent=requests-customer%3Aorder-91-availability-17&notificationClick=click-00000001';
const meta={traceId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',attemptId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'};
const sender=()=>({scriptURL:origin+'/sw.js',postMessage:vi.fn()});
it('reports acceptance and actual focus separately to the originating worker, with public IDs only',()=>{
  const state=createQaPushObservationAcks(origin),source=sender();state.receive(url,{...meta,receiptToken:'private'},source);
  expect(source.postMessage).not.toHaveBeenCalled();state.accepted(url);
  expect(source.postMessage).toHaveBeenCalledExactlyOnceWith({type:'ZIPCO_QA_OBSERVATION_ACK',...meta,stage:'APP_TARGET_ACCEPTED'});
  state.focused(url);state.focused(url);expect(source.postMessage).toHaveBeenCalledTimes(2);
  expect(source.postMessage.mock.calls[1][0]).toEqual({type:'ZIPCO_QA_OBSERVATION_ACK',...meta,stage:'CARD_FOCUSED'});
  expect(JSON.stringify(source.postMessage.mock.calls)).not.toMatch(/private|orderId|url|receipt/);
});
it('recovers late public metadata only for an attempt whose route and focus already completed',()=>{
  const state=createQaPushObservationAcks(origin),source=sender();state.accepted(url);state.focused(url);state.receive(url,meta,source);
  expect(source.postMessage).toHaveBeenCalledTimes(2);
  const second=sender();state.receive(url.replace('click-00000001','click-00000002'),meta,second);expect(second.postMessage).not.toHaveBeenCalled();
});
it('rejects other workers, destinations, rebound attempts and clears state when the commercial session changes',()=>{
  const state=createQaPushObservationAcks(origin),source=sender();
  state.receive(url,meta,{...source,scriptURL:'https://other.test/sw.js'});state.accepted(url);expect(source.postMessage).not.toHaveBeenCalled();
  state.receive(url,{...meta,attemptId:'bad'},source);state.receive('/?open=requests-customer&orderId=91',meta,source);expect(source.postMessage).not.toHaveBeenCalled();
  state.receive(url,meta,source);expect(source.postMessage).toHaveBeenCalledTimes(1);
  const other=sender();state.receive(url,{...meta,traceId:meta.attemptId},other);state.focused(url);expect(other.postMessage).not.toHaveBeenCalled();
  state.clear();state.receive(url,meta,other);expect(other.postMessage).not.toHaveBeenCalled();
});

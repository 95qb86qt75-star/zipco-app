import { closureBody, type ClosureIntent } from '../../api/businessClosureApi';
import { isRecord } from '../../domain/orderValueParsers';
const KEY='zipco:business-closure:';
const UUID=/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
// A distinct durable slot prevents a lost response from becoming a second intention.
export const closureSlot=(user:string,business:string,process:number)=>`${KEY}${user}:${business}:${process}`;
export function readClosureIntent(storage:Pick<Storage,'getItem'>,slot:string):ClosureIntent|null {
  const text=storage.getItem(slot);if(!text)return null;
  const v:unknown=JSON.parse(text);
  if(!isRecord(v)||!isRecord(v.body)||typeof v.key!=='string'||!UUID.test(v.key)||
    !['BUSINESS_DECLARE_DELIVERY','BUSINESS_CLOSE_WITHOUT_DELIVERY'].includes(String(v.action))||
    !Number.isSafeInteger(v.processId)||Number(v.processId)<1||!Number.isSafeInteger(v.orderId)||Number(v.orderId)<1||
    typeof v.agreementPublicId!=='string'||!v.agreementPublicId||(v.confirmed!==undefined&&typeof v.confirmed!=='boolean'))throw Error('Invalid closure intent');
  const body=closureBody(v.action as ClosureIntent['action'],Number(v.body.expectedVersion),v.body.reasonCode as never,v.body.reasonDetail as string|undefined);
  if(JSON.stringify(body)!==JSON.stringify(v.body))throw Error('Invalid closure body');
  return v as ClosureIntent;
}
export function writeClosureIntent(storage:Pick<Storage,'setItem'|'getItem'>,slot:string,intent:ClosureIntent){
  const text=JSON.stringify(intent);storage.setItem(slot,text);
  if(storage.getItem(slot)!==text)throw Error('Intent not persisted');
}
export function confirmClosureIntent(storage:Storage,slot:string,intent:ClosureIntent){
  writeClosureIntent(storage,slot,{...intent,confirmed:true});
  storage.removeItem(slot);
}
export const businessClosureLocks=new Set<string>();

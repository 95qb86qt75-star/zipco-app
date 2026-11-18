import {validProofIntent,type PaymentProofIntent} from '../../api/customerPaymentProofApi';
export const proofSlot=(user:string,process:number)=>`zipco:payment-proof:${user}:${process}`;
export const proofLocks=new Set<string>();
export function readProofIntent(storage:Pick<Storage,'getItem'>,slot:string){
  const raw=storage.getItem(slot);if(!raw)return null;
  const v:unknown=JSON.parse(raw);
  if(!validProofIntent(v))throw Error('No se pudo recuperar el envío anterior. No enviaremos una nueva declaración.');
  return v;
}
export function writeProofIntent(storage:Pick<Storage,'getItem'|'setItem'>,slot:string,v:PaymentProofIntent){
  if(!validProofIntent(v))throw Error('La declaración no es válida.');
  const text=JSON.stringify(v);storage.setItem(slot,text);
  if(storage.getItem(slot)!==text)throw Error('No pudimos proteger el envío. No se envió nada.');
}

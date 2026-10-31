import {API_BASE_URL} from '../../api/apiConfig';
import {isRecord,parseIsoDate} from './orderValueParsers';

export const CUSTOMER_RECEIPT_CONTRACT='customer-receipt-finalization-v2' as const;
export const CUSTOMER_RECEIPT_HEADERS={'X-Customer-Receipt-Contract':CUSTOMER_RECEIPT_CONTRACT};
export type CustomerReceipt={contract:typeof CUSTOMER_RECEIPT_CONTRACT;status:'AWAITING_RECEIPT'|'RECEIVED_PENDING_FINALIZATION'|'FINALIZED';declarationId:number|null;declaredAt:string|null;finalizedAt:string|null};
export function normalizeCustomerReceipt(value:unknown,state:string):CustomerReceipt|null{
 if(!isRecord(value)||value.contract!==CUSTOMER_RECEIPT_CONTRACT)return null;
 const {status,declarationId,declaredAt,finalizedAt}=value;
 if(status==='AWAITING_RECEIPT')return state==='READY'&&declarationId===null&&declaredAt===null&&finalizedAt===null?{contract:CUSTOMER_RECEIPT_CONTRACT,status,declarationId:null,declaredAt:null,finalizedAt:null}:null;
 if(typeof declarationId!=='number'||!Number.isSafeInteger(declarationId)||declarationId<=0||!parseIsoDate(declaredAt))return null;
 if(status==='RECEIVED_PENDING_FINALIZATION'&&state==='READY'&&finalizedAt===null)return {contract:CUSTOMER_RECEIPT_CONTRACT,status,declarationId,declaredAt:declaredAt as string,finalizedAt:null};
 if(status==='FINALIZED'&&state==='COMPLETED'&&parseIsoDate(finalizedAt)&&Date.parse(finalizedAt as string)>=Date.parse(declaredAt as string))return {contract:CUSTOMER_RECEIPT_CONTRACT,status,declarationId,declaredAt:declaredAt as string,finalizedAt:finalizedAt as string};
 return null;
}
export const receiptPending=(process:{state:string;customerReceipt?:CustomerReceipt}|null|undefined)=>process?.state==='READY'&&process.customerReceipt?.status==='RECEIVED_PENDING_FINALIZATION';
let cached:{token:string;request:Promise<boolean>;enabled?:boolean}|undefined;
export const knownCustomerReceiptHeaders=(token:string):Record<string,string>=>cached?.token===token&&cached.enabled===true?CUSTOMER_RECEIPT_HEADERS:{};
/** Negotiation is per authenticated session. A missing/disabled capability keeps legacy UI. */
export async function customerReceiptHeaders(token:string,probe=false):Promise<Record<string,string>>{
 if(!probe&&(!cached||cached.token!==token))return {};
 if(!cached||cached.token!==token){
  const request=fetch(`${API_BASE_URL}/request-process-capabilities`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal:AbortSignal.timeout(5000)}).then(async response=>{
   if(!response.ok)throw Error('Capability unavailable');const body=await response.json();
   const enabled=isRecord(body)&&isRecord(body.customerReceiptFinalization)&&body.customerReceiptFinalization.contract===CUSTOMER_RECEIPT_CONTRACT&&body.customerReceiptFinalization.enabled===true;
   if(cached?.request===request)cached.enabled=enabled;
   return enabled;
  });
  cached={token,request};request.catch(()=>{if(cached?.request===request)cached=undefined;});
 }
 try{return await cached.request?CUSTOMER_RECEIPT_HEADERS:{};}catch{return {};}
}

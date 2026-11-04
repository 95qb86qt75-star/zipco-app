import {API_BASE_URL} from '../../../api/apiConfig';
import {isRecord} from '../domain/orderValueParsers';
import {customerReceiptHeaders,knownCustomerReceiptHeaders} from '../domain/customerReceiptContract';
import {LOCAL_PICKUP_INFORMATION_CONTRACT,LOCAL_PICKUP_INFORMATION_HEADERS} from '../domain/localPickupInformation';
let cache:{token:string;request:Promise<boolean>;supported?:boolean}|undefined;
export const knownParticipantHeaders=(token:string):Record<string,string>=>({...knownCustomerReceiptHeaders(token),...(cache?.token===token&&cache.supported?LOCAL_PICKUP_INFORMATION_HEADERS:{})});
async function informationHeaders(token:string,probe:boolean){
 if(!probe&&cache?.token!==token)return {};
 if(cache?.token!==token){
  const request=fetch(`${API_BASE_URL}/request-process-capabilities`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal:AbortSignal.timeout(5000)}).then(async r=>{
   if(!r.ok)throw Error('Capability unavailable');const body:unknown=await r.json();
   const cap=isRecord(body)?body.localPickupInformation:null;
   const supported=isRecord(cap)&&cap.contract===LOCAL_PICKUP_INFORMATION_CONTRACT&&cap.enabled===true&&typeof cap.creationEnabled==='boolean';
   if(cache?.request===request)cache.supported=supported;return supported;
  });cache={token,request};request.catch(()=>{if(cache?.request===request)cache=undefined;});
 }
 try{return await cache!.request?LOCAL_PICKUP_INFORMATION_HEADERS:{};}catch{return {};}
}
/** Negotiation only: creationEnabled is never written, and false does not hide already admitted requests. */
export async function participantHeaders(token:string,probe=false):Promise<Record<string,string>>{
 const [receipt,information]=await Promise.all([customerReceiptHeaders(token,probe),informationHeaders(token,probe)]);
 return {...receipt,...information};
}

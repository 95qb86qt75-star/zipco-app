import {isRecord,parseIsoDate} from './orderValueParsers';
export const INITIAL_DECLINE_CONTRACT='whatsapp-coordination-initial-decline-v1' as const;
export const INITIAL_DECLINE_HEADERS={'X-Whatsapp-Coordination-Initial-Decline-Contract':INITIAL_DECLINE_CONTRACT};
export type WhatsappInitialDecline={contract:typeof INITIAL_DECLINE_CONTRACT;id:number;declinedBy:'CUSTOMER'|'BUSINESS';declinedAt:string;recordedVersion:number;active:boolean};
export function normalizeWhatsappInitialDecline(value:unknown,version:number):WhatsappInitialDecline|null{
  if(!isRecord(value)||value.contract!==INITIAL_DECLINE_CONTRACT||!Number.isSafeInteger(value.id)||Number(value.id)<1||!['CUSTOMER','BUSINESS'].includes(String(value.declinedBy))||!parseIsoDate(value.declinedAt)||!Number.isSafeInteger(value.recordedVersion)||Number(value.recordedVersion)<1||Number(value.recordedVersion)>version||typeof value.active!=='boolean')return null;
  return {contract:INITIAL_DECLINE_CONTRACT,id:Number(value.id),declinedBy:value.declinedBy as WhatsappInitialDecline['declinedBy'],declinedAt:value.declinedAt as string,recordedVersion:Number(value.recordedVersion),active:value.active};
}
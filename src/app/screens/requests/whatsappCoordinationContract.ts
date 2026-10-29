import {isRecord,parseIsoDate} from './orderValueParsers';

export const WHATSAPP_COORDINATION_CONTRACT='whatsapp-coordination-v1' as const;
export type WhatsappCoordination={contract:typeof WHATSAPP_COORDINATION_CONTRACT;confirmationId:number;initiatedBy:'CUSTOMER'|'BUSINESS';initiatedAt:string;status:'PENDING'|'CONFIRMED'|'DECLINED'|'EXPIRED';respondedBy:'CUSTOMER'|'BUSINESS'|null;respondedAt:string|null};
export function normalizeWhatsappCoordination(raw:unknown):WhatsappCoordination|null{
  if(!isRecord(raw)||raw.contract!==WHATSAPP_COORDINATION_CONTRACT||!Number.isSafeInteger(raw.confirmationId)||Number(raw.confirmationId)<1||!['CUSTOMER','BUSINESS'].includes(String(raw.initiatedBy))||!parseIsoDate(raw.initiatedAt)||!['PENDING','CONFIRMED','DECLINED','EXPIRED'].includes(String(raw.status)))return null;
  const answered=['CONFIRMED','DECLINED'].includes(String(raw.status));
  if(answered? !['CUSTOMER','BUSINESS'].includes(String(raw.respondedBy))||raw.respondedBy===raw.initiatedBy||!parseIsoDate(raw.respondedAt):raw.respondedBy!==null||raw.respondedAt!==null)return null;
  return {contract:WHATSAPP_COORDINATION_CONTRACT,confirmationId:Number(raw.confirmationId),initiatedBy:raw.initiatedBy as WhatsappCoordination['initiatedBy'],initiatedAt:raw.initiatedAt as string,status:raw.status as WhatsappCoordination['status'],respondedBy:raw.respondedBy as WhatsappCoordination['respondedBy'],respondedAt:raw.respondedAt as string|null};
}

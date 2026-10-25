import { isRecord, parseIsoDate } from './orderValueParsers';
import {RESERVATION_QUERY,normalizeReservationOffer,type ReservationOffer} from './reservationContract';

export const AVAILABILITY_QUERY = RESERVATION_QUERY;
export const AVAILABILITY_FLOW = 'AVAILABILITY_V1' as const;
export const BUSINESS_CONTACT_VERSION = 'availability-business-whatsapp-v1' as const;
export const BUSINESS_CONTACT_COPY = 'Al confirmar, autorizas compartir el teléfono de tu perfil con este cliente si decide continuar con la compra.';
export const CONTACT_VERSION = 'availability-contact-v1' as const;
export const CONTACT_COPY = 'Autorizo compartir el teléfono de mi perfil con la otra parte para coordinar exclusivamente este pedido.';
export const AVAILABILITY_ACTION_PATHS = {
  CONFIRM_AVAILABILITY: 'confirm-availability', CONTINUE_REQUEST: 'continue-request',
  DECLINE_REQUEST: 'decline-request', WITHDRAW_AVAILABILITY: 'withdraw-availability',
  CANCEL_PICKUP: 'cancel-pickup', REVOKE_CONTACT_CONSENT: 'revoke-contact-consent',
} as const;
export type AvailabilityAction = keyof typeof AVAILABILITY_ACTION_PATHS;
export type BusinessContactConsent = { accepted: true; textVersion: typeof BUSINESS_CONTACT_VERSION };
export type FulfillmentChoice = { path: 'WHATSAPP'; businessContactConsent: BusinessContactConsent }
  | { path: 'LOCAL_PICKUP'; customerMessage?: string; scheduleOrAddress?: string; allowCustomerWhatsapp: boolean; businessContactConsent?: BusinessContactConsent; reservationOffer?:ReservationOffer };
export type AvailabilityPlan = {
  availabilityConfirmationId: number; proposalId: number; path: 'WHATSAPP' | 'LOCAL_PICKUP';
  customerMessage: string | null; scheduleOrAddress: string | null; allowCustomerWhatsapp: boolean; confirmedAt: string;
  reservationOffer?:ReservationOffer;
};
const id = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v > 0 && v <= 2147483647;
export function normalizeAvailability(value: unknown, proposalId: number): AvailabilityPlan | null {
  if (!isRecord(value) || !id(value.availabilityConfirmationId) || value.proposalId !== proposalId ||
      !['WHATSAPP', 'LOCAL_PICKUP'].includes(String(value.path)) || typeof value.allowCustomerWhatsapp !== 'boolean' || !parseIsoDate(value.confirmedAt)) return null;
  if (value.path === 'WHATSAPP' ? value.allowCustomerWhatsapp !== true || value.customerMessage !== null || value.scheduleOrAddress !== null
    : typeof value.customerMessage !== 'string' || !value.customerMessage.trim() || Array.from(value.customerMessage).length > 120 ||
      !(value.scheduleOrAddress === null || typeof value.scheduleOrAddress === 'string' && Array.from(value.scheduleOrAddress).length <= 80)) return null;
  const offer=value.reservationOffer===undefined?undefined:normalizeReservationOffer(value.reservationOffer);
  if(offer===null||offer&&value.path!=='LOCAL_PICKUP')return null;
  return { availabilityConfirmationId: value.availabilityConfirmationId, proposalId, path: value.path as AvailabilityPlan['path'],
    customerMessage: value.customerMessage as string | null, scheduleOrAddress: value.scheduleOrAddress as string | null,
    allowCustomerWhatsapp: value.allowCustomerWhatsapp, confirmedAt: value.confirmedAt as string,...(offer?{reservationOffer:offer}:{}) };
}
export const AVAILABILITY_CLOSURES = ['CUSTOMER_DECLINED_CONTINUATION', 'BUSINESS_WITHDREW_AVAILABILITY', 'PICKUP_CANCELLED'] as const;
export type AvailabilityClosureReason = typeof AVAILABILITY_CLOSURES[number];
export const availabilityFlow = (process: { flowContract?: unknown } | null | undefined) => process?.flowContract === AVAILABILITY_FLOW||process?.flowContract==='AVAILABILITY_V2';

import {API_BASE_URL} from '../../api/apiConfig';
import {isRecord} from './orderValueParsers';
import {WHATSAPP_COORDINATION_CONTRACT} from './whatsappCoordinationContract';
import {INITIAL_DECLINE_CONTRACT} from './whatsappInitialDeclineContract';
export type WhatsappCapabilities={enabled:boolean;initialDecline:boolean};
export async function readWhatsappCoordinationCapabilities(token:string,signal?:AbortSignal):Promise<WhatsappCapabilities>{
  const response=await fetch(`${API_BASE_URL}/request-process-capabilities`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal});
  if(!response.ok)throw Error('No pudimos comprobar la coordinación. Intenta actualizar.');
  const raw:unknown=await response.json(),coord=isRecord(raw)&&isRecord(raw.whatsappCoordination)?raw.whatsappCoordination:null;
  const enabled=!!coord&&coord.contract===WHATSAPP_COORDINATION_CONTRACT&&coord.enabled===true;
  return {enabled,initialDecline:enabled&&isRecord(coord?.initialDecline)&&coord.initialDecline.contract===INITIAL_DECLINE_CONTRACT&&coord.initialDecline.enabled===true};
}
export async function readWhatsappCoordinationCapability(token:string,signal?:AbortSignal){return (await readWhatsappCoordinationCapabilities(token,signal)).enabled;}
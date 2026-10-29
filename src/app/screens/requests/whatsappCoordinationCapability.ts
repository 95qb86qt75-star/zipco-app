import {API_BASE_URL} from '../../api/apiConfig';
import {isRecord} from './orderValueParsers';
import {WHATSAPP_COORDINATION_CONTRACT} from './whatsappCoordinationContract';

export async function readWhatsappCoordinationCapability(token:string,signal?:AbortSignal){
  const response=await fetch(`${API_BASE_URL}/request-process-capabilities`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal});
  if(!response.ok)throw Error('No pudimos comprobar la coordinación. Intenta actualizar.');
  const raw:unknown=await response.json();
  return isRecord(raw)&&isRecord(raw.whatsappCoordination)&&raw.whatsappCoordination.contract===WHATSAPP_COORDINATION_CONTRACT&&raw.whatsappCoordination.enabled===true;
}

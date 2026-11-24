import { useEffect } from 'react';
import type { BusinessRequest, MyOrder } from './types';
import { readCoordinationSession, subscribeCoordinationSession } from './coordinationSession';

type Mark = { state: 'opened' | 'left' | 'dismissed'; at: number; page: string };
const PREFIX = 'zipco-wa-return:v1:';
const PAGE = `${Date.now()}:${Math.random()}`;
const memory = new Map<string, Mark>();
// Transient presentation only: keep the initiating card mounted while OPEN verifies
// its receipt and prepares navigation. Never used as shared server evidence.
const launches = new Map<string, symbol>();
const presentationListeners = new Set<()=>void>();
const CHANGE = 'zipco-whatsapp-return';
export const ASK_DELAY_MS = 4000;
const DISMISS_MS = 30 * 60 * 1000;
const MAX_AGE_MS = 12 * 60 * 60 * 1000;
let asking: { key: string; owner: object } | null = null;
const presentationChanged = () => presentationListeners.forEach(callback=>callback());
const changed = () => {window.dispatchEvent(new Event(CHANGE));presentationChanged();};

function accountPrefix(business=true) {
  const session = readCoordinationSession();
  if(!business)return session?`${PREFIX}customer:${encodeURIComponent(session.userId)}:`:null;
  return session?.businessId ? `${PREFIX}${encodeURIComponent(session.userId)}:${encodeURIComponent(session.businessId)}:` : null;
}
export function whatsappReturnKey(order: BusinessRequest | MyOrder,business=true) {
  const prefix = accountPrefix(business), process = order.requestProcess;
  return prefix && order.recordState==='available' && (business?'customerName' in order:'businessName' in order) && order.id && process?.id && process.agreementPublicId
    ? `${prefix}${order.id}:${process.id}:${encodeURIComponent(process.agreementPublicId)}` : null;
}
function read(key: string): Mark | null {
  let value: unknown = memory.get(key);
  try { const raw=localStorage.getItem(key); if(raw) value=JSON.parse(raw); } catch { /* Memory fallback, no order action. */ }
  if (!value || typeof value !== 'object') return null;
  const mark=value as Mark;
  const age=Date.now()-mark.at;
  if (!['opened','left','dismissed'].includes(mark.state) || typeof mark.page!=='string' ||
    !Number.isFinite(mark.at) || age<0 || age>=(mark.state==='dismissed'?DISMISS_MS:MAX_AGE_MS)) return null;
  return mark;
}
function write(key:string,state:Mark['state']) {
  const mark={state,at:Date.now(),page:PAGE};memory.set(key,mark);
  try { localStorage.setItem(key,JSON.stringify(mark)); } catch { /* Retain in memory. */ }
  changed();
}
export function markWhatsappOpened(key:string) { write(key,'opened'); }
export function clearWhatsappReturn(key:string) { memory.delete(key); try { localStorage.removeItem(key); } catch { /* No persisted marker. */ } changed(); }
export function dismissWhatsappReturn(key:string) { write(key,'dismissed'); }
export function shouldAskWhatsappReturn(key:string) {
  const mark=read(key);
  // A stored navigation attempt from another page lifetime cannot block recovery forever.
  return !mark || (mark.state!=='dismissed' && (mark.state!=='opened' || mark.page!==PAGE));
}
export function hasWhatsappReturn(key:string){const mark=read(key);return !!mark&&mark.state!=='dismissed';}
export function holdWhatsappPresentation(key:string|null) {
  if(!key)return ()=>{};
  const owner=Symbol();launches.set(key,owner);presentationChanged();
  return ()=>{if(launches.get(key)===owner){launches.delete(key);presentationChanged();}};
}
export function subscribeWhatsappPresentation(callback:()=>void) {presentationListeners.add(callback);return ()=>{presentationListeners.delete(callback);};}
export function isWhatsappPresentationHeld(key:string) {
  const mark=read(key);
  return launches.has(key)||mark?.state==='opened'&&mark.page===PAGE;
}
export function claimWhatsappAsk(key:string,owner:object) {
  if(asking && asking.owner!==owner) return false;
  asking={key,owner};return true;
}
export function releaseWhatsappAsk(owner:object) { if(asking?.owner===owner){asking=null;changed();} }
export function subscribeWhatsappReturn(callback:()=>void) { window.addEventListener(CHANGE,callback); return ()=>window.removeEventListener(CHANGE,callback); }
export function recordWhatsappDeparture() {
  const prefixes=[accountPrefix(),accountPrefix(false)].filter((p):p is string=>!!p); if(!prefixes.length) return;
  const matches=(key:string)=>prefixes.some(prefix=>key.startsWith(prefix));
  const keys=new Set([...memory.keys()].filter(matches));
  try { for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key&&matches(key)) keys.add(key);} } catch { /* Memory-only tracking still works. */ }
  keys.forEach(key=>{if(read(key)?.state==='opened') write(key,'left');});
}
/** One tracker survives card filtering while WhatsApp takes focus. No URL, contact or token is stored. */
export function WhatsappReturnTracker() {
  useEffect(()=>{
    let session=readCoordinationSession();
    const visibility=()=>{if(document.hidden) recordWhatsappDeparture();};
    document.addEventListener('visibilitychange',visibility);
    window.addEventListener('pagehide',recordWhatsappDeparture);
    const observer=typeof MutationObserver==='undefined'?null:new MutationObserver(changed);
    if(document.body)observer?.observe(document.body,{childList:true});
    const unsubscribe=subscribeCoordinationSession(()=>{const next=readCoordinationSession();if(next!==session){session=next;asking=null;changed();}});
    return ()=>{document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',recordWhatsappDeparture);observer?.disconnect();unsubscribe();asking=null;};
  },[]);
  return null;
}

import type {RequestProcessSummary} from '../domain/requestProcess';
export type AvailabilityScheduleDraft={date:string;time:string;note:string;decision:'CONFIRM_REQUESTED_SCHEDULE'|'PROPOSE_OTHER_SCHEDULE';
  mode:''|'FREE'|'PREPAYMENT';amount:string;message:string;address:string;contact:boolean};
export function scheduleDraftSlot(user:string,p:RequestProcessSummary,business:boolean){return `zipco:schedule-draft:${user}:${business?'business':'customer'}:${p.id}`;}
export function readScheduleDraft(slot:string,p:RequestProcessSummary):Partial<AvailabilityScheduleDraft>{
  try{
    const raw=JSON.parse(sessionStorage.getItem(slot)??'null');
    if(!raw||raw.proposalId!==p.currentProposalId||raw.offerId!==p.availability?.availabilityConfirmationId||raw.version!==p.version||!raw.draft)return {};
    const d=raw.draft;
    if(!['date','time','note','amount','message','address'].every(k=>typeof d[k]==='string')||d.note.length>300||d.message.length>120||d.address.length>80||d.amount.length>12||d.date.length>10||d.time.length>5||
      !['CONFIRM_REQUESTED_SCHEDULE','PROPOSE_OTHER_SCHEDULE'].includes(d.decision)||!['','FREE','PREPAYMENT'].includes(d.mode)||typeof d.contact!=='boolean')return {};
    // Only editable choices; an authorization/acceptance is never restored.
    return {date:d.date,time:d.time,note:d.note,amount:d.amount,message:d.message,address:d.address,decision:d.decision,mode:d.mode,contact:d.contact};
  }catch{return {};}
}
export function saveScheduleDraft(slot:string,p:RequestProcessSummary,draft:AvailabilityScheduleDraft){
  try{sessionStorage.setItem(slot,JSON.stringify({proposalId:p.currentProposalId,offerId:p.availability?.availabilityConfirmationId,version:p.version,draft}));}catch{/* A draft is optional; command UUID persistence is enforced separately. */}
}
export function clearScheduleDraft(slot:string){try{sessionStorage.removeItem(slot);}catch{/* Never replay an operation to clear a local draft. */}}

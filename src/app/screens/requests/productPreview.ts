import {isRecord} from './orderValueParsers';

export type ProductPreviewItem={lineIndex:number;catalogItemId:number|null;source:'CATALOG'|'CUSTOM';name:string;description:string;imageUrl:string|null;quantity:number;unitPriceClp:number|null;subtotalClp:number};
export type ProductPreview={contract:'order-product-preview-v1';proposalId:number;items:ProductPreviewItem[]};
const positive=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>0;
const price=(v:unknown):v is number=>positive(v)&&v<=50_000_000;
export const productImageUrl=(v:unknown):string|null=>typeof v==='string'&&v.length<=2048&&/^https:\/\/res\.cloudinary\.com\/[^/?#\s]+\/image\/upload\/[^\s]+$/.test(v)?v:null;

// Optional visual metadata must never invalidate an otherwise usable process.
export function normalizeProductPreview(value:unknown,expectedProposalId?:number):ProductPreview|undefined{
  if(!isRecord(value)||value.contract!=='order-product-preview-v1'||!positive(value.proposalId)||
    expectedProposalId!==undefined&&value.proposalId!==expectedProposalId||!Array.isArray(value.items)||!value.items.length||value.items.length>20)return;
  const items:ProductPreviewItem[]=[];
  for(const [index,raw] of value.items.entries()){
    if(!isRecord(raw)||raw.lineIndex!==index||!['CATALOG','CUSTOM'].includes(String(raw.source))||
      typeof raw.name!=='string'||!raw.name.trim()||typeof raw.description!=='string'||!positive(raw.quantity)||raw.quantity>99||!price(raw.subtotalClp))return;
    const custom=raw.source==='CUSTOM';
    if(custom?raw.catalogItemId!==null||raw.unitPriceClp!==null:!positive(raw.catalogItemId)||!price(raw.unitPriceClp)||raw.quantity*raw.unitPriceClp!==raw.subtotalClp)return;
    items.push({lineIndex:index,catalogItemId:raw.catalogItemId as number|null,source:custom?'CUSTOM':'CATALOG',name:raw.name,description:raw.description,
      imageUrl:custom?null:productImageUrl(raw.imageUrl),quantity:raw.quantity,unitPriceClp:raw.unitPriceClp as number|null,subtotalClp:raw.subtotalClp});
  }
  if(items.reduce((sum,item)=>sum+item.subtotalClp,0)>50_000_000)return;
  return {contract:'order-product-preview-v1',proposalId:value.proposalId,items};
}

// Match a preview to this immutable snapshot before displaying its image/text.
export function previewMatchesSnapshot(preview:ProductPreview|undefined,items:readonly {catalogItemId:number|null;nameSnapshot:string;descriptionSnapshot:string;quantity:number;unitPriceClpSnapshot:number|null;subtotalClp:number}[],total:number){
  return !!preview&&preview.items.length===items.length&&preview.items.reduce((sum,item)=>sum+item.subtotalClp,0)===total&&preview.items.every((item,index)=>{
    const line=items[index];return item.catalogItemId===line.catalogItemId&&item.name===line.nameSnapshot&&item.description===line.descriptionSnapshot&&item.quantity===line.quantity&&item.unitPriceClp===line.unitPriceClpSnapshot&&item.subtotalClp===line.subtotalClp;
  });
}

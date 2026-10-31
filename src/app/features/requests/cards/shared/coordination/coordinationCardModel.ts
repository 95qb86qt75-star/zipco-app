import type {ReactNode} from 'react';
export type CoordinationCardModel={mode:'question'|'confirm'|'ownPending'|'declined';declinedBySelf?:boolean;expanded:boolean;attention:boolean;busy:boolean;canYes:boolean;canNo:boolean;error:string;recovery?:ReactNode;onToggle:()=>void;onYes:()=>void;onNo:()=>void;onCancel:()=>void;onReturn:()=>void};
export type CoordinationWaitingCardProps={id:number;name:string;price:number|null;quantity:number;model:CoordinationCardModel;children:ReactNode;business?:boolean;items?:{name:string;quantity:number}[]};

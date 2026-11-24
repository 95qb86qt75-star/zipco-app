import {createContext,useContext,useRef,useState,type ReactNode} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {ShoppingBag,X} from 'lucide-react';
import type {ProductPreview,ProductPreviewItem} from './productPreview';
import {readCoordinationSession} from './coordinationSession';
import './product-preview.css';

const PreviewContext=createContext<{enabled:boolean;preview?:ProductPreview;caption?:string}>({enabled:false});
export function ProductPreviewScope({preview,proposalId,processId,enabled,caption,children}:{preview?:ProductPreview;proposalId:number;processId:number;enabled:boolean;caption?:string;children:ReactNode}){
  // Receipts may omit visual metadata. Retain only this participant session,
  // process and immutable proposal; never carry a photo into another proposal.
  const key=`${readCoordinationSession()?.revision??'none'}:${processId}:${proposalId}`;
  const known=useRef<{key:string;preview?:ProductPreview}>({key});
  if(known.current.key!==key)known.current={key};
  if(preview?.proposalId===proposalId)known.current.preview=preview;
  return <PreviewContext.Provider value={{enabled:enabled||!!known.current.preview,preview:known.current.preview,caption}}>{children}</PreviewContext.Provider>;
}

function ProductImage({item,large=false}:{item:ProductPreviewItem;large?:boolean}){
  const [broken,setBroken]=useState(false);
  return item.imageUrl&&!broken?<img src={item.imageUrl} alt={large?item.name:''} loading={large?'eager':'lazy'} decoding="async" referrerPolicy="no-referrer" onError={()=>setBroken(true)}/>
    :<span className="zipco-product-image-fallback"><ShoppingBag aria-hidden="true"/>{large&&<small>Imagen no disponible</small>}</span>;
}
const money=(value:number)=>`$${value.toLocaleString('es-CL')}`;

/** With no explicit preview, uses this card's current proposal. Null explicitly
 * disables inheritance (e.g. an old proposal in the conversation history). */
export default function ProductPreviewControl({preview:explicit,className='',fallback,caption}:{preview?:ProductPreview|null;className?:string;fallback?:ReactNode;caption?:string}){
  const context=useContext(PreviewContext),preview=explicit===undefined?context.preview:explicit;
  const [selected,setSelected]=useState<{proposalId:number;lineIndex:number}|null>(null);
  const trigger=useRef<HTMLButtonElement|null>(null);
  const item=selected?.proposalId===preview?.proposalId?preview?.items.find(line=>line.lineIndex===selected.lineIndex):undefined;
  if(!preview){
    if(explicit===undefined&&!context.enabled)return <>{fallback??<span className={`zipco-product-neutral ${className}`} role="img" aria-label="Producto sin imagen disponible"><ShoppingBag aria-hidden="true"/></span>}</>;
    return <span className={`zipco-product-neutral ${className}`} role="img" aria-label="Producto sin vista previa disponible"><ShoppingBag aria-hidden="true"/></span>;
  }
  return <span className={`zipco-product-preview ${className}`} onClick={event=>event.stopPropagation()} onKeyDown={event=>event.stopPropagation()}>
    <span className="zipco-product-thumbs">
      {preview.items.map(line=><button key={`${preview.proposalId}:${line.lineIndex}`} type="button" className="zipco-product-thumb" aria-label={`Ver producto: ${line.name}, línea ${line.lineIndex+1}`} onClick={event=>{trigger.current=event.currentTarget;setSelected({proposalId:preview.proposalId,lineIndex:line.lineIndex});}}>
        <ProductImage key={line.imageUrl} item={line}/><span className="zipco-product-quantity">{line.quantity}×</span>
      </button>)}
    </span>
    <Dialog.Root open={!!item} onOpenChange={open=>{if(!open)setSelected(null);}}><Dialog.Portal>
      <Dialog.Overlay className="zipco-product-overlay"/>
      <Dialog.Content className="zipco-product-sheet" aria-describedby={undefined} onCloseAutoFocus={event=>{event.preventDefault();if(trigger.current?.isConnected)trigger.current.focus({preventScroll:true});}}>
        {item&&<>
          <div className="zipco-product-grab" aria-hidden="true"/>
          <div className="zipco-product-hero"><ProductImage key={`${preview.proposalId}:${item.lineIndex}:${item.imageUrl}`} item={item} large/>
            <Dialog.Close type="button" className="zipco-product-close" aria-label="Cerrar detalle del producto"><X aria-hidden="true"/></Dialog.Close>
          </div>
          <p className="zipco-product-caption">{caption??context.caption??'PRODUCTO DEL PEDIDO'}</p>
          <Dialog.Title className="zipco-product-title">{item.name}</Dialog.Title>
          <p className="zipco-product-description">{item.description||'Sin descripción disponible.'}</p>
          <dl className="zipco-product-prices">
            <div><dt>Cantidad</dt><dd>{item.quantity}×</dd></div>
            <div><dt>Precio unitario</dt><dd>{item.unitPriceClp===null?'No informado':money(item.unitPriceClp)}</dd></div>
            <div><dt>Total de este producto</dt><dd>{money(item.subtotalClp)}</dd></div>
          </dl>
          {preview.items.length>1&&<div className="zipco-product-line-picker" aria-label="Productos de esta propuesta">{preview.items.map(line=><button key={line.lineIndex} type="button" aria-pressed={line.lineIndex===item.lineIndex} onClick={()=>setSelected({proposalId:preview.proposalId,lineIndex:line.lineIndex})}>{line.name}</button>)}</div>}
          <Dialog.Close type="button" className="zipco-product-done">Cerrar</Dialog.Close>
        </>}
      </Dialog.Content>
    </Dialog.Portal></Dialog.Root>
  </span>;
}

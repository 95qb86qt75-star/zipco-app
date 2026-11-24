import * as React from 'react';
import ReservationPanel from '../../../shared/reservations/ReservationPanel';
import {PICKUP_CHOICE_LABELS,type PickupClosureChoice,type CustomerPickupClosureOptions} from '../../../domain/customerPickupClosure';
import {useEffect,useId,useRef,useState} from 'react';
import {Calendar,Check,ChevronDown,ChevronRight,ChevronUp,CircleCheck,FileText,Hourglass,Info,MapPin,MessageCircle,RefreshCw,ShieldCheck,Ticket,X} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import type {ReactNode} from 'react';
import WhatsAppMark from "../../../shared/icons/WhatsAppMark";
import type {AvailabilityPostActionParts} from "../../shared/availability/AvailabilityPostActionsView";


/* ============================================================================================================
   Diseño «Nuevo · Lista» (tablero NegW18) · detalle desplegado. Variantes: A reserva sin pago · B reserva con pago ·
   C sin reserva (retiro local) · D WhatsApp «preparando» · E WhatsApp «esperando coordinación».
   Todo se arma con datos reales que entrega CustomerReceiptFlowCardView; los avisos/recuperación reales (`parts.alerts`) se conservan.
   ============================================================================================================ */
export type NvDetailData={
 variant:'A'|'B'|'C'|'D'|'E';
 items:{name:string;description:string;quantity:number}[];
 /** «1× Flores» o «N productos». */
 itemsText:string;
 /** Nota del cliente (reservationChoice.note, o la explicación «Tu nota» del acuerdo). */
 note:string|null;
 totalClp:number|null;reservedClp:number|null;declaredClp:number|null;
 /** Solo retiro local con hora pedida (offer.simplified.scheduledFor ya formateado con reservationWhen). */
 pickupWhen:string|null;
 /** Texto libre del negocio (availability.customerMessage / scheduleOrAddress). No se reescribe ni se convierte en hora. */
 message:string|null;scheduleOrAddress:string|null;
 /** Solo «Producto recibido» (A/B): datos REALES de la reserva ya resuelta. Sin valor, la línea no se muestra. */
 confirmedAutomatically?:boolean;confirmedAtLabel?:string|null;
 /** Resumen original de la oferta (ReservationOfferSummary real). Describe condiciones ya acordadas, no tareas pendientes. */
 originalOffer?:ReactNode;
};
export type NvFinalizeOption=PickupClosureChoice;
export const NV_FINALIZE_LABEL=PICKUP_CHOICE_LABELS;
export const NvClosureContext=React.createContext<{options:CustomerPickupClosureOptions|null;error:string;pending:boolean;pendingChoice?:PickupClosureChoice|null;check:()=>void;retry:()=>void}|null>(null);

function NvFinalizeDialog({open,onOpenChange,busy,onConfirm,openerRef,onRegularize}:{open:boolean;onOpenChange:(v:boolean)=>void;busy:boolean;onConfirm:(o:NvFinalizeOption)=>void|Promise<boolean>;openerRef:React.RefObject<HTMLElement|null>;onRegularize:()=>void}){
 const [opt,setOpt]=useState<NvFinalizeOption|''>(''),ctx=React.useContext(NvClosureContext);
 useEffect(()=>{if(!open)setOpt('');else if(ctx?.pendingChoice)setOpt(ctx.pendingChoice);},[open,ctx?.pendingChoice]);
 const choices=ctx?.options?.choices??[];
 const blocked=opt==='RECEIVED'&&!!ctx?.options?.receiptBlock;
 const onKey=(e:React.KeyboardEvent<HTMLButtonElement>)=>{
  const i=choices.indexOf(e.currentTarget.dataset.o as NvFinalizeOption),step=e.key==='ArrowDown'||e.key==='ArrowRight'?1:e.key==='ArrowUp'||e.key==='ArrowLeft'?-1:0;
  if(!step)return;e.preventDefault();const next=choices[(i+step+choices.length)%choices.length];setOpt(next);e.currentTarget.parentElement?.querySelector<HTMLButtonElement>('[data-o="'+next+'"]')?.focus();
 };
 return <Dialog.Root open={open} onOpenChange={v=>{if(!busy)onOpenChange(v);}}><Dialog.Portal><Dialog.Overlay className="zipco-nv-ov"/>
  <Dialog.Content aria-busy={busy} className="zipco-nv-fsh" onEscapeKeyDown={e=>{if(busy)e.preventDefault();}} onPointerDownOutside={e=>{if(busy)e.preventDefault();}} onCloseAutoFocus={e=>{const t=openerRef.current;if(t?.isConnected){e.preventDefault();t.focus({preventScroll:true});}}}>
   <p className="zipco-nv-fsh-k">FINALIZAR SOLICITUD</p>
   <Dialog.Title className="zipco-nv-fsh-t">¿Por qué finalizas la solicitud?</Dialog.Title>
   <Dialog.Description>Si ya retiraste, confirmarás recepción y finalizarás el pedido para ambos. Las otras opciones cierran solo tu seguimiento.</Dialog.Description>
   <div className="zipco-nv-f-opts" role="radiogroup" aria-label="Decisión de retiro">
    {choices.map((o,i)=><button key={o} type="button" role="radio" data-o={o} aria-checked={opt===o} tabIndex={opt===o||(!opt&&i===0)?0:-1} className="zipco-nv-f-o" disabled={busy||ctx?.pending} onClick={()=>setOpt(o)} onKeyDown={onKey}><span className="zipco-nv-f-r" aria-hidden="true"/><b>{NV_FINALIZE_LABEL[o]}</b></button>)}
   </div>
   {opt&&opt!=='RECEIVED'&&<p>La solicitud quedará en tu Historial. Esto no confirma retiro, entrega ni pago.</p>}
   {blocked&&<div role="alert"><p>Regulariza las condiciones de la reserva antes de declarar recepción.</p><button type="button" disabled={busy} onClick={()=>{onOpenChange(false);setTimeout(onRegularize,0);}}>Revisar reserva</button></div>}
   {ctx?.error&&<div role="alert"><p>{ctx.error}</p></div>}
   {ctx?.pending&&<div><button type="button" disabled={busy} onClick={ctx.check}>Comprobar estado</button><button type="button" disabled={busy} onClick={ctx.retry}>Reintentar envío original</button></div>}
   <button type="button" className="zipco-nv-f-ok" disabled={!opt||busy||blocked||ctx?.pending} onClick={async()=>{if(opt&&await onConfirm(opt))onOpenChange(false);}}>{busy?'Guardando…':'Confirmar'}</button>
   <Dialog.Close className="zipco-nv-f-bk" disabled={busy}>Volver</Dialog.Close>
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function NvRow({icon,title,sub,onClick,blocked=false,aria,children}:{icon:ReactNode;title:string;sub:ReactNode;onClick?:()=>void;blocked?:boolean;aria?:React.ButtonHTMLAttributes<HTMLButtonElement>;children?:ReactNode}){
 return onClick?<button type="button" className="zipco-nv-l-row" disabled={blocked} onClick={onClick} {...aria}><span className="zipco-nv-l-i">{icon}</span><span className="zipco-nv-l-t"><b>{title}</b><small>{sub}</small></span><ChevronRight size={16} aria-hidden="true"/></button>
  :<div className="zipco-nv-l-row zipco-nv-l-st"><span className="zipco-nv-l-i">{icon}</span><span className="zipco-nv-l-t"><b>{title}</b><small>{sub}</small></span>{children}</div>;
}

export function CustomerNvDetails({data,parts,summary,onConditions,onContact,blocked=false,busy=false,onFinalize}:{data:NvDetailData;parts:AvailabilityPostActionParts|null;summary:string;onConditions:()=>void;onContact?:()=>void;blocked?:boolean;busy?:boolean;onFinalize?:(option:NvFinalizeOption)=>void|Promise<boolean>}){
 const id=useId(),[fold,setFold]=useState(false),[fin,setFin]=useState(false);
 const closure=React.useContext(NvClosureContext),reservationRef=useRef<HTMLElement>(null);
 const foldRef=useRef<HTMLDivElement>(null),opener=useRef<HTMLElement|null>(null);
 useEffect(()=>{const el=foldRef.current;if(el)el.inert=!fold;},[fold]);
 const {variant:v,items,itemsText,note,totalClp,reservedClp,declaredClp,pickupWhen,message,scheduleOrAddress}=data;
 const ab=v==='A'||v==='B',b=v==='B',c=v==='C',pick=ab||c,many=items.length>1;
 const peso=(n:number)=>'$'+n.toLocaleString('es-CL');
 const qty=items.reduce((a,i)=>a+i.quantity,0);
 const kv=(k:string,val:ReactNode)=><div className="zipco-nv-l-kv" key={k}><small>{k}</small><span>{val}</span></div>;
 const pay=c?'No hay reserva para este pedido.':b?'Sí, pago previo de '+peso(reservedClp??0)+'.'+(declaredClp!==null?' El negocio declaró recibido '+peso(declaredClp)+'.':' El negocio aún no declaró haberlo recibido.')
  :'No. El negocio te '+(many?'reservará estos productos':'reservará este producto')+' sin necesidad de pago.';
 const rows=<>
  {kv('PRODUCTO',items.map((x,i)=><React.Fragment key={i}>{i>0&&<span className="zipco-nv-l-sp"/>}<b className="zipco-nv-l-pn">{x.name}</b>{x.description&&<span className="zipco-nv-l-pd">{x.description}</span>}</React.Fragment>))}
  {kv('CANTIDAD',many?qty+' unidades en total ('+items.map(x=>x.quantity).join(' + ')+')':String(items[0]?.quantity??''))}
  {note&&kv('TU NOTA',note)}
  {v==='D'?kv('COORDINACIÓN','Ya coordinaron por WhatsApp. El negocio te avisará cuando esté listo.'):kv(c?'RESERVA':'PAGO POR RESERVA',pay)}
 </>;
 const collapse=(e:React.MouseEvent<HTMLButtonElement>)=>{const t=e.currentTarget.closest('.zipco-nv-x-c')?.querySelector<HTMLButtonElement>('.zipco-nv-x-tg');t?.click();t?.focus({preventScroll:true});};
 const foldId=id+'-fold';
 return <>
  {parts?.has.alerts&&<div className="zipco-nv-x-al">{parts.alerts}</div>}
  {v==='E'
   ?<NvRow icon={<CircleCheck size={16}/>} title="Condiciones aceptadas" sub={summary} onClick={onConditions} blocked={false} aria={{'aria-haspopup':'dialog'}}/>
   :<div className="zipco-nv-l-fold">
    <button type="button" className="zipco-nv-l-row" aria-expanded={fold} aria-controls={foldId} onClick={()=>setFold(x=>!x)}>
     <span className={'zipco-nv-l-i'+(ab?' ok':'')}>{ab?<Ticket size={16}/>:<CircleCheck size={16}/>}</span>
     <span className="zipco-nv-l-t"><b>{ab?'Reserva confirmada':'Detalle'}</b><small>{ab?(b?'Pago previo '+peso(reservedClp??0)+' · no es el total · ':'Sin pago previo · '):''}{itemsText}</small></span>
     <span className="zipco-nv-x-chv zipco-nv-l-cv" aria-hidden="true"><ChevronDown size={14}/></span>
    </button>
    <div className="zipco-nv-x-of" id={foldId} data-open={fold} ref={foldRef}><div className="zipco-nv-x-ofi"><div className="zipco-nv-l-fb">
     {b&&<><div className="zipco-nv-x-money"><div className="zipco-nv-x-mc"><small>TOTAL ACORDADO</small><b data-u={totalClp===null}>{totalClp===null?'Por comprobar':peso(totalClp)}</b><em>Todo el pedido</em></div><div className="zipco-nv-x-mc r"><small>MONTO DE RESERVA</small><b>{peso(reservedClp??0)}</b><em>Pago previo</em></div></div><p className="zipco-nv-x-mn" style={{marginTop:6}}>La reserva no es el total ni un pago verificado por ZIPCO.</p></>}
     <div className="zipco-nv-l-kvs">{rows}</div>
     {v!=='E'&&<button type="button" className="zipco-nv-l-cd" aria-haspopup="dialog" disabled={false} onClick={onConditions}><CircleCheck size={16} aria-hidden="true"/><span>Ver condiciones aceptadas</span><ChevronRight size={16} aria-hidden="true"/></button>}
    </div></div></div>
   </div>}
  {pick&&(c
   ?<NvRow icon={<MapPin size={16}/>} title="Retiro por orden de llegada" sub="El producto no queda reservado y podría agotarse. No es una reserva ni un pago verificado."/>
   :pickupWhen?<NvRow icon={<Calendar size={16}/>} title="Fecha de retiro" sub={pickupWhen}/>:null)}
  {pick&&(message||scheduleOrAddress)&&<NvRow icon={<Info size={16}/>} title="Nota del negocio" sub={<>{message}{scheduleOrAddress&&<><br/><span className="zipco-nv-l-w">{scheduleOrAddress}</span></>}</>}/>}
  {onContact&&<button type="button" className="zipco-nv-l-wa" disabled={blocked} onClick={onContact}><span className="zipco-nv-j-pi"><WhatsAppMark className="h-4 w-4"/></span><span><b>Escribir al negocio</b><small>Opcional · no confirma pago, retiro ni entrega</small></span><ChevronRight size={16} aria-hidden="true"/></button>}
  {parts?.has.contact&&<div className="zipco-nv-x-perm">{parts.contact}</div>}
  {parts?.has.reservation&&<section ref={reservationRef} tabIndex={-1} data-nv-reservation aria-label="Gestiones de reserva">
    {React.isValidElement<React.ComponentProps<typeof ReservationPanel>>(parts.reservation)?React.cloneElement(parts.reservation,{customerDetails:true,render:r=><>
     {r.error}{r.waNotice}
     {r.whatsapp&&<button type="button" className="zipco-nv-l-wa" disabled={blocked||r.busy} onClick={r.whatsapp.onClick}><span className="zipco-nv-j-pi"><WhatsAppMark className="h-4 w-4"/></span><span><b>Escribir al negocio sobre la reserva</b><small>Opcional · no confirma pago, retiro ni entrega</small></span><ChevronRight size={16} aria-hidden="true"/></button>}
     <details><summary>Condiciones originales y gestiones de reserva</summary>{r.notices}<div className="zipco-nv-res-actions">{r.refreshNow&&<button type="button" disabled={r.busy} onClick={r.refreshNow.onClick}>Actualizar reserva</button>}{r.options}</div></details>
    </>}):parts.reservation}
  </section>}
  {closure?.error&&!fin&&<div role="alert"><p>{closure.error}</p></div>}
  {closure?.pending&&!fin&&<div><button type="button" disabled={busy} onClick={closure.check}>Comprobar estado</button><button type="button" disabled={busy} onClick={closure.retry}>Reintentar envío original</button></div>}
  {onFinalize
   ?<><button type="button" className="zipco-nv-m-cx2 zipco-nv-m-fz" aria-haspopup="dialog" disabled={busy||(blocked&&!closure?.pending)} onClick={e=>{opener.current=e.currentTarget;setFin(true);}}><Check size={16} aria-hidden="true"/>Finalizar solicitud</button>
     <NvFinalizeDialog open={fin} onOpenChange={setFin} busy={busy} openerRef={opener} onConfirm={onFinalize} onRegularize={()=>{const el=reservationRef.current;const details=el?.querySelector("details");if(details)details.open=true;el?.focus();el?.scrollIntoView({block:"center",behavior:"instant"});}}/></>
   :null}
  {parts?.has.cancel&&<details className="zipco-nv-cancel-options"><summary>Otras opciones</summary><div className="zipco-nv-cxw">{parts.cancel}</div></details>}
  <button type="button" className="zipco-nv-x-hide" onClick={collapse}>Ocultar detalle<ChevronUp size={14} aria-hidden="true"/></button>
  <p className="zipco-nv-x-pay">ZIPCO no procesa ni verifica pagos.</p>
 </>;
}

/* ============================================================================================================
   «Producto recibido» (tablero NegW19) · detalle desplegado. Variantes A reserva sin pago · B reserva con pago previo · C sin reserva.
   El cliente YA declaró la recepción: la reserva y las condiciones son ANTECEDENTES (no tareas). Solo se muestra lo que el servidor entrega.
   - «Gestiones de la reserva» = ReservationPanel REAL (cloneElement con customerDetails + render). Sus acciones y permisos no cambian;
     «Finalizar mi seguimiento» (key 'finish') queda separado y con otro aspecto: NO finaliza el pedido.
   - El error de la reserva (`r.error`) vive FUERA del pliegue: siempre visible.
   - El botón «Finalizar esta solicitud» NO está aquí: es el ReadyPanel de la tarjeta (CustomerPickupCard → NvReceivedCard).
   ============================================================================================================ */
export function CustomerNvReceivedDetails({data,parts,summary,onConditions,onAgreement,onContact,blocked=false}:{data:NvDetailData;parts:AvailabilityPostActionParts|null;summary:string;onConditions:()=>void;onAgreement?:()=>void;onContact?:()=>void;blocked?:boolean}){
 const id=useId(),[gopen,setGopen]=useState(false);
 const {variant:v,items,note,reservedClp,declaredClp,pickupWhen,message,scheduleOrAddress,confirmedAutomatically,confirmedAtLabel,originalOffer}=data;
 const ab=v!=='C',b=v==='B',many=items.length>1;
 const peso=(n:number)=>'$'+n.toLocaleString('es-CL');
 const collapse=(e:React.MouseEvent<HTMLButtonElement>)=>{const t=e.currentTarget.closest('.zipco-nv-x-c')?.querySelector<HTMLButtonElement>('.zipco-nv-x-tg');t?.click();t?.focus({preventScroll:true});};
 const head=(icon:ReactNode,title:string,tag:string)=><div className="zipco-nv-rc-sh"><span className="zipco-nv-rc-ic">{icon}</span><h5>{title}</h5><span className="zipco-nv-rc-tag">{tag}</span></div>;
 const condRow=<><button type="button" className="zipco-nv-rc-cd" aria-haspopup="dialog" onClick={onConditions}><span className="zipco-nv-rc-ic"><CircleCheck size={15} aria-hidden="true"/></span><span><b>Condiciones aceptadas</b><small>{summary}</small></span><ChevronRight size={16} aria-hidden="true"/></button>
  {onAgreement&&<button type="button" className="zipco-nv-rc-lk" aria-haspopup="dialog" onClick={onAgreement}><FileText size={14} aria-hidden="true"/>Ver acuerdo completo</button>}</>;
 const hasRetiro=many||!!pickupWhen||!!message||!!scheduleOrAddress;
 const reservation=parts?.has.reservation?(React.isValidElement<React.ComponentProps<typeof ReservationPanel>>(parts.reservation)?React.cloneElement(parts.reservation,{customerDetails:true,render:r=>{
  const opts=r.options.filter((o):o is React.ReactElement=>React.isValidElement(o));
  // WhatsApp ya llega como `r.whatsapp`; «Finalizar mi seguimiento» (key 'finish') se separa del resto: solo cierra el seguimiento de la reserva.
  const rest=opts.filter(o=>o.key!=='finish'&&o.key!=='wa'),fin=opts.filter(o=>o.key==='finish');
  const has=!!(r.whatsapp||r.refreshNow||r.waNotice||rest.length||fin.length);
  const foldId=id+'-g';
  return <section data-nv-reservation tabIndex={-1} className="zipco-nv-rc-g" aria-label="Gestiones de la reserva">
   {r.error}
   {has&&<>
    <button type="button" className="zipco-nv-rc-gt" aria-expanded={gopen} aria-controls={foldId} onClick={()=>setGopen(x=>!x)}><span className="zipco-nv-rc-ic"><MessageCircle size={15} aria-hidden="true"/></span><span><b>Gestiones de la reserva</b><small>No finalizan el pedido</small></span><span className="zipco-nv-x-chv" aria-hidden="true"><ChevronDown size={14}/></span></button>
    <div className="zipco-nv-rc-gf" id={foldId} data-open={gopen}><div className="zipco-nv-rc-gfi" ref={el=>{if(el)el.inert=!gopen;}}>
     {r.waNotice}
     <details className="zipco-nv-rc-orig"><summary>Avisos de la reserva</summary>{r.notices}</details>
     {r.whatsapp&&<button type="button" className="zipco-nv-l-wa" disabled={blocked||r.busy} onClick={r.whatsapp.onClick}><span className="zipco-nv-j-pi"><WhatsAppMark className="h-4 w-4"/></span><span><b>Aclarar la reserva por WhatsApp</b><small>Opcional · no confirma pago, retiro ni entrega</small></span><ChevronRight size={16} aria-hidden="true"/></button>}
     <div className="zipco-nv-res-actions">
      {r.refreshNow&&<button type="button" disabled={r.busy} onClick={r.refreshNow.onClick}><RefreshCw size={16} aria-hidden="true"/>Actualizar reserva</button>}
      {rest}
     </div>
     {fin.length>0&&<div className="zipco-nv-rc-gx zipco-nv-res-actions">{fin}</div>}
    </div></div>
   </>}
  </section>;
 }}):parts.reservation):null;
 return <>
  {parts?.has.alerts&&<div className="zipco-nv-x-al">{parts.alerts}</div>}
  {ab&&<section className="zipco-nv-rc-sec" aria-label="Reserva">
   {head(<Check size={15} strokeWidth={3} aria-hidden="true"/>,'Reserva','YA RESUELTA')}
   <p><span className="zipco-nv-rc-chip" data-k={b?'cy':'ok'}>{b?'Con pago previo':'Sin pago previo'}</span></p>
   {b&&<p className="zipco-nv-rc-ln"><CircleCheck size={14} aria-hidden="true"/><span>Reserva con pago previo de {peso(reservedClp??0)}.</span></p>}
   {confirmedAutomatically?<p className="zipco-nv-rc-ln"><Info size={14} aria-hidden="true"/><span>Reserva registrada automáticamente según las condiciones ofrecidas por el negocio.</span></p>
    :confirmedAtLabel?<p className="zipco-nv-rc-ln"><Info size={14} aria-hidden="true"/><span>El negocio confirmó el apartado el {confirmedAtLabel}</span></p>:null}
   {b&&declaredClp!==null&&<p className="zipco-nv-rc-ln" data-w="true"><Info size={14} aria-hidden="true"/><span>El negocio declaró recibido {peso(declaredClp)}. ZIPCO no verificó la transferencia.</span></p>}
   {note&&<div className="zipco-nv-rc-q"><small>NOTA DE RESERVA</small>{note}</div>}
   {condRow}
   {originalOffer&&<details className="zipco-nv-rc-orig"><summary>Condiciones originales de la reserva</summary>{originalOffer}</details>}
  </section>}
  {hasRetiro&&<section className="zipco-nv-rc-sec" aria-label="Retiro en el local">
   {head(<MapPin size={15} aria-hidden="true"/>,'Retiro en el local','RECIBIDO')}
   {many&&<ul className="zipco-nv-rc-pl">{items.map((x,i)=><li key={i}><b>{x.quantity}×</b><span>{x.name}</span></li>)}</ul>}
   {pickupWhen&&<dl className="zipco-nv-rc-kv"><dt>RETIRO SOLICITADO</dt><dd>{pickupWhen}</dd></dl>}
   {message&&<div className="zipco-nv-rc-q" data-biz="true"><small>NOTA DEL NEGOCIO</small>{message}</div>}
   {scheduleOrAddress&&<span className="zipco-nv-rc-addr"><MapPin size={12} aria-hidden="true"/>{scheduleOrAddress}</span>}
  </section>}
  {!ab&&<div className="zipco-nv-rc-solo">{condRow}</div>}
  {onContact&&<button type="button" className="zipco-nv-l-wa" disabled={blocked} onClick={onContact}><span className="zipco-nv-j-pi"><WhatsAppMark className="h-4 w-4"/></span><span><b>Escribir al negocio</b><small>Opcional · no confirma pago, retiro ni entrega</small></span><ChevronRight size={16} aria-hidden="true"/></button>}
  {parts?.has.contact&&<div className="zipco-nv-x-perm">{parts.contact}</div>}
  {reservation}
  {parts?.has.cancel&&<details className="zipco-nv-cancel-options"><summary>Otras opciones</summary><div className="zipco-nv-cxw">{parts.cancel}</div></details>}
  <button type="button" className="zipco-nv-x-hide" onClick={collapse}>Ocultar detalle<ChevronUp size={14} aria-hidden="true"/></button>
  <p className="zipco-nv-x-pay">ZIPCO no procesa ni verifica pagos.</p>
 </>;
}

/** Franja «Condiciones aceptadas»: mismo markup y clases de siempre, compartido por las dos presentaciones. */
function ConditionsStrip({summary,onConditions}:{summary:string;onConditions:()=>void}){
 return <button type="button" className="zipco-co-strip2" onClick={onConditions}><span className="zipco-co-strip2-ic"><CircleCheck size={16}/></span><span style={{minWidth:0,flex:1}}><div className="zipco-co-strip2-l">Condiciones aceptadas</div><div className="zipco-co-strip2-v">{summary}</div></span><span className="zipco-co-strip2-go"><ChevronRight size={16}/></span></button>;
}

/** Presentación de «WhatsApp · esperando al negocio» (prop opcional `waitingDesign`, la envía CustomerReceiptFlowCardView).
 *  Misma lógica y mismos callbacks: solo cambia la colocación. `children` (consentimiento, permisos y avisos reales de
 *  AvailabilityPostActions) se renderiza SIN reconstruirse. Sin la prop, el componente se comporta exactamente como siempre. */
/** Shared by the real card and isolated design preview; callbacks own all actions. (Sin cambios para WhatsApp ni vista previa salvo `waitingDesign`.) */
export default function CustomerReceiptDetails({summary,onConditions,onContact,blocked=false,waitingDesign=false,nv,nvParts=null,busy=false,onFinalize,children}:{summary:string;onConditions:()=>void;onContact?:()=>void;blocked?:boolean;waitingDesign?:boolean;children?:ReactNode;
 /** WhatsApp D/E · diseño «Nuevo · Lista». Con `nv` se ignora `waitingDesign`/`children` y los avisos reales llegan por `nvParts.alerts`. */
 nv?:NvDetailData;nvParts?:AvailabilityPostActionParts|null;busy?:boolean;onFinalize?:(option:NvFinalizeOption)=>void}){
 if(nv)return <CustomerNvDetails data={nv} parts={nvParts} summary={summary} onConditions={onConditions} onContact={onContact} blocked={blocked} busy={busy} onFinalize={onFinalize}/>;

 return <div className={'zipco-receipt-details'+(waitingDesign?' zipco-wa-w-det':'')}>
  {waitingDesign?<div className="zipco-wa-w-tiles" data-solo={!onContact}>
   <button type="button" className="zipco-wa-w-tile" aria-label="Condiciones aceptadas" aria-haspopup="dialog" onClick={onConditions}><span className="zipco-wa-w-ico" data-kind="cond" aria-hidden="true"><CircleCheck size={16} strokeWidth={2.4}/></span><span className="zipco-wa-w-bd"><small className="zipco-wa-w-ey">CONDICIONES ACEPTADAS</small><b>{summary}</b></span></button>
   {onContact&&<button type="button" className="zipco-wa-w-tile zipco-wa-w-wa" disabled={blocked} onClick={onContact}><span className="zipco-wa-w-ico" data-kind="wa" aria-hidden="true"><WhatsAppMark className="h-4 w-4"/></span><span className="zipco-wa-w-bd"><small className="zipco-wa-w-ey">CONTACTO OPCIONAL</small><b>Escribir al negocio</b></span></button>}
  </div>:<><ConditionsStrip summary={summary} onConditions={onConditions}/><p className="mt-3 text-xs">ZIPCO no procesa ni verifica pagos.</p>{onContact&&<button type="button" className="zipco-co-go2" disabled={blocked} onClick={onContact}><WhatsAppMark className="h-4 w-4"/> Escribir al negocio</button>}</>}
  <div key="post-actions" className={waitingDesign?'zipco-wa-w-opts':undefined} style={waitingDesign?undefined:{display:'contents'}}>
   {waitingDesign&&<span className="zipco-wa-w-ico" data-kind="perm" aria-hidden="true"><ShieldCheck size={15} strokeWidth={2.4}/></span>}
   <div key="controls" className={waitingDesign?'zipco-wa-w-opts-bd':undefined} style={waitingDesign?undefined:{display:'contents'}}>{children}</div>
  </div>
  {waitingDesign&&<><p className="zipco-wa-w-pay">ZIPCO no procesa ni verifica pagos.</p><button type="button" className="zipco-wa-w-hide" onClick={event=>{const toggle=event.currentTarget.closest('.zipco-wa-w')?.querySelector<HTMLButtonElement>('.zipco-wa-w-toggle');toggle?.click();toggle?.focus({preventScroll:true});}}>Ocultar detalle<ChevronUp size={14} aria-hidden="true"/></button></>}
 </div>;
}

/** Bloque real de ReservationPanel (no se copia ni se reescribe) dentro de una fila plegable.
 *  Plegado: solo se ven la línea de estado y la línea de importe del propio panel; el resto sigue montado y queda `inert`.
 *  Un error del panel (`role="alert"`) abre la fila y la mantiene abierta; sus controles nunca quedan ocultos.
 *  Altura plegada y desplegada: se miden del DOM real (no hay alturas fijas). */
function ReservationFold({children}:{children:ReactNode}){
 const id=useId(),[open,setOpen]=useState(false),[alert,setAlert]=useState(false),[size,setSize]=useState<{cut:number;full:number}|null>(null);
 const tone='pending'; // This composition is selected by the structured pending-prepayment state.
 const priorInert=useRef(new Map<HTMLElement,boolean>());
 const wrap=useRef<HTMLDivElement>(null),expanded=open||alert,expandedRef=useRef(expanded);expandedRef.current=expanded;
 useEffect(()=>{
  const body=wrap.current;if(!body)return;
  const panel=()=>body.querySelector<HTMLElement>('[data-reservation-panel]');
  const sync=()=>{
   const p=panel();if(!p||p.offsetHeight===0)return; // pestaña oculta: se vuelve a medir al mostrarse (ResizeObserver)
   const kids=Array.from(p.children) as HTMLElement[];
   const amount=(kids[1]?.tagName==='P'?kids[1]:kids[1]?.querySelector<HTMLElement>('p'))??kids[0];
   // Layout coordinates do not change with scroll anchoring or ancestor transforms.
   // body is the positioned offset parent; never derive a height from viewport Y.
   let top=0,node:HTMLElement|null=amount;
   while(node&&node!==body){top+=node.offsetTop;node=node.offsetParent as HTMLElement|null;}
   if(node!==body)return;
   const full=Math.ceil(p.scrollHeight),cut=Math.min(full,Math.max(0,top+amount.offsetHeight+2));
   setSize(prev=>prev&&prev.cut===cut&&prev.full===full?prev:{cut,full});
   const hasAlert=!!p.querySelector('[role="alert"]');setAlert(prev=>prev===hasAlert?prev:hasAlert);
   const hidden=!(expandedRef.current||hasAlert);
   kids.forEach(n=>{
    const after=!!(amount.compareDocumentPosition(n)&Node.DOCUMENT_POSITION_FOLLOWING)&&!n.contains(amount);
    if(after&&hidden){if(!priorInert.current.has(n))priorInert.current.set(n,n.inert);n.inert=true;}else if(priorInert.current.has(n)){n.inert=priorInert.current.get(n)!;priorInert.current.delete(n);}
   });
  };
  sync();
  const ro=new ResizeObserver(sync),mo=new MutationObserver(sync);
  mo.observe(body,{childList:true,characterData:true,subtree:true});
  // Observe natural content, not the clipped box whose max-height this effect sets.
  const p=panel();if(p){ro.observe(p);mo.observe(p,{childList:true,characterData:true,subtree:true});}
  return()=>{ro.disconnect();mo.disconnect();for(const [node,inert] of priorInert.current)node.inert=inert;priorInert.current.clear();};
 },[expanded]);
 return <div className="zipco-pk-row zipco-pk-res" data-tone={tone}>
  <span className="zipco-pk-ico" data-kind="reserva" aria-hidden="true">{tone==='pending'?<Hourglass size={15} strokeWidth={2.4}/>:<Ticket size={15} strokeWidth={2.4}/>}</span>
  <div className="zipco-pk-bd">
   <p className="zipco-pk-ey">RESERVA</p>
   <div ref={wrap} id={id} className="zipco-pk-fold" data-open={expanded} data-measured={!!size} style={size?({'--pk-cut':size.cut+'px','--pk-full':size.full+'px'} as React.CSSProperties):undefined}>{children}</div>
   {!alert&&<button type="button" className="zipco-pk-more" aria-expanded={expanded} aria-controls={id} onClick={()=>setOpen(v=>!v)}><span>{expanded?'Ocultar detalle de la reserva':'Ver detalle de la reserva'}</span><span className="zipco-pk-more-chv" data-open={expanded}><ChevronDown size={14}/></span></button>}
  </div>
 </div>;
}

/** Detalle de «Retiro en el local» del cliente: pestañas «Cómo retirar» / «Contacto y opciones».
 *  - Las dos pestañas están SIEMPRE montadas (la inactiva solo lleva `hidden`): no se pierden motivos, diálogos, reserva ni recuperación.
 *  - Los avisos y la recuperación (`parts.alerts`) viven fuera de las pestañas y se ven siempre.
 *  - Los errores propios de ReservationPanel (no modificado) viven dentro de su pestaña: si aparece uno nuevo en la pestaña oculta, se cambia a ella.
 *  - Las pestañas solo existen si ambas tienen contenido visible real; si no, se apila todo sin barra (nada vacío).
 *  - Cada botón sigue dependiendo de lo que el servidor permite: `onContact`/`parts.*` ya vienen filtrados por permisos. */
function CustomerPickupLineDetails({summary,onConditions,onContact,blocked=false,parts}:{summary:string;onConditions:()=>void;onContact?:()=>void;blocked?:boolean;parts:AvailabilityPostActionParts|null}){
 const id=useId(),[tab,setTab]=useState<0|1>(0);
 const has=parts?.has;
 const firstHas=!!(has?.instructions||has?.reservation);
 const secondHas=!!(onContact||has?.contact||has?.cancel);
 const tabbed=firstHas&&secondHas;
 const active:0|1=tabbed?tab:0;
 const activeRef=useRef(active);activeRef.current=active;
 const panels=[useRef<HTMLDivElement>(null),useRef<HTMLDivElement>(null)];
  const seen=useRef<string[]|null>(null);
 useEffect(()=>{
  if(!tabbed){seen.current=null;return;}
   const errors=()=>panels.map(p=>Array.from(p.current?.querySelectorAll('[role="alert"]')??[]).map(node=>node.textContent?.trim()??'').filter(Boolean).join('\n'));
   seen.current=errors();
  const watch=()=>{
    const now=errors(),before=seen.current??now;seen.current=now;
    const changed=[0,1].find(i=>!!now[i]&&now[i]!==before[i]&&i!==activeRef.current);
    if(changed!==undefined){
     const focused=document.activeElement,previous=activeRef.current;
     const moveFocus=panels[previous].current?.contains(focused)||document.getElementById(`${id}-tab-${previous}`)===focused;
     setTab(changed as 0|1);
     if(moveFocus)document.getElementById(`${id}-tab-${changed}`)?.focus({preventScroll:true});
    }
  };
  const mo=new MutationObserver(watch);
   panels.forEach(p=>{if(p.current)mo.observe(p.current,{childList:true,characterData:true,subtree:true});});
  return()=>mo.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[tabbed]);
 const onKey=(e:React.KeyboardEvent<HTMLButtonElement>)=>{
  if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft'&&e.key!=='Home'&&e.key!=='End')return;
   e.preventDefault();const next:0|1=e.key==='Home'?0:e.key==='End'?1:active===0?1:0;setTab(next);
  document.getElementById(`${id}-tab-${next}`)?.focus();
 };
 const tabBtn=(i:0|1,label:string,icon:ReactNode)=><button type="button" role="tab" id={`${id}-tab-${i}`} aria-selected={active===i} aria-controls={`${id}-panel-${i}`} tabIndex={active===i?0:-1} className="zipco-pickup-tab" onClick={()=>setTab(i)} onKeyDown={onKey}>{icon}{label}</button>;
 const collapse=(e:React.MouseEvent<HTMLButtonElement>)=>{const toggle=e.currentTarget.closest('.zipco-pickup-c')?.querySelector<HTMLButtonElement>('.zipco-pickup-c-toggle,.zipco-pickup-c-head');toggle?.click();toggle?.focus({preventScroll:true});};
 const hide=(i:0|1)=>tabbed&&active!==i;
 return <div className="zipco-receipt-details zipco-pickup-det" data-tabbed={tabbed}>
  {has?.alerts&&<div className="zipco-pickup-alerts">{parts?.alerts}</div>}
  {tabbed&&<div className="zipco-pickup-tabs" role="tablist" aria-label="Detalle del retiro">{tabBtn(0,'Cómo retirar',<MapPin size={14} strokeWidth={2.4} aria-hidden="true"/>)}{tabBtn(1,'Contacto y opciones',<MessageCircle size={14} strokeWidth={2.4} aria-hidden="true"/>)}</div>}
  <div ref={panels[0]} id={`${id}-panel-0`} className="zipco-pickup-panel" {...(tabbed?{role:'tabpanel','aria-labelledby':`${id}-tab-0`}:{})} hidden={hide(0)}>
   <div className="zipco-pk-line">
    {has?.instructions&&<div className="zipco-pk-row"><span className="zipco-pk-ico" data-kind="nota" aria-hidden="true"><MapPin size={15} strokeWidth={2.4}/></span><div className="zipco-pk-bd">{React.isValidElement<{variant?:'default'|'customer'|'customer-line'}>(parts?.instructions)?React.cloneElement(parts.instructions,{variant:'customer-line'}):parts?.instructions}</div></div>}
    {has?.reservation&&<ReservationFold>{parts?.reservation}</ReservationFold>}
    <button type="button" className="zipco-pk-row zipco-pk-cd" aria-haspopup="dialog" onClick={onConditions}><span className="zipco-pk-ico" data-kind="cond" aria-hidden="true"><CircleCheck size={15} strokeWidth={2.4}/></span><span className="zipco-pk-bd"><small className="zipco-pk-ey">CONDICIONES ACEPTADAS</small><b>{summary}</b></span><span className="zipco-pk-go" aria-hidden="true"><ChevronRight size={16}/></span></button>
   </div>
   <p className="zipco-pickup-pay">ZIPCO no procesa ni verifica pagos.</p>
  </div>
  {secondHas&&<div ref={panels[1]} id={`${id}-panel-1`} className="zipco-pickup-panel" {...(tabbed?{role:'tabpanel','aria-labelledby':`${id}-tab-1`}:{})} hidden={hide(1)}>
   <div className="zipco-pk-line">
    {onContact&&<button type="button" className="zipco-co-go2 zipco-pickup-wa zipco-pk-row zipco-pk-cd" disabled={blocked} onClick={onContact}><span className="zipco-pk-ico" data-kind="wa" aria-hidden="true"><WhatsAppMark className="h-4 w-4"/></span><span className="zipco-pk-bd"><small className="zipco-pk-ey">CONTACTO OPCIONAL</small><b>Escribir al negocio</b></span><span className="zipco-pk-go" aria-hidden="true"><ChevronRight size={16}/></span></button>}
    {has?.contact&&<div className="zipco-pk-row"><span className="zipco-pk-ico" data-kind="perm" aria-hidden="true"><ShieldCheck size={15} strokeWidth={2.4}/></span><div className="zipco-pk-bd">{parts?.contact}</div></div>}
    {has?.cancel&&<div className="zipco-pk-row zipco-pk-cx"><span className="zipco-pk-ico" data-kind="cancel" aria-hidden="true"><X size={15} strokeWidth={2.6}/></span><div className="zipco-pk-bd">{parts?.cancel}</div></div>}
   </div>
  </div>}
  <button type="button" className="zipco-pk-hide" onClick={collapse}>Ocultar detalle<ChevronUp size={14} aria-hidden="true"/></button>
 </div>;
}

/** Detalle de «Retiro en el local» con reserva SIN pago previo CONFIRMADA (prop `confirmedFreeDesign`, decidida por el contenedor).
 *  Presentación de «boleto»: pestaña «Cómo retirar» = reserva real (boleto) + nota del negocio + Condiciones aceptadas;
 *  pestaña «Contacto y opciones» = contacto, permiso y cancelar reales, en una tarjeta. Mismas reglas que la variante de línea:
 *  - Ambas pestañas siempre montadas (la inactiva solo lleva `hidden`); teclado ←/→/Inicio/Fin.
 *  - Avisos y recuperación (`parts.alerts`) fuera de las pestañas; un error nuevo en la pestaña oculta cambia a ella.
 *  - Solo se muestra lo que el controlador entrega (`parts.has`, `onContact`). No se cancela ni se retira nada al cambiar de pestaña o plegar. */
function CustomerPickupConfirmedDetails({summary,onConditions,onContact,blocked=false,parts,arrivalDesign=false}:{summary:string;onConditions:()=>void;onContact?:()=>void;blocked?:boolean;parts:AvailabilityPostActionParts|null;arrivalDesign?:boolean}){
 const id=useId(),[tab,setTab]=useState<0|1>(0);
 const has=parts?.has;
 const firstHas=!!(has?.instructions||has?.reservation);
 const secondHas=!!(onContact||has?.contact||has?.cancel);
 const tabbed=firstHas&&secondHas;
 const active:0|1=tabbed?tab:0;
 const activeRef=useRef(active);activeRef.current=active;
 const panels=[useRef<HTMLDivElement>(null),useRef<HTMLDivElement>(null)];
 const seen=useRef<string[]|null>(null);
 useEffect(()=>{
  if(!tabbed){seen.current=null;return;}
  const errors=()=>panels.map(p=>Array.from(p.current?.querySelectorAll('[role="alert"]')??[]).map(node=>node.textContent?.trim()??'').filter(Boolean).join('\n'));
  seen.current=errors();
  const watch=()=>{
   const now=errors(),before=seen.current??now;seen.current=now;
   const changed=[0,1].find(i=>!!now[i]&&now[i]!==before[i]&&i!==activeRef.current);
   if(changed!==undefined){
    const focused=document.activeElement,previous=activeRef.current;
    const moveFocus=panels[previous].current?.contains(focused)||document.getElementById(`${id}-tab-${previous}`)===focused;
    setTab(changed as 0|1);
    if(moveFocus)document.getElementById(`${id}-tab-${changed}`)?.focus({preventScroll:true});
   }
  };
  const mo=new MutationObserver(watch);
  panels.forEach(p=>{if(p.current)mo.observe(p.current,{childList:true,characterData:true,subtree:true});});
  return()=>mo.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[tabbed]);
 const onKey=(e:React.KeyboardEvent<HTMLButtonElement>)=>{
  if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft'&&e.key!=='Home'&&e.key!=='End')return;
  e.preventDefault();const next:0|1=e.key==='Home'?0:e.key==='End'?1:active===0?1:0;setTab(next);
  document.getElementById(`${id}-tab-${next}`)?.focus();
 };
 const tabBtn=(i:0|1,label:string,icon:ReactNode)=><button type="button" role="tab" id={`${id}-tab-${i}`} aria-selected={active===i} aria-controls={`${id}-panel-${i}`} tabIndex={active===i?0:-1} className="zipco-pickup-tab" onClick={()=>setTab(i)} onKeyDown={onKey}>{icon}{label}</button>;
 const collapse=(e:React.MouseEvent<HTMLButtonElement>)=>{const toggle=e.currentTarget.closest('.zipco-pickup-c')?.querySelector<HTMLButtonElement>('.zipco-pickup-c-toggle,.zipco-pickup-c-head');toggle?.click();toggle?.focus({preventScroll:true});};
 const hide=(i:0|1)=>tabbed&&active!==i;
 return <div className="zipco-receipt-details zipco-pickup-det" data-tabbed={tabbed}>
  {has?.alerts&&<div className="zipco-pickup-alerts">{parts?.alerts}</div>}
  {tabbed&&<div className="zipco-pickup-tabs" role="tablist" aria-label="Detalle del retiro">{tabBtn(0,'Cómo retirar',<MapPin size={14} strokeWidth={2.4} aria-hidden="true"/>)}{tabBtn(1,'Contacto y opciones',<MessageCircle size={14} strokeWidth={2.4} aria-hidden="true"/>)}</div>}
  <div ref={panels[0]} id={`${id}-panel-0`} className="zipco-pickup-panel" {...(tabbed?{role:'tabpanel','aria-labelledby':`${id}-tab-0`}:{})} hidden={hide(0)}>
   <div className="zipco-pk-sh">
    {arrivalDesign&&has?.instructions&&<div className="zipco-pk-tk zipco-pk-arrival"><div className="zipco-pk-arrival-title"><b>Retiro en el local</b><span>Por orden de llegada</span></div><p className="zipco-pk-arrival-copy">El producto no queda reservado y podría agotarse.</p>{parts?.instructions}</div>}
    {has?.reservation&&<div className="zipco-pk-tk"><span className="zipco-pk-stamp" aria-hidden="true"><Check size={18} strokeWidth={3}/></span>{parts?.reservation}</div>}
    {!arrivalDesign&&has?.instructions&&<div className="zipco-pk-bub">{React.isValidElement<{variant?:'default'|'customer'|'customer-line'}>(parts?.instructions)?React.cloneElement(parts.instructions,{variant:'customer-line'}):parts?.instructions}</div>}
    <button type="button" className="zipco-pk-cond" aria-haspopup="dialog" onClick={onConditions}><span className="zipco-pk-condi" aria-hidden="true"><CircleCheck size={15} strokeWidth={2.5}/></span><span className="zipco-pk-condt"><small>CONDICIONES ACEPTADAS</small><b>{summary}</b></span><span className="zipco-pk-condg" aria-hidden="true"><ChevronRight size={16} strokeWidth={2.6}/></span></button>
   </div>
   <p className="zipco-pickup-pay">ZIPCO no procesa ni verifica pagos.</p>
  </div>
  {secondHas&&<div ref={panels[1]} id={`${id}-panel-1`} className="zipco-pickup-panel" {...(tabbed?{role:'tabpanel','aria-labelledby':`${id}-tab-1`}:{})} hidden={hide(1)}>
   <div className="zipco-pk-sh zipco-pk-ct">
    {(onContact||has?.contact)&&<div className="zipco-pk-cc">
     {onContact&&<button type="button" className="zipco-pk-wa" disabled={blocked} onClick={onContact}><span className="zipco-pk-wai" aria-hidden="true"><WhatsAppMark className="h-5 w-5"/></span><span className="zipco-pk-wat"><small>CONTACTO OPCIONAL</small><b>Escribir al negocio</b></span><span className="zipco-pk-condg" aria-hidden="true"><ChevronRight size={16} strokeWidth={2.6}/></span></button>}
     {has?.contact&&<div className="zipco-pk-perm"><span className="zipco-pk-permi" aria-hidden="true"><ShieldCheck size={15} strokeWidth={2.4}/></span><div className="zipco-pk-permb">{parts?.contact}</div></div>}
    </div>}
    {has?.cancel&&<div className="zipco-pk-cxw">{parts?.cancel}</div>}
   </div>
  </div>}
  <button type="button" className="zipco-pk-hide" onClick={collapse}>Ocultar detalle<ChevronUp size={14} aria-hidden="true"/></button>
 </div>;
}

function StandardPickupDetails({summary,onConditions,onContact,blocked=false,parts}:{summary:string;onConditions:()=>void;onContact?:()=>void;blocked?:boolean;parts:AvailabilityPostActionParts|null}){
 const id=useId(),[tab,setTab]=useState<0|1>(0);
 const has=parts?.has;
 const firstHas=!!(has?.instructions||has?.reservation);
 const secondHas=!!(onContact||has?.contact||has?.cancel);
 const tabbed=firstHas&&secondHas;
 const active:0|1=tabbed?tab:0;
 const activeRef=useRef(active);activeRef.current=active;
 const panels=[useRef<HTMLDivElement>(null),useRef<HTMLDivElement>(null)];
  const seen=useRef<string[]|null>(null);
 useEffect(()=>{
  if(!tabbed){seen.current=null;return;}
   const errors=()=>panels.map(p=>Array.from(p.current?.querySelectorAll('[role="alert"]')??[]).map(node=>node.textContent?.trim()??'').filter(Boolean).join('\n'));
   seen.current=errors();
  const watch=()=>{
    const now=errors(),before=seen.current??now;seen.current=now;
    const changed=[0,1].find(i=>!!now[i]&&now[i]!==before[i]&&i!==activeRef.current);
    if(changed!==undefined){
     const focused=document.activeElement,previous=activeRef.current;
     const moveFocus=panels[previous].current?.contains(focused)||document.getElementById(`${id}-tab-${previous}`)===focused;
     setTab(changed as 0|1);
     if(moveFocus)document.getElementById(`${id}-tab-${changed}`)?.focus({preventScroll:true});
    }
  };
  const mo=new MutationObserver(watch);
   panels.forEach(p=>{if(p.current)mo.observe(p.current,{childList:true,characterData:true,subtree:true});});
  return()=>mo.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[tabbed]);
 const onKey=(e:React.KeyboardEvent<HTMLButtonElement>)=>{
  if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft'&&e.key!=='Home'&&e.key!=='End')return;
   e.preventDefault();const next:0|1=e.key==='Home'?0:e.key==='End'?1:active===0?1:0;setTab(next);
  document.getElementById(`${id}-tab-${next}`)?.focus();
 };
 const tabBtn=(i:0|1,label:string)=><button type="button" role="tab" id={`${id}-tab-${i}`} aria-selected={active===i} aria-controls={`${id}-panel-${i}`} tabIndex={active===i?0:-1} className="zipco-pickup-tab" onClick={()=>setTab(i)} onKeyDown={onKey}>{label}</button>;
 const hide=(i:0|1)=>tabbed&&active!==i;
 return <div className="zipco-receipt-details zipco-pickup-det" data-tabbed={tabbed}>
  {has?.alerts&&<div className="zipco-pickup-alerts">{parts?.alerts}</div>}
  {tabbed&&<div className="zipco-pickup-tabs" role="tablist" aria-label="Detalle del retiro">{tabBtn(0,'Cómo retirar')}{tabBtn(1,'Contacto y opciones')}</div>}
  <div ref={panels[0]} id={`${id}-panel-0`} className="zipco-pickup-panel" {...(tabbed?{role:'tabpanel','aria-labelledby':`${id}-tab-0`}:{})} hidden={hide(0)}>
   {parts?.instructions}
   {parts?.reservation}
   <ConditionsStrip summary={summary} onConditions={onConditions}/>
   <p className="zipco-pickup-pay">ZIPCO no procesa ni verifica pagos.</p>
  </div>
  {secondHas&&<div ref={panels[1]} id={`${id}-panel-1`} className="zipco-pickup-panel" {...(tabbed?{role:'tabpanel','aria-labelledby':`${id}-tab-1`}:{})} hidden={hide(1)}>
   {onContact&&<><p className="zipco-pickup-k">CONTACTO OPCIONAL</p><button type="button" className="zipco-co-go2 zipco-pickup-wa" disabled={blocked} onClick={onContact}><WhatsAppMark className="h-4 w-4"/> Escribir al negocio</button></>}
   {parts?.contact}
   {parts?.cancel}
  </div>}
 </div>;
}

export function CustomerPickupDetails({lineDesign=false,confirmedFreeDesign=false,arrivalDesign=false,nv,received,onAgreement,busy=false,onFinalize,...props}:React.ComponentProps<typeof StandardPickupDetails>&{lineDesign?:boolean;confirmedFreeDesign?:boolean;arrivalDesign?:boolean;nv?:NvDetailData;busy?:boolean;onFinalize?:(option:NvFinalizeOption)=>void;
 /** «Producto recibido» (NegW19): detalle propio de A/B/C. Tiene prioridad sobre el resto; el cierre lo hace el ReadyPanel de la tarjeta. */
 received?:NvDetailData;onAgreement?:()=>void}){
 // «Producto recibido» (cliente ya declaró recepción): antecedentes + gestiones de la reserva; sin botón de finalizar aquí.
 if(received)return <CustomerNvReceivedDetails data={received} parts={props.parts} summary={props.summary} onConditions={props.onConditions} onAgreement={onAgreement} onContact={props.onContact} blocked={props.blocked}/>;
 // «Nuevo · Lista» (A/B/C) tiene prioridad; lineDesign (pago previo pendiente) y la presentación estándar se conservan.
 if(nv)return <CustomerNvDetails data={nv} parts={props.parts} summary={props.summary} onConditions={props.onConditions} onContact={props.onContact} blocked={props.blocked} busy={busy} onFinalize={onFinalize}/>;
 return lineDesign?<CustomerPickupLineDetails {...props}/>:confirmedFreeDesign||arrivalDesign?<CustomerPickupConfirmedDetails {...props} arrivalDesign={arrivalDesign}/>:<StandardPickupDetails {...props}/>;
}

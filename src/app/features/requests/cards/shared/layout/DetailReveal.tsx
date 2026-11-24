import * as React from 'react';
import { useEffect, useRef, type ReactNode } from 'react';





import "./availability-card-styles.css";
import "./coordination-card-styles.css";
export function DetailReveal({children,expanded,onOpened}:{children:ReactNode;expanded:boolean;onOpened?:()=>void}){
  const element=useRef<HTMLDivElement>(null);
  const opened=useRef(onOpened);opened.current=onOpened;
  useEffect(()=>{if(element.current)element.current.inert=!expanded;},[expanded]);
  useEffect(()=>{
    if(!expanded||!opened.current||!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
    const frame=requestAnimationFrame(()=>opened.current?.());return()=>cancelAnimationFrame(frame);
  },[expanded]);
  // One fold clips a fixed-size body: no parallel layout animations or scaled text.
  return <div className="zipco-avw-reveal" data-folded={!expanded} aria-hidden={!expanded} ref={element}
    onTransitionEnd={event=>{if(expanded&&event.target===event.currentTarget&&event.propertyName==='grid-template-rows')opened.current?.();}}>
    <div className="zipco-avw-reveal-inner">{children}</div>
  </div>;
}

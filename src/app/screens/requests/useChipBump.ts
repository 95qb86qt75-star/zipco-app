import {useEffect,useRef,useState} from 'react';
export default function useChipBump(value:number|null){
  const previous=useRef(value),[bump,setBump]=useState(0);
  useEffect(()=>{const before=previous.current;previous.current=value;if(before===null||value===null||value===before)return;setBump(v=>v===1?2:1);const timer=setTimeout(()=>setBump(0),800);return()=>clearTimeout(timer);},[value]);
  return bump;
}
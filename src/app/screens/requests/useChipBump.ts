import {useEffect,useRef,useState} from 'react';
export default function useChipBump(value:number|null){
  const prev=useRef(value),flip=useRef(false),[name,setName]=useState<string>();
  useEffect(()=>{
    const before=prev.current;prev.current=value;
    if(before===null||value===null){setName(undefined);return;}
    if(before===value)return;
    flip.current=!flip.current;setName(flip.current?'zipco-bump-a':'zipco-bump-b');
    const t=window.setTimeout(()=>setName(undefined),900);return()=>window.clearTimeout(t);
  },[value]);
  return name;
}

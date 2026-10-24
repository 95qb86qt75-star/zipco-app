import { useEffect, useRef, useState } from 'react';
import { actionHologramDuration, announceAction, dismissAction } from './ActionHologram';
import { clearReadyArrival, markJustReady } from './readyArrival';
import { readCoordinationSession, subscribeCoordinationSession } from './coordinationSession';
import type { MyOrder } from './types';

type Seen = { id: number; agreement: string; state: string; version: number; orderType?: MyOrder['orderType'] };
export type ReadyArrival = { chipBump: boolean; tip: boolean };
export default function useReadyTransitions(orders: readonly MyOrder[], onReady: (orderId: number) => void,
  options: { active: boolean; loaded: boolean; navigationKey: string }): ReadyArrival {
  const previous = useRef<Map<string, Seen> | null>(null);
  const identity = useRef(readCoordinationSession());
  const onReadyRef = useRef(onReady); onReadyRef.current = onReady;
  const context = useRef(options); context.current = options;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const batch = useRef<{ until: number; navigation: string; targets: Seen[] } | null>(null);
  const noticeId = useRef<number | undefined>(undefined);
  const [arrival, setArrival] = useState<ReadyArrival>({ chipBump: false, tip: false });
  const initialized = useRef(false);
  if (!initialized.current) { clearReadyArrival(); initialized.current = true; }
  const cancel = () => {
    timers.current.forEach(clearTimeout); timers.current = []; batch.current = null;
    if (noticeId.current !== undefined) dismissAction(noticeId.current);
    noticeId.current = undefined; clearReadyArrival();
  };
  useEffect(() => {
    const unsubscribe = subscribeCoordinationSession(() => {
      if (readCoordinationSession() !== identity.current) {
        cancel(); identity.current = readCoordinationSession(); previous.current = null;
        setArrival({ chipBump: false, tip: false });
      }
    });
    return () => { unsubscribe(); cancel(); };
  }, []);
  useEffect(() => {
    const session = readCoordinationSession();
    if (session !== identity.current) { cancel(); previous.current = null; identity.current = session; }
    if (!options.loaded) { cancel(); setArrival({chipBump:false,tip:false}); return; }
    const next = new Map<string, Seen>();
    orders.forEach(order => {
      const p = order.requestProcess;
      if (order.recordState === 'available' && p?.agreementPublicId)
        next.set(order.id + ':' + p.id + ':' + p.agreementPublicId, { id:order.id, agreement:p.agreementPublicId, state:p.state, version:p.version, orderType:order.orderType });
    });
    const before = previous.current; previous.current = next;
    if (!options.active || !session) { cancel(); setArrival({chipBump:false,tip:false}); return; }
    if (!before || document.visibilityState === 'hidden') return;
    const changed = [...next].filter(([key, now]) => now.state === 'READY' && before.get(key)?.state === 'IN_PROGRESS' && now.version > before.get(key)!.version).map(([,now])=>now);
    if (!changed.length) return;
    if (batch.current && batch.current.until > Date.now()) {
      changed.forEach(order => markJustReady(order.id, order.agreement, batch.current!.until));
      batch.current.targets.push(...changed); return;
    }
    timers.current.forEach(clearTimeout);
    const duration = actionHologramDuration('clientReady');
    const current = { until:Date.now()+duration, navigation:options.navigationKey, targets:changed };
    batch.current = current;
    changed.forEach(order => markJustReady(order.id, order.agreement, current.until));
    const serviceOnly = changed.every(order => order.orderType === 'service');
    noticeId.current = announceAction('clientReady', {
      key:'customer-ready:' + changed.map(order=>order.id+':'+order.agreement+':'+order.version).join(','),
      ...(serviceOnly ? { title:'¡Tu servicio está listo!', description:'El negocio marcó tu servicio como listo. Revisa sus condiciones en Listos.' }
        : changed.some(order => order.orderType !== 'product') ? { description:'El negocio marcó tu solicitud como lista. Revisa las condiciones y los pasos disponibles en Listos.' } : {}),
    });
    const valid = () => readCoordinationSession() === session && context.current.active && context.current.loaded;
    timers.current = [
      setTimeout(() => {
        if (!valid()) return;
        const target = current.targets.find(order => [...(previous.current?.values() ?? [])].some(now => now.id===order.id && now.agreement===order.agreement && now.state==='READY'));
        if (!target) return;
        if (context.current.navigationKey === current.navigation) onReadyRef.current(target.id);
        setArrival({chipBump:true,tip:true});
      },duration),
      setTimeout(() => { if (valid()) setArrival(value=>({...value,chipBump:false})); },duration+1600),
      setTimeout(() => { if (valid()) setArrival({chipBump:false,tip:false}); },duration+3600),
    ];
  }, [orders, options.active, options.loaded]);
  return arrival;
}

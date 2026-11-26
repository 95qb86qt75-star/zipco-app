import * as React from 'react';
import { ArrowDown, RefreshCw } from 'lucide-react';
import { PULL_REFRESH_THRESHOLD } from './pullToRefreshGesture';
import type { PullToRefreshState } from './usePullToRefresh';

const SIZE = 40;

/** Round badge that follows the finger, flips its arrow when release will refresh and spins while refreshing. */
export default function PullIndicator({ distance, refreshing, dragging }: PullToRefreshState) {
  const progress = Math.min(1, distance / PULL_REFRESH_THRESHOLD);
  const visible = distance > 0 || refreshing;
  return (
    <div
      role={refreshing ? 'status' : undefined}
      aria-label={refreshing ? 'Actualizando' : undefined}
      aria-hidden={!refreshing}
      className={`flex items-center justify-center rounded-full bg-white text-teal-600 shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:text-teal-300 dark:ring-slate-700 ${dragging ? '' : 'transition-[transform,opacity] duration-200 ease-out'}`}
      style={{
        width: SIZE,
        height: SIZE,
        opacity: visible ? Math.max(0.35, progress) : 0,
        transform: `translateY(${distance - SIZE}px)`,
      }}
    >
      {refreshing
        ? <RefreshCw className="h-5 w-5 animate-spin motion-reduce:animate-none" />
        : <ArrowDown className="h-5 w-5 transition-transform duration-150" style={{ transform: `rotate(${progress >= 1 ? 180 : 0}deg)` }} />}
    </div>
  );
}

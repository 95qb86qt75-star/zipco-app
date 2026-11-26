import * as React from 'react';
import { bindPullGesture } from './bindPullGesture';
import { PULL_REFRESH_THRESHOLD, shouldRefreshOnRelease } from './pullToRefreshGesture';

const MIN_SPIN_MS = 500;

type Options = {
  /** Element (or document) that receives the touch listeners. */
  getRoot: () => HTMLElement | Document | null;
  resolveStart: (target: EventTarget | null) => Element | null;
  /** Reloads data. The spinner stays until it settles (errors are shown by each screen). */
  onRefresh: () => Promise<unknown> | unknown;
  disabled?: boolean;
};

export type PullToRefreshState = { distance: number; refreshing: boolean; dragging: boolean };

export default function usePullToRefresh({ getRoot, resolveStart, onRefresh, disabled = false }: Options): PullToRefreshState {
  const [distance, setDistance] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const latest = React.useRef({ getRoot, resolveStart, onRefresh });
  latest.current = { getRoot, resolveStart, onRefresh };
  const busy = React.useRef(false);

  React.useEffect(() => {
    const root = latest.current.getRoot();
    if (!root || disabled) return;
    let mounted = true;
    const unbind = bindPullGesture(root, {
      resolveStart: (target) => latest.current.resolveStart(target),
      isBusy: () => busy.current,
      onDragStart: () => setDragging(true),
      onPull: setDistance,
      onRelease: (pulled) => {
        setDragging(false);
        if (!shouldRefreshOnRelease(pulled)) { setDistance(0); return; }
        busy.current = true;
        setRefreshing(true);
        setDistance(PULL_REFRESH_THRESHOLD);
        const startedAt = Date.now();
        Promise.resolve()
          .then(() => latest.current.onRefresh())
          .catch(() => undefined)
          .then(() => new Promise((resolve) => setTimeout(resolve, Math.max(0, MIN_SPIN_MS - (Date.now() - startedAt)))))
          .then(() => {
            busy.current = false;
            if (!mounted) return;
            setRefreshing(false);
            setDistance(0);
          });
      },
    });
    return () => { mounted = false; busy.current = false; unbind(); };
  }, [disabled]);

  return { distance, refreshing, dragging };
}

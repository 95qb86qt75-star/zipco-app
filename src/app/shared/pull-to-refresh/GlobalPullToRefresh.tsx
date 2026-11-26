import * as React from 'react';
import PullIndicator from './PullIndicator';
import { findPullScroller, isEditing } from './bindPullGesture';
import usePullToRefresh from './usePullToRefresh';

type Props = {
  /** Reloads the current screen (the shell remounts it so it fetches again). */
  onRefresh: () => Promise<unknown> | unknown;
  disabled?: boolean;
};

/**
 * App-wide "pull down and release to refresh" for every screen.
 * While a screen with PullToRefreshScroll is mounted this gesture stays off. Touches on fixed sheets/dialogs/bottom navigation, nested scrollers
 * that are not at the top, and pulls while typing in a field never start it.
 */
export default function GlobalPullToRefresh({ onRefresh, disabled = false }: Props) {
  const state = usePullToRefresh({
    getRoot: () => (typeof document === 'undefined' ? null : document),
    resolveStart: (target) => {
      if (isEditing()) return null;
      // A screen with its own in-place refresh (Solicitudes, Configuración del negocio)
      // is never remounted: it refreshes only through its own scroll area.
      if (document.querySelector('[data-pull-refresh-owner]')) return null;
      return findPullScroller(target, null);
    },
    onRefresh,
    disabled,
  });

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[2000] flex justify-center"
      style={{ top: 'env(safe-area-inset-top)' }}
    >
      <PullIndicator {...state} />
    </div>
  );
}

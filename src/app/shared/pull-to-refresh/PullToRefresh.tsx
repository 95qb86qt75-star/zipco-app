import * as React from 'react';
import PullIndicator from './PullIndicator';
import { findPullScroller } from './bindPullGesture';
import usePullToRefresh from './usePullToRefresh';

type Props = Omit<React.HTMLAttributes<HTMLDivElement>, 'ref'> & {
  /** Reloads this screen's own data in place. The spinner stays until it settles. */
  onRefresh: () => Promise<unknown> | unknown;
  disabled?: boolean;
};

/**
 * Scroll container with its own "pull down and release to refresh".
 * Use it in place of a screen's scrolling <div> (same className/data props) when the
 * screen can reload its data in place. It marks itself as owner, so the app-wide
 * gesture (GlobalPullToRefresh) leaves its touches alone.
 */
export default function PullToRefreshScroll({ onRefresh, disabled = false, children, ...divProps }: Props) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const state = usePullToRefresh({
    getRoot: () => scrollRef.current,
    resolveStart: (target) => {
      const container = scrollRef.current;
      if (!container || container.scrollTop > 0) return null;
      return findPullScroller(target, container) ? container : null;
    },
    onRefresh,
    disabled,
  });

  return (
    <div ref={scrollRef} data-pull-refresh-owner="" {...divProps}>
      {/* Zero-height sticky row: the indicator never changes the screen layout. */}
      <div className="pointer-events-none sticky top-0 z-30 flex h-0 justify-center overflow-visible">
        <PullIndicator {...state} />
      </div>
      {children}
    </div>
  );
}

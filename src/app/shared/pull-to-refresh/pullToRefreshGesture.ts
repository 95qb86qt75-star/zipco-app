// Pure rules for the "pull down and release to refresh" gesture.
// Kept free of React/DOM so they can be unit tested in the node environment.

/** Visual distance (px) the indicator must reach to trigger a refresh on release. */
export const PULL_REFRESH_THRESHOLD = 64;
/** Maximum visual distance (px) the indicator can travel. */
export const PULL_REFRESH_MAX = 96;
/** Finger movement (px) before deciding whether the gesture is vertical. */
const DIRECTION_SLOP = 8;

/** Finger distance → indicator distance, with resistance so it feels elastic. */
export function dampenPull(fingerDistance: number): number {
  if (fingerDistance <= 0) return 0;
  return Math.min(PULL_REFRESH_MAX, fingerDistance * 0.5);
}

export type PullDirection = 'pending' | 'pull' | 'ignore';

/**
 * Decide what a finger movement means:
 * - 'pending' while it is too small to tell,
 * - 'pull' when it goes mostly downwards,
 * - 'ignore' when it goes up or sideways (normal scroll, carousels, swipes).
 */
export function classifyPull(dx: number, dy: number): PullDirection {
  if (Math.abs(dx) < DIRECTION_SLOP && Math.abs(dy) < DIRECTION_SLOP) return 'pending';
  if (dy > 0 && dy > Math.abs(dx)) return 'pull';
  return 'ignore';
}

export function shouldRefreshOnRelease(distance: number): boolean {
  return distance >= PULL_REFRESH_THRESHOLD;
}

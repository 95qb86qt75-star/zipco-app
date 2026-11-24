export function nextOrderQuantity(current: number, delta: -1 | 1): number {
  return Math.min(99, Math.max(1, current + delta));
}

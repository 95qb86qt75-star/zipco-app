export function parsePositiveIntegerId(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  }

  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function isOwnBusiness(businessUserId: unknown, currentUserId: unknown): boolean {
  const ownerId = parsePositiveIntegerId(businessUserId);
  const userId = parsePositiveIntegerId(currentUserId);
  return ownerId !== null && userId !== null && ownerId === userId;
}

export function selectionAfterBusinessContextChange<T>(
  _selection: readonly T[],
  _isOwnBusiness: boolean
): T[] {
  return [];
}

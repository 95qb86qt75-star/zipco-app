import { describe, expect, it } from 'vitest';
import { mergeProcessOrderUpdates } from './processOrderUpdates';
import { normalizeBusinessOrdersPayload } from './orderNormalization';
import { rawOrder, pendingProcess, coordinationProcess } from './requestProcessFixtures';

describe('polling after a confirmed acceptance', () => {
  const current = normalizeBusinessOrdersPayload([{ ...rawOrder, status: 'accepted', requestProcess: coordinationProcess }]);
  it('does not roll back a confirmed process when a stale poll finishes', () => {
    const stale = normalizeBusinessOrdersPayload([{ ...rawOrder, requestProcess: pendingProcess }]);
    expect(mergeProcessOrderUpdates(stale, current)).toEqual(current);
    expect(mergeProcessOrderUpdates(normalizeBusinessOrdersPayload([rawOrder]), current)).toEqual(current);
  });
  it('accepts fresh states, including future history with the same process version', () => {
    const fresh = normalizeBusinessOrdersPayload([{ ...rawOrder, status: 'completed', requestProcess: coordinationProcess }]);
    expect(mergeProcessOrderUpdates(fresh, current)).toEqual(fresh);
  });
  it('leaves legacy refreshes unchanged', () => {
    const legacy = normalizeBusinessOrdersPayload([rawOrder]);
    const next = normalizeBusinessOrdersPayload([{ ...rawOrder, status: 'accepted' }]);
    expect(mergeProcessOrderUpdates(next, legacy)).toEqual(next);
  });
});

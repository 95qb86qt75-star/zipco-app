import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ index: 0, selection: null as unknown }));
vi.mock('react', async (original) => ({
  ...await original<typeof import('react')>(),
  useEffect: vi.fn(),
  useRef: (initial: unknown) => ({ current: initial }),
  useState: (initial: unknown) => [state.index++ === 0 ? state.selection : typeof initial === 'function' ? initial() : initial, vi.fn()],
}));
vi.mock('../../notifications/unreadInteractions', async (original) => ({
  ...await original<typeof import('../../notifications/unreadInteractions')>(),
  useUnreadInteractions: () => ({ unread: new Set(), markRead: vi.fn() }),
}));
import BusinessOrdersTab from './BusinessOrdersTab';
import OrderActionModal from './OrderActionModal';
import { normalizeBusinessOrdersPayload } from './orderNormalization';
import { pendingProcess, rawOrder } from './requestProcessFixtures';

beforeEach(() => { state.index = 0; vi.stubGlobal('React', React); vi.stubGlobal('window', { location: { search: '' } }); vi.spyOn(console, 'warn').mockImplementation(() => undefined); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('business acceptance modal classification', () => {
  it.each([
    ['absent', undefined, false], ['null', null, false], ['valid', pendingProcess, true], ['malformed', {}, true],
  ])('classifies %s without changing the legacy or fail-closed flow', (_name, requestProcess, expected) => {
    const raw = requestProcess === undefined ? rawOrder : { ...rawOrder, requestProcess };
    const order = normalizeBusinessOrdersPayload([raw])[0];
    state.selection = { order, action: 'accept' };
    const view = BusinessOrdersTab({ requests: [order], updatingOrderIds: new Set(), onAction: async () => undefined,
      onRetry: async () => true, emptyTitle: '', emptyDescription: '', onProposeAlternative: async () => undefined });
    const modal = React.Children.toArray(view.props.children).find((child) => React.isValidElement(child) && child.type === OrderActionModal) as React.ReactElement<React.ComponentProps<typeof OrderActionModal>>;
    expect(modal.props.processAcceptance).toBe(expected);
  });
});

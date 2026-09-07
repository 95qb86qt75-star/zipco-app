import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import * as React from 'react';
import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import MyOrderCard from '../screens/requests/MyOrderCard';
import type { OrderAction } from '../screens/requests/types';
import {
  createPreviewCallbacks,
  createUnavailablePreviewOrder,
  previewHasNoTransition
} from './DevUnavailableOrderPreview';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('development unavailable-order preview', () => {
  it('keeps both MyOrderCard handlers required in its TypeScript contract', () => {
    expectTypeOf<ComponentProps<typeof MyOrderCard>>().toMatchTypeOf<{
      onAction: (action: OrderAction) => void;
      onRetry: () => void;
    }>();
  });

  it('uses the real normalizer without HTTP or an actionable transition', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const order = createUnavailablePreviewOrder();
    expect(order).toMatchObject({ recordState: 'unavailable', status: 'unavailable', id: null });
    expect(previewHasNoTransition(order)).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('renders the unavailable state with a local retry and no transition actions', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('React', React);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const order = createUnavailablePreviewOrder();
    const callbacks = createPreviewCallbacks();
    const markup = renderToStaticMarkup(React.createElement(MyOrderCard, {
      order,
      isUpdating: false,
      onAction: callbacks.onAction,
      onRetry: callbacks.onRetry
    }));

    expect(markup).toContain('Estado no disponible');
    expect(markup).toContain('Intentar nuevamente');
    expect(markup).not.toContain('Cancelar pedido');
    expect(markup).not.toContain('Confirmar recepci');

    callbacks.onRetry();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

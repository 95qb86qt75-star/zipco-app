import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OrderActionModal from './OrderActionModal';
import { ORDER_ACTION_COPY } from './orderPresentation';
import type { OrderAction } from './types';

const actions = Object.keys(ORDER_ACTION_COPY) as OrderAction[];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('OrderActionModal', () => {
  it.each(actions)('renders specific copy and controls for %s', (action) => {
    vi.stubGlobal('React', React);
    const copy = ORDER_ACTION_COPY[action];
    const markup = renderToStaticMarkup(React.createElement(OrderActionModal, {
      action,
      isSubmitting: false,
      onClose: () => undefined,
      onConfirm: () => undefined
    }));

    expect(markup).toContain(copy.title);
    expect(markup).toContain(copy.description);
    expect(markup).toContain(copy.confirmLabel);
    expect(markup).toContain('Volver');
    expect(markup).not.toContain('Confirma esta acción antes de continuar.');
  });

  it('keeps the loading label independent from the selected action', () => {
    vi.stubGlobal('React', React);
    const markup = renderToStaticMarkup(React.createElement(OrderActionModal, {
      action: 'reject',
      isSubmitting: true,
      onClose: () => undefined,
      onConfirm: () => undefined
    }));

    expect(markup).toContain('Guardando...');
  });
});

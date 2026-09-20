import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BusinessProfileScreen from './BusinessProfileScreen';

const business = {
  id: 50,
  userId: 35,
  name: 'Negocio de prueba',
  products: [{ id: 1, name: 'Producto', price: 1000, mode: 'order' }]
};

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderProfile(currentUserId: unknown, overrides: Record<string, unknown> = {}) {
  vi.stubGlobal('React', React);
  return renderToStaticMarkup(React.createElement(BusinessProfileScreen, {
    business: { ...business, ...overrides },
    currentUserId,
    onBack: () => undefined,
    onCheckout: () => undefined
  }));
}

describe('BusinessProfileScreen ownership mode', () => {
  it('keeps the owner catalog visible without ordering actions', () => {
    const markup = renderProfile('35');
    expect(markup).toContain('Este es tu negocio. Puedes revisar el catálogo, pero no realizar pedidos aquí.');
    expect(markup).toContain('Producto');
    expect(markup).not.toMatch(/>Agregar</);
    expect(markup).not.toContain('Realizar pedido');
  });

  it('loads the public catalog for another user without showing the owner warning', () => {
    const markup = renderProfile('36');
    expect(markup).not.toContain('Este es tu negocio.');
    expect(markup).toContain('Cargando catálogo...');
  });

  it('shows backend distance when exact coordinates are private', () => {
    const markup = renderProfile('36', {
      showOnlyDistance: true,
      latitude: null,
      longitude: null,
      distanceKm: 1.25
    });

    expect(markup).toContain('A 1.3 km de ti');
  });
});

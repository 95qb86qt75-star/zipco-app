import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import CatalogItemForm, { initialOptionalCatalogSections, openOptionalCatalogSection, PRICING_MODE_HELP, toggleOptionalCatalogSection } from './CatalogItemForm';
import type { CatalogItem } from './types';

const item: CatalogItem = {
  id: 1, businessId: 2, name: 'Torta', description: 'Chocolate', kind: 'product',
  pricingMode: 'quote', priceClp: null, startingPriceClp: 12000,
  imageUrl: 'https://res.cloudinary.com/demo/image/upload/torta.jpg', isActive: true, displayOrder: 0,
  createdAt: '2026-09-14T10:00:00.000Z', updatedAt: '2026-09-14T10:00:00.000Z'
};

const renderForm = (editingItem: CatalogItem | null) => renderToStaticMarkup(createElement(CatalogItemForm, {
  item: editingItem, isSaving: false, onCancel: vi.fn(), onSubmit: vi.fn(async () => undefined), onError: vi.fn()
}));

describe('CatalogItemForm mobile presentation', () => {
  it('renders the independent editor header with exactly one close control', () => {
    const html = renderForm(null);
    expect(html).toContain('Nuevo artículo');
    expect(html).toContain('Agrega un producto o servicio a tu catálogo.');
    expect(html.match(/aria-label="Cerrar editor"/g)).toHaveLength(1);
    expect(html).not.toContain('>Cerrar</button>');
  });

  it('starts required detail sections closed for a new item', () => {
    const html = renderForm(null);
    expect(html).toContain('Agregar descripción');
    expect(html).toContain('Agregar imagen');
    expect(html.match(/Obligatoria · Pendiente/g)).toHaveLength(2);
    expect(html).not.toContain('<textarea');
    expect(html).not.toContain('type="file"');
  });

  it('opens and closes either detail section without changing the other', () => {
    const initial = initialOptionalCatalogSections(null);
    expect(openOptionalCatalogSection(initial, 'description')).toEqual({ description: true, image: false });
    expect(openOptionalCatalogSection(initial, 'image')).toEqual({ description: false, image: true });
    expect(toggleOptionalCatalogSection({ description: true, image: false }, 'description')).toEqual({ description: false, image: false });
  });

  it('starts completed details open and shows the image thumbnail when editing', () => {
    const html = renderForm(item);
    expect(initialOptionalCatalogSections(item)).toEqual({ description: true, image: true });
    expect(html).toContain('<textarea');
    expect(html).toContain('type="file"');
    expect(html).toContain(item.imageUrl);
    expect(html).toContain('Miniatura del artículo');
    expect(html.match(/Completada/g)).toHaveLength(2);
  });

  it('shows help only for the selected pricing mode', () => {
    const createHtml = renderForm(null);
    expect(createHtml).toContain(PRICING_MODE_HELP.fixed_price);
    expect(createHtml).not.toContain(PRICING_MODE_HELP.quote);
    expect(createHtml).not.toContain(PRICING_MODE_HELP.view);
    const editHtml = renderForm(item);
    expect(editHtml).toContain(PRICING_MODE_HELP.quote);
    expect(editHtml).not.toContain(PRICING_MODE_HELP.fixed_price);
    expect(editHtml).not.toContain(PRICING_MODE_HELP.view);
  });

  it('renders compact type and pricing controls with their supporting copy', () => {
    const html = renderForm(null);
    expect(html).toContain('space-y-3');
    expect(html).toContain('min-h-11');
    expect(html).toContain('Un bien físico que vendes');
    expect(html).toContain('Un servicio que ofreces');
    expect(html).toContain('Precio fijo');
    expect(html).toContain('Cotizar');
    expect(html).toContain('Solo mostrar');
    expect(html).toContain('Agregar al catálogo');
    expect(html).toContain('placeholder="Ej: 12000"');
  });
});

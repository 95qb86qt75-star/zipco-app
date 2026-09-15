import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import CatalogItemList from './CatalogItemList';
import type { CatalogItem } from './types';

const makeItem = (id: number, isActive: boolean): CatalogItem => ({
  id, businessId: 1, name: `Artículo ${id}`, description: 'Descripción', kind: 'product',
  pricingMode: 'fixed_price', priceClp: 12000, startingPriceClp: null,
  imageUrl: `https://res.cloudinary.com/zipco/image/upload/${id}.jpg`, isActive, displayOrder: id - 1,
  createdAt: '2026-09-14T10:00:00.000Z', updatedAt: '2026-09-14T10:00:00.000Z'
});

const renderList = (changingStatusId: number | null) => renderToStaticMarkup(createElement(CatalogItemList, {
  items: [makeItem(1, true), makeItem(2, false)], changingStatusId, isReordering: false,
  onEdit: vi.fn(), onSetActive: vi.fn(), onMove: vi.fn()
}));

describe('CatalogItemList status switches', () => {
  it('renders accessible switches with their current state and 44px targets', () => {
    const html = renderList(null);
    expect(html.match(/role="switch"/g)).toHaveLength(2);
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('aria-checked="false"');
    expect(html.match(/min-h-11 min-w-11/g)).toHaveLength(2);
    expect(html).toContain('right-3 top-3');
    expect(html.match(/flex min-h-11 items-center justify-center rounded-full/g)).toHaveLength(6);
    expect(html).toContain('justify-end gap-2');
    expect(html).toContain('shadow-sm');
    expect(html).toContain('Activo');
    expect(html).toContain('Inactivo');
  });

  it('disables every switch and identifies the item being saved', () => {
    const html = renderList(1);
    expect(html.match(/role="switch"[^>]*disabled=""/g)).toHaveLength(2);
    expect(html.match(/Guardando\.\.\./g)).toHaveLength(1);
  });
});

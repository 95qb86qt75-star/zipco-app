import type { CatalogItem } from './profile/business-config/types';

export type CatalogItemAction = 'order' | 'quote-soon' | 'service-soon' | 'view';

export function getCatalogPricingCounts(items: readonly CatalogItem[]) {
  return items.reduce((counts, item) => {
    counts[item.pricingMode] += 1;
    return counts;
  }, { fixed_price: 0, quote: 0, view: 0 });
}

export function getCatalogItemAction(item: CatalogItem): CatalogItemAction {
  if (item.pricingMode === 'view') return 'view';
  if (item.kind === 'product' && item.pricingMode === 'fixed_price') return 'order';
  if (item.kind === 'service' && item.pricingMode === 'fixed_price') return 'service-soon';
  return 'quote-soon';
}

export function getPublicCatalogPriceLabel(item: CatalogItem): string | null {
  if (item.pricingMode === 'view') return null;
  if (item.pricingMode === 'quote') return item.startingPriceClp === null
    ? 'A cotizar'
    : `Desde $${item.startingPriceClp.toLocaleString('es-CL')}`;
  return `$${item.priceClp?.toLocaleString('es-CL')}`;
}

export function selectionAfterCatalogChange(selection: readonly number[], items: CatalogItem[]): number[] {
  const orderable = new Set(items.filter((item) => getCatalogItemAction(item) === 'order').map((item) => item.id));
  return [...new Set(selection)].filter((id) => orderable.has(id)).slice(0, 20);
}

export function toggleCatalogSelection(selection: readonly number[], item: CatalogItem): number[] {
  if (getCatalogItemAction(item) !== 'order') return [...selection];
  if (selection.includes(item.id)) return selection.filter((id) => id !== item.id);
  return selection.length >= 20 ? [...selection] : [...selection, item.id];
}

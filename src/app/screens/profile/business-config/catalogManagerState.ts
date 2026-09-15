import type { CatalogItem } from './types';

export function createCatalogOperationRunner() {
  const active = new Set<string>();
  return {
    isActive: (key: string) => active.has(key),
    async run<T>(key: string, operation: () => Promise<T>): Promise<T | null> {
      if (active.has(key)) return null;
      active.add(key);
      try { return await operation(); } finally { active.delete(key); }
    }
  };
}

export function replaceCatalogItem(items: CatalogItem[], updated: CatalogItem): CatalogItem[] {
  return items.map((item) => item.id === updated.id ? updated : item);
}

export function appendCatalogItem(items: CatalogItem[], created: CatalogItem): CatalogItem[] {
  return [...items, created].sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id);
}

export function moveCatalogItemIds(items: CatalogItem[], itemId: number, direction: -1 | 1): number[] | null {
  const index = items.findIndex((item) => item.id === itemId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= items.length) return null;
  const ids = items.map((item) => item.id);
  [ids[index], ids[target]] = [ids[target], ids[index]];
  return ids;
}

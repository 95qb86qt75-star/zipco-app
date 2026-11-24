import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const walk = (directory: string): string[] => fs.existsSync(directory)
  ? fs.readdirSync(directory, {withFileTypes:true}).flatMap(entry => entry.isDirectory()
    ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]) : [];
const source = walk(path.join(root, 'src'));
function resolves(owner: string, specifier: string) {
  const base = path.resolve(path.dirname(owner), specifier.split('?')[0]);
  return [base, ...['.ts','.tsx','.js','.jsx','.mjs','.css','/index.ts','/index.tsx'].map(extension => base + extension)]
    .some(file => fs.existsSync(file) && fs.statSync(file).isFile());
}

describe('canonical frontend feature ownership', () => {
  it('keeps no executable screen implementation or forwarding copy in the retired folder', () => {
    expect(walk(path.join(root, 'src/app/screens')).filter(file => /\.[jt]sx?$/.test(file))).toEqual([]);
  });

  it('resolves static and lazy local imports after moving complete features', () => {
    const missing: string[] = [];
    for (const owner of source.filter(file => /\.[jt]sx?$/.test(file))) {
      const text = fs.readFileSync(owner, 'utf8');
      const references = [
        ...text.matchAll(/\bfrom\s*['"](\.[^'"]+)['"]/g),
        ...text.matchAll(/\bimport\s*['"](\.[^'"]+)['"]/g),
        ...text.matchAll(/\bimport\s*\(\s*['"](\.[^'"]+)['"]/g),
      ];
      for (const match of references) if (!resolves(owner, match[1])) missing.push(path.relative(root, owner) + ': ' + match[1]);
    }
    expect(missing).toEqual([]);
  });

  it('keeps each supported card composition at one canonical source', () => {
    for (const name of [
      'CustomerInitialCoordinationCard', 'CustomerCoordinationQuestionCard',
      'CustomerWhatsappProgressCard', 'CustomerPickupCard', 'CustomerServiceProgressCard',
      'BusinessCoordinationWaitingCard', 'AvailabilityWaitingCard', 'BusinessProgressCardView',
      'CatalogProductCard', 'SearchResultCard', 'BusinessResultCard', 'FavoriteCard',
    ]) {
      expect(source.filter(file => path.basename(file) === name + '.tsx'), name).toHaveLength(1);
    }
  });

  it('resolves every relative stylesheet import without a second old stylesheet', () => {
    const missing: string[] = [];
    for (const owner of source.filter(file => file.endsWith('.css'))) {
      for (const match of fs.readFileSync(owner, 'utf8').matchAll(/@import\s*['"](\.[^'"]+)['"]/g)) {
        if (!resolves(owner, match[1])) missing.push(path.relative(root, owner) + ': ' + match[1]);
      }
    }
    expect(missing).toEqual([]);
    expect(source.some(file => path.basename(file) === 'coordination-v2.css')).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import {
  buildCatalogItemPayload,
  CatalogContractError,
  getCloudinarySecureImageUrl,
  formatClpInput,
  isStrictIsoDate,
  isValidCloudinaryImageUrl,
  normalizeCatalogItem,
  normalizeCatalogItems,
  parseBusinessId,
  validateCatalogItemForm
} from './catalogValidation';
import type { CatalogItemFormState } from './types';

const item = {
  id: 1, businessId: 2, name: 'Torta', description: 'Torta de chocolate', kind: 'product',
  pricingMode: 'fixed_price', priceClp: 12000, startingPriceClp: null,
  imageUrl: 'https://res.cloudinary.com/zipco/image/upload/catalog/torta.jpg', isActive: true, displayOrder: 0,
  createdAt: '2026-09-14T10:00:00.000Z', updatedAt: '2026-09-14T10:00:00.000Z'
};

const form: CatalogItemFormState = {
  name: ' Torta ', description: ' Chocolate ', kind: 'product', pricingMode: 'fixed_price',
  priceClp: '12000', startingPriceClp: '999',
  imageUrl: 'https://res.cloudinary.com/zipco/image/upload/catalog/torta.jpg'
};

describe('catalog validation', () => {
  it('normalizes the strict backend contract', () => expect(normalizeCatalogItem(item)).toMatchObject({ id: 1, priceClp: 12000 }));

  it.each([
    null,
    { ...item, id: '1' },
    { ...item, kind: 'other' },
    { ...item, pricingMode: 'fixed_price', priceClp: null },
    { ...item, pricingMode: 'view', priceClp: 1 },
    { ...item, description: null },
    { ...item, description: '   ' },
    { ...item, imageUrl: null },
    { ...item, imageUrl: 'https://example.test/image.jpg' },
    { ...item, displayOrder: -1 },
    { ...item, createdAt: 'not-a-date' }
  ])('rejects malformed catalog items', (value) => expect(() => normalizeCatalogItem(value)).toThrow(CatalogContractError));

  it('rejects non-array and duplicated collections', () => {
    expect(() => normalizeCatalogItems({ items: [] })).toThrow(CatalogContractError);
    expect(() => normalizeCatalogItems([item, { ...item }])).toThrow('IDs duplicados');
  });

  it('accepts canonical business IDs only', () => {
    expect(parseBusinessId('20')).toBe(20);
    expect(parseBusinessId(20)).toBe(20);
    for (const value of ['', '20.0', '+20', '2e1', 0, -1]) expect(parseBusinessId(value)).toBeNull();
  });

  it('builds fixed, quote and view payloads with incompatible prices cleared', () => {
    expect(buildCatalogItemPayload(form)).toMatchObject({ priceClp: 12000, startingPriceClp: null });
    expect(buildCatalogItemPayload({ ...form, pricingMode: 'quote', priceClp: '12000', startingPriceClp: '' })).toMatchObject({ priceClp: null, startingPriceClp: null });
    expect(buildCatalogItemPayload({ ...form, pricingMode: 'view' })).toMatchObject({ priceClp: null, startingPriceClp: null });
  });

  it('requires a fixed price and applies the exact minimum of $100', () => {
    expect(validateCatalogItemForm({ ...form, priceClp: '' }).priceClp).toBe('Ingresa un precio fijo.');
    expect(validateCatalogItemForm({ ...form, priceClp: '99' }).priceClp).toBe('El precio mínimo es $100.');
    expect(validateCatalogItemForm({ ...form, priceClp: '100' }).priceClp).toBeUndefined();
  });

  it('keeps quote starting price optional and applies the minimum when present', () => {
    const quote = { ...form, pricingMode: 'quote' as const, priceClp: '' };
    expect(validateCatalogItemForm({ ...quote, startingPriceClp: '' }).startingPriceClp).toBeUndefined();
    expect(validateCatalogItemForm({ ...quote, startingPriceClp: '99' }).startingPriceClp).toBe('El precio mínimo es $100.');
    expect(validateCatalogItemForm({ ...quote, startingPriceClp: '100' }).startingPriceClp).toBeUndefined();
  });

  it('formats CLP for display and keeps the payload numeric', () => {
    expect(formatClpInput('12000')).toBe('$12.000');
    expect(formatClpInput('')).toBe('');
    expect(buildCatalogItemPayload({ ...form, priceClp: '12000' }).priceClp).toBe(12000);
  });

  it('rejects backend catalog prices below the contractual minimum', () => {
    expect(() => normalizeCatalogItem({ ...item, priceClp: 99 })).toThrow(CatalogContractError);
    expect(normalizeCatalogItem({ ...item, priceClp: 100 }).priceClp).toBe(100);
    expect(() => normalizeCatalogItem({ ...item, pricingMode: 'quote', priceClp: null, startingPriceClp: 99 })).toThrow(CatalogContractError);
  });

  it('validates names, descriptions, prices and image length', () => {
    const errors = validateCatalogItemForm({ ...form, name: ' ', description: 'x'.repeat(501), priceClp: '0', imageUrl: 'x'.repeat(2049) });
    expect(errors).toMatchObject({ name: expect.any(String), description: expect.any(String), priceClp: expect.any(String), imageUrl: expect.any(String) });
  });

  it.each([
    [null, false],
    ['texto comun', false],
    ['http://res.cloudinary.com/zipco/image/upload/image.jpg', false],
    ['https://example.test/image.jpg', false],
    ['https://res.cloudinary.com/zipco/raw/upload/file.txt', false],
    ['https://res.cloudinary.com/zipco/image/upload/image.jpg', true],
    [`https://res.cloudinary.com/zipco/image/upload/${'x'.repeat(2048)}`, false]
  ])('validates Cloudinary HTTPS image URLs: %s', (value, expected) => {
    expect(isValidCloudinaryImageUrl(value)).toBe(expected);
  });

  it('uses only a valid Cloudinary secure_url and never an insecure fallback', () => {
    expect(getCloudinarySecureImageUrl({ secure_url: 'https://res.cloudinary.com/zipco/image/upload/image.jpg', url: 'http://fallback.test' })).toBe('https://res.cloudinary.com/zipco/image/upload/image.jpg');
    expect(getCloudinarySecureImageUrl({ secure_url: 'http://unsafe.test', url: 'https://fallback.test/image.jpg' })).toBeNull();
    expect(getCloudinarySecureImageUrl({ url: 'https://fallback.test/image.jpg' })).toBeNull();
  });

  it('requires description and image in form payloads', () => {
    expect(validateCatalogItemForm({ ...form, description: '', imageUrl: '' })).toMatchObject({
      description: expect.any(String), imageUrl: expect.any(String)
    });
    expect(() => buildCatalogItemPayload({ ...form, description: '', imageUrl: '' })).toThrow(CatalogContractError);
  });

  it.each([
    ['2026-09-14T10:20:30.000Z', true],
    ['2024-02-29T23:59:59.999Z', true],
    ['2026-02-29T10:00:00.000Z', false],
    ['2026-13-01T10:00:00.000Z', false],
    ['2026-09-14', false],
    ['2026-09-14T10:20:30Z', false],
    ['2026-09-14T10:20:30.000+00:00', false],
    ['not-a-date', false]
  ])('validates strict backend ISO dates: %s', (value, expected) => {
    expect(isStrictIsoDate(value)).toBe(expected);
  });
});

import type {
  CatalogItem,
  CatalogItemFormState,
  CatalogItemKind,
  CatalogItemPricingMode,
  CatalogItemWritePayload
} from './types';

const KINDS: CatalogItemKind[] = ['product', 'service'];
const PRICING_MODES: CatalogItemPricingMode[] = ['fixed_price', 'quote', 'view'];
export const MIN_CATALOG_PRICE_CLP = 100;

export class CatalogContractError extends Error {
  constructor(message = 'La respuesta del catalogo no tiene un formato valido.') {
    super(message);
    this.name = 'CatalogContractError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isValidCatalogPrice(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= MIN_CATALOG_PRICE_CLP;
}

export function isStrictIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

export function isValidCloudinaryImageUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value || value !== value.trim() || value.length > 2048) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:'
      && parsed.hostname === 'res.cloudinary.com'
      && /^\/[^/]+\/image\/upload\/.+/.test(parsed.pathname)
      && !parsed.username
      && !parsed.password;
  } catch {
    return false;
  }
}

export function getCloudinarySecureImageUrl(value: unknown): string | null {
  if (!isRecord(value)) return null;
  return isValidCloudinaryImageUrl(value.secure_url) ? value.secure_url : null;
}

export function parseBusinessId(value: unknown): number | null {
  if (typeof value === 'number') return isPositiveInteger(value) ? value : null;
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return isPositiveInteger(parsed) ? parsed : null;
}

export function normalizeCatalogItem(value: unknown): CatalogItem {
  if (!isRecord(value)) throw new CatalogContractError();
  const kind = value.kind;
  const pricingMode = value.pricingMode;
  const validBase = isPositiveInteger(value.id)
    && isPositiveInteger(value.businessId)
    && typeof value.name === 'string'
    && value.name.trim() !== ''
    && value.name.length <= 120
    && typeof value.description === 'string'
    && value.description.trim() !== ''
    && value.description.length <= 500
    && typeof kind === 'string'
    && KINDS.includes(kind as CatalogItemKind)
    && typeof pricingMode === 'string'
    && PRICING_MODES.includes(pricingMode as CatalogItemPricingMode)
    && isValidCloudinaryImageUrl(value.imageUrl)
    && typeof value.isActive === 'boolean'
    && typeof value.displayOrder === 'number'
    && Number.isSafeInteger(value.displayOrder)
    && value.displayOrder >= 0
    && isStrictIsoDate(value.createdAt)
    && isStrictIsoDate(value.updatedAt);
  if (!validBase) throw new CatalogContractError();

  const priceClp = value.priceClp;
  const startingPriceClp = value.startingPriceClp;
  const validPricing = pricingMode === 'fixed_price'
    ? isValidCatalogPrice(priceClp) && startingPriceClp === null
    : pricingMode === 'quote'
      ? priceClp === null && (startingPriceClp === null || isValidCatalogPrice(startingPriceClp))
      : priceClp === null && startingPriceClp === null;
  if (!validPricing) throw new CatalogContractError();

  return {
    id: value.id as number,
    businessId: value.businessId as number,
    name: (value.name as string).trim(),
    description: (value.description as string).trim(),
    kind: kind as CatalogItemKind,
    pricingMode: pricingMode as CatalogItemPricingMode,
    priceClp: priceClp as number | null,
    startingPriceClp: startingPriceClp as number | null,
    imageUrl: value.imageUrl as string,
    isActive: value.isActive as boolean,
    displayOrder: value.displayOrder as number,
    createdAt: value.createdAt as string,
    updatedAt: value.updatedAt as string
  };
}

export function normalizeCatalogItems(value: unknown): CatalogItem[] {
  if (!Array.isArray(value)) throw new CatalogContractError();
  const items = value.map(normalizeCatalogItem);
  const ids = new Set<number>();
  for (const item of items) {
    if (ids.has(item.id)) throw new CatalogContractError('El catalogo contiene IDs duplicados.');
    ids.add(item.id);
  }
  return items;
}

export type CatalogFormErrors = Partial<Record<keyof CatalogItemFormState, string>>;

function parsePositiveClp(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function formatClpInput(value: string): string {
  if (!/^\d+$/.test(value)) return '';
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? `$${parsed.toLocaleString('es-CL')}` : '';
}

export function validateCatalogItemForm(form: CatalogItemFormState): CatalogFormErrors {
  const errors: CatalogFormErrors = {};
  const name = form.name.trim();
  if (!name) errors.name = 'Ingresa el nombre del producto o servicio.';
  else if (name.length > 120) errors.name = 'El nombre puede tener hasta 120 caracteres.';
  if (!form.description.trim()) errors.description = 'Agrega una descripcion.';
  else if (form.description.trim().length > 500) errors.description = 'La descripcion puede tener hasta 500 caracteres.';
  if (!KINDS.includes(form.kind)) errors.kind = 'Selecciona si es un producto o servicio.';
  if (!PRICING_MODES.includes(form.pricingMode)) errors.pricingMode = 'Selecciona una modalidad valida.';
  if (form.pricingMode === 'fixed_price' && !form.priceClp) {
    errors.priceClp = 'Ingresa un precio fijo.';
  } else if (form.pricingMode === 'fixed_price' && (parsePositiveClp(form.priceClp) ?? 0) < MIN_CATALOG_PRICE_CLP) {
    errors.priceClp = 'El precio mínimo es $100.';
  }
  if (form.pricingMode === 'quote' && form.startingPriceClp && (parsePositiveClp(form.startingPriceClp) ?? 0) < MIN_CATALOG_PRICE_CLP) {
    errors.startingPriceClp = 'El precio mínimo es $100.';
  }
  const imageUrl = form.imageUrl.trim();
  if (!imageUrl) errors.imageUrl = 'Agrega una imagen.';
  else if (!isValidCloudinaryImageUrl(imageUrl)) errors.imageUrl = imageUrl.length > 2048
    ? 'La URL de la imagen es demasiado larga.'
    : 'La imagen debe provenir de Cloudinary mediante HTTPS.';
  return errors;
}

export function buildCatalogItemPayload(form: CatalogItemFormState): CatalogItemWritePayload {
  const errors = validateCatalogItemForm(form);
  if (Object.keys(errors).length > 0) throw new CatalogContractError('Revisa los campos del articulo.');
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    kind: form.kind,
    pricingMode: form.pricingMode,
    priceClp: form.pricingMode === 'fixed_price' ? parsePositiveClp(form.priceClp) : null,
    startingPriceClp: form.pricingMode === 'quote' && form.startingPriceClp
      ? parsePositiveClp(form.startingPriceClp)
      : null,
    imageUrl: form.imageUrl.trim()
  };
}

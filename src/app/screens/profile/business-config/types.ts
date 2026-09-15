export type ScheduleDayId =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type DaySchedule = {
  enabled: boolean;
  open: string;
  close: string;
};

export type BusinessSchedule = Record<ScheduleDayId, DaySchedule>;

export type BusinessCategory = {
  id: string;
  name: string;
  icon: string;
};

export type BusinessDay = {
  id: ScheduleDayId;
  name: string;
};

export type CatalogItemKind = 'product' | 'service';
export type CatalogItemPricingMode = 'fixed_price' | 'quote' | 'view';

export type CatalogItem = {
  id: number;
  businessId: number;
  name: string;
  description: string;
  kind: CatalogItemKind;
  pricingMode: CatalogItemPricingMode;
  priceClp: number | null;
  startingPriceClp: number | null;
  imageUrl: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type CatalogItemFormState = {
  name: string;
  description: string;
  kind: CatalogItemKind;
  pricingMode: CatalogItemPricingMode;
  priceClp: string;
  startingPriceClp: string;
  imageUrl: string;
};

export type CatalogItemWritePayload = {
  name: string;
  description: string;
  kind: CatalogItemKind;
  pricingMode: CatalogItemPricingMode;
  priceClp: number | null;
  startingPriceClp: number | null;
  imageUrl: string;
};

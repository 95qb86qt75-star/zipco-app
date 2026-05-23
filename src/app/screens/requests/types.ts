export type RequestStatus = 'pending' | 'accepted' | 'rejected';

export type Product = {
  name: string;
  quantity: number;
  price: number;
};

export type BusinessRequest = {
  id: number;
  customerName: string;
  customerImage: string;
  date: string;
  status: RequestStatus;
  products: Product[];
  note: string;
  distance: string;
  deliveryDate: string;
  deliveryTime: string;
  needNow: boolean;
};

export type MyOrder = {
  id: number;
  businessName: string;
  businessImage: string;
  date: string;
  status: RequestStatus;
  products: Product[];
  note: string;
  total: number;
  deliveryDate?: string;
  deliveryTime?: string;
};

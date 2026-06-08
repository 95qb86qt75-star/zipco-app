import { useEffect, useState } from 'react';
import type { BusinessRequest, MyOrder, RequestStatus } from './types';

const API_URL = 'https://zipco-backend-production.up.railway.app';

export default function useRequests() {
  const [requests, setRequests] = useState<BusinessRequest[]>([]);
  const [myOrders, setMyOrders] = useState<MyOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasBusiness = typeof window !== 'undefined' && Boolean(localStorage.getItem('zipco-business-id'));

  useEffect(() => {
    const token = localStorage.getItem('zipco-token');
    const businessId = localStorage.getItem('zipco-business-id');

    if (!token) {
      setIsLoading(false);
      return;
    }

    const parseProducts = (products: any) => {
      if (!products) return [];
      if (Array.isArray(products)) return products;

      try {
        const parsedProducts = JSON.parse(products);
        return Array.isArray(parsedProducts) ? parsedProducts : [];
      } catch (error) {
        return [];
      }
    };

    const formatOrderDate = (dateString: string) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
    };

    const businessNameCache = new Map<number, string>();

    const getBusinessName = async (businessId: number) => {
      if (!businessId) return '';
      if (businessNameCache.has(businessId)) return businessNameCache.get(businessId) ?? '';

      const response = await fetch(`${API_URL}/businesses/${businessId}`);
      if (!response.ok) return '';

      const business = await response.json();
      const businessName = business.name ?? '';
      businessNameCache.set(businessId, businessName);
      return businessName;
    };

    const normalizeMyOrder = async (order: any): Promise<MyOrder> => {
      const businessName = order.businessName ?? order.business?.name ?? await getBusinessName(Number(order.businessId));

      return {
        id: order.id,
        businessName: businessName || `Negocio #${order.businessId}`,
        businessImage: order.businessImage ?? order.business?.image ?? order.business?.photo ?? 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
        date: formatOrderDate(order.createdAt),
        status: order.status ?? 'pending',
        products: parseProducts(order.products),
        note: order.note ?? '',
        total: Number(order.total ?? 0),
        deliveryDate: order.deliveryDate ?? '',
        deliveryTime: order.deliveryTime ?? '',
        referencePhoto: order.referencePhoto ?? null
      };
    };

    const normalizeBusinessRequest = (order: any): BusinessRequest => ({
      id: order.id,
      customerName: order.customerName ?? order.user?.name ?? 'Cliente',
      customerImage: order.customerImage ?? order.user?.profileImage ?? 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
      date: formatOrderDate(order.createdAt),
      status: order.status ?? 'pending',
      products: parseProducts(order.products),
      note: order.note ?? '',
      distance: '',
      deliveryDate: order.deliveryDate ?? '',
      deliveryTime: order.deliveryTime ?? '',
      needNow: Boolean(order.needNow),
      referencePhoto: order.referencePhoto ?? null
    });

    const loadOrders = async () => {
      setIsLoading(true);

      try {
        const myOrdersResponse = await fetch(`${API_URL}/orders/my-orders`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (myOrdersResponse.ok) {
          const data = await myOrdersResponse.json();
          const orders = Array.isArray(data) ? data : data.orders ?? data.results ?? [];
          setMyOrders(await Promise.all(orders.map(normalizeMyOrder)));
        }

        if (businessId) {
          const businessOrdersResponse = await fetch(`${API_URL}/orders/business/${businessId}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (businessOrdersResponse.ok) {
            const data = await businessOrdersResponse.json();
            const orders = Array.isArray(data) ? data : data.orders ?? data.results ?? [];
            setRequests(orders.map(normalizeBusinessRequest));
          }
        }
      } catch (error) {
        setMyOrders([]);
        setRequests([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  const updateRequestStatus = async (requestId: number, status: RequestStatus) => {
    const token = localStorage.getItem('zipco-token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/orders/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) return;

      setRequests((currentRequests) => (
        currentRequests.map((req) => (req.id === requestId ? { ...req, status } : req))
      ));
    } catch (error) {
      return;
    }
  };

  return {
    hasBusiness,
    isLoading,
    myOrders,
    requests,
    handleAccept: (requestId: number) => updateRequestStatus(requestId, 'accepted'),
    handleReject: (requestId: number) => updateRequestStatus(requestId, 'rejected')
  };
}

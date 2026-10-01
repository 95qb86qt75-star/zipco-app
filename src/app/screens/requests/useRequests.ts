import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../../api/apiConfig';
import { showAppToast } from '../Toast';
import { createOrderOperationGuard } from './orderActionGuard';
import { getOrderErrorPolicy } from './orderErrorPolicy';
import { actionToPayload } from './orderPresentation';
import {
  canSubmitOrderStatus,
  getActionableOrder,
  normalizeBusinessOrdersPayload,
  normalizeMyOrdersPayload
} from './orderNormalization';
import { archiveOrder, deleteOrderPermanently, OrdersApiError, patchOrderStatus, proposeOrderAlternative } from './ordersApi';
import { isRecord } from './orderValueParsers';
import type { BusinessRequest, ClosureReason, MyOrder, OrderAction, OrderActor } from './types';

const FALLBACK_BUSINESS_IMAGE = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80';

export default function useRequests(onSessionExpired: () => void) {
  const [requests, setRequests] = useState<BusinessRequest[]>([]);
  const [myOrders, setMyOrders] = useState<MyOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [updatingOrderIds, setUpdatingOrderIds] = useState<Set<number>>(() => new Set());
  const guardRef = useRef(createOrderOperationGuard());
  const businessNameCache = useRef(new Map<number, string>());
  const hasBusiness = typeof window !== 'undefined' && Boolean(localStorage.getItem('zipco-business-id'));

  const getBusinessName = useCallback(async (id: number) => {
    if (businessNameCache.current.has(id)) return businessNameCache.current.get(id) ?? '';
    const response = await fetch(`${API_BASE_URL}/businesses/${id}`);
    if (!response.ok) return '';
    const payload: unknown = await response.json();
    const name = isRecord(payload) && typeof payload.name === 'string' ? payload.name : '';
    businessNameCache.current.set(id, name);
    return name;
  }, []);

  const loadOrders = useCallback(async () => {
    const token = localStorage.getItem('zipco-token');
    const businessId = localStorage.getItem('zipco-business-id');
    if (!token) { setIsLoading(false); return false; }
    setIsLoading(true);
    setLoadError('');
    try {
      const myResponse = await fetch(`${API_BASE_URL}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!myResponse.ok) throw new OrdersApiError('No se pudieron cargar tus pedidos.', myResponse.status);
      const myPayload: unknown = await myResponse.json();
      const normalized = normalizeMyOrdersPayload(myPayload);
      setMyOrders(await Promise.all(normalized.map(async (order) => {
        if (order.businessName) return { ...order, businessImage: order.businessImage || FALLBACK_BUSINESS_IMAGE };
        const resolvedName = order.businessId === null ? '' : await getBusinessName(order.businessId);
        return {
          ...order,
          businessName: resolvedName || (order.businessId === null ? 'Negocio no disponible' : `Negocio #${order.businessId}`),
          businessImage: order.businessImage || FALLBACK_BUSINESS_IMAGE
        };
      })));

      if (businessId) {
        const businessResponse = await fetch(`${API_BASE_URL}/orders/business/${businessId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!businessResponse.ok) {
          throw new OrdersApiError('No se pudieron cargar los pedidos del negocio.', businessResponse.status);
        }
        const businessPayload: unknown = await businessResponse.json();
        setRequests(normalizeBusinessOrdersPayload(businessPayload));
      } else {
        setRequests([]);
      }
      return true;
    } catch (error) {
      if (error instanceof OrdersApiError && error.status === 401) {
        showAppToast('Tu sesión venció. Ingresa nuevamente por SMS.', 'error');
        onSessionExpired();
      } else {
        setLoadError('No se pudieron cargar los pedidos. Revisa tu conexión e intenta nuevamente.');
        showAppToast('No se pudieron cargar los pedidos. Intenta nuevamente.', 'error');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getBusinessName, onSessionExpired]);

  useEffect(() => { void loadOrders(); }, [loadOrders]);

  const performAction = useCallback(async (
    order: BusinessRequest | MyOrder,
    actor: OrderActor,
    action: OrderAction,
    cancellationReason?: ClosureReason,
    reasonDetail?: string,
  ) => {
    if (!canSubmitOrderStatus(order, actor, action)) return;
    const actionable = getActionableOrder(order);
    const payload = actionToPayload(action, cancellationReason, reasonDetail);
    const token = localStorage.getItem('zipco-token');
    if (!actionable || !payload || !token || !guardRef.current.begin(actionable.id)) return;

    setUpdatingOrderIds((current) => new Set(current).add(actionable.id));
    try {
      await patchOrderStatus(actionable.id, payload, token);
      const reloaded = await loadOrders();
      if (reloaded) {
        if (actor === 'customer' && action === 'complete-reception') {
          showAppToast('', 'success', {
            title: 'Recepción confirmada',
            description: 'Tu pedido quedó completado. Puedes verlo en Historial.',
            durationMs: 7000,
          });
        } else {
          showAppToast('Pedido actualizado correctamente.');
        }
      }
    } catch (error) {
      const policy = getOrderErrorPolicy(error);
      showAppToast(policy.message, 'error');
      if (policy.reload) await loadOrders();
      if (policy.expireSession) onSessionExpired();
    } finally {
      guardRef.current.end(actionable.id);
      setUpdatingOrderIds((current) => {
        const next = new Set(current);
        next.delete(actionable.id);
        return next;
      });
    }
  }, [loadOrders, onSessionExpired]);

  const setArchived = useCallback(async (id: number, archived: boolean) => {
    const token = localStorage.getItem('zipco-token');
    if (!token) return;
    try {
      await archiveOrder(id, archived, token);
      await loadOrders();
      showAppToast(archived ? 'Pedido movido a Eliminados.' : 'Pedido restaurado al historial.');
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'No se pudo actualizar el historial.', 'error');
    }
  }, [loadOrders]);

  const deletePermanently = useCallback(async (id: number) => {
    const token = localStorage.getItem('zipco-token');
    if (!token) return;
    try {
      await deleteOrderPermanently(id, token);
      await loadOrders();
      showAppToast('Pedido eliminado definitivamente.');
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'No se pudo eliminar el pedido.', 'error');
    }
  }, [loadOrders]);

  const proposeAlternative = useCallback(async (id: number, payload: { date?: string; time?: string; item?: string; quantity?: number; priceClp?: number; message: string }) => {
    const token = localStorage.getItem('zipco-token'); if (!token) return;
    try { await proposeOrderAlternative(id, payload, token); await loadOrders(); showAppToast('Alternativa enviada al cliente.'); }
    catch (error) { showAppToast(error instanceof Error ? error.message : 'No se pudo enviar la alternativa.', 'error'); }
  }, [loadOrders]);

  return { hasBusiness, isLoading, loadError, myOrders, requests, updatingOrderIds, loadOrders, performAction, proposeAlternative, setArchived, deletePermanently };
}

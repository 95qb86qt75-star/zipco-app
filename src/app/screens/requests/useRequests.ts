import { useCallback, useEffect, useRef, useState } from "react";
import { createFixedOrderAcceptance } from './fixedOrderAcceptance';
import { hasRequestProcess } from './requestProcess';
import { RequestProcessError, REFRESH_CONDITIONS_MESSAGE } from './requestProcessErrors';
import { mergeProcessOrderUpdates } from './processOrderUpdates';
import { readBusinessOrderForRecovery } from './requestProcessApi';
import { parsePositiveInteger } from './orderValueParsers';
import { API_BASE_URL } from "../../api/apiConfig";
import { showAppToast } from "../Toast";
import { createOrderOperationGuard } from "./orderActionGuard";
import { getOrderErrorPolicy } from "./orderErrorPolicy";
import { actionToPayload } from "./orderPresentation";
import {
  canSubmitOrderStatus,
  getActionableOrder,
  normalizeBusinessOrdersPayload,
  normalizeMyOrdersPayload,
} from "./orderNormalization";
import {
  archiveOrder,
  deleteOrderPermanently,
  OrdersApiError,
  patchOrderStatus,
  proposeOrderAlternative,
} from "./ordersApi";
import { isRecord } from "./orderValueParsers";
import { normalizeRequestProcess } from './requestProcess';
import { diagnoseLoadOrdersRead } from './loadOrdersDiagnostics';
import type {
  BusinessRequest,
  ClosureReason,
  MyOrder,
  OrderAction,
  OrderActor,
} from "./types";

const FALLBACK_BUSINESS_IMAGE =
  "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80";

async function readOrdersResponse<T>(operation: Parameters<typeof diagnoseLoadOrdersRead>[0] | null,
  request: () => Promise<Response>, consume: (response: Response) => Promise<T>): Promise<T> {
  if (import.meta.env.QA_LOAD_DIAGNOSTICS && operation) return diagnoseLoadOrdersRead(operation, request, consume);
  return consume(await request());
}

export default function useRequests(onSessionExpired: () => void) {
  const [requests, setRequests] = useState<BusinessRequest[]>([]);
  const [myOrders, setMyOrders] = useState<MyOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [updatingOrderIds, setUpdatingOrderIds] = useState<Set<number>>(
    () => new Set(),
  );
  const guardRef = useRef(createOrderOperationGuard());
  const acceptanceRef = useRef(createFixedOrderAcceptance());
  const currentOrders = useRef<Array<BusinessRequest | MyOrder>>([]);
  currentOrders.current = [...requests, ...myOrders];
  const businessNameCache = useRef(new Map<number, string>());
  const hasBusiness =
    typeof window !== "undefined" &&
    Boolean(localStorage.getItem("zipco-business-id"));

  const getBusinessName = useCallback(async (id: number) => {
    if (businessNameCache.current.has(id))
      return businessNameCache.current.get(id) ?? "";
    return readOrdersResponse(import.meta.env.QA_LOAD_DIAGNOSTICS ? 'loadOrders.businessName' : null, () => fetch(`${API_BASE_URL}/businesses/${id}`), async (response) => {
      if (!response.ok) return "";
      const payload: unknown = await response.json();
      const name = isRecord(payload) && typeof payload.name === "string" ? payload.name : "";
      businessNameCache.current.set(id, name);
      return name;
    });
  }, []);

  const loadOrders = useCallback(
    async (silent = false) => {
      const token = localStorage.getItem("zipco-token");
      const businessId = localStorage.getItem("zipco-business-id");
      if (!token) {
        setIsLoading(false);
        return false;
      }
      if (!silent) setIsLoading(true);
      setLoadError("");
      try {
        const myPayload: unknown = await readOrdersResponse(import.meta.env.QA_LOAD_DIAGNOSTICS ? 'loadOrders.customer' : null, () => fetch(`${API_BASE_URL}/orders/my-orders`, {
          headers: { Authorization: `Bearer ${token}` },
        }), async (myResponse) => {
          if (!myResponse.ok)
            throw new OrdersApiError(
              "No se pudieron cargar tus pedidos.",
              myResponse.status,
            );
          return myResponse.json();
        });
        const normalized = normalizeMyOrdersPayload(myPayload);
        const customerOrders = await Promise.all(
            normalized.map(async (order) => {
              if (order.businessName)
                return {
                  ...order,
                  businessImage: order.businessImage || FALLBACK_BUSINESS_IMAGE,
                };
              const resolvedName =
                order.businessId === null
                  ? ""
                  : await getBusinessName(order.businessId);
              return {
                ...order,
                businessName:
                  resolvedName ||
                  (order.businessId === null
                    ? "Negocio no disponible"
                    : `Negocio #${order.businessId}`),
                businessImage: order.businessImage || FALLBACK_BUSINESS_IMAGE,
              };
            }),
          );
        setMyOrders((current) => mergeProcessOrderUpdates(customerOrders, current));

        if (businessId) {
          const businessPayload: unknown = await readOrdersResponse(import.meta.env.QA_LOAD_DIAGNOSTICS ? 'loadOrders.business' : null, () => fetch(
            `${API_BASE_URL}/orders/business/${businessId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          ), async (businessResponse) => {
            if (!businessResponse.ok) {
              throw new OrdersApiError(
                "No se pudieron cargar los pedidos del negocio.",
                businessResponse.status,
              );
            }
            return businessResponse.json();
          });
          setRequests((current) => mergeProcessOrderUpdates(normalizeBusinessOrdersPayload(businessPayload), current));
        } else {
          setRequests([]);
        }
        return true;
      } catch (error) {
        if (error instanceof OrdersApiError && error.status === 401) {
          showAppToast(
            "Tu sesión venció. Ingresa nuevamente por SMS.",
            "error",
          );
          onSessionExpired();
        } else {
          setLoadError(
            "No se pudieron cargar los pedidos. Revisa tu conexión e intenta nuevamente.",
          );
          showAppToast(
            "No se pudieron cargar los pedidos. Intenta nuevamente.",
            "error",
          );
        }
        return false;
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [getBusinessName, onSessionExpired],
  );

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const expire = () => onSessionExpired();
    const resume = () => { if (document.visibilityState === 'visible') void loadOrders(true); };
    window.addEventListener('zipco-coordination-session-expired', expire);
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('pageshow', resume);
    return () => {
      window.removeEventListener('zipco-coordination-session-expired', expire);
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('pageshow', resume);
    };
  }, [loadOrders, onSessionExpired]);

  useEffect(() => {
    const receive = (event: Event) => {
      const receipt: unknown = (event as CustomEvent).detail;
      if (!isRecord(receipt) || !Number.isSafeInteger(receipt.orderId) || (receipt.orderStatus !== 'accepted' && receipt.orderStatus !== 'cancelled')) return;
      const process = normalizeRequestProcess(receipt.requestProcess);
      if (!process) return;
      const apply = <T extends BusinessRequest | MyOrder>(items: T[]): T[] => items.map((item) => {
        if (item.id !== receipt.orderId || item.requestProcess?.id !== process.id || item.requestProcess.version > process.version) return item;
        return { ...item, status: receipt.orderStatus as 'accepted' | 'cancelled', requestProcess: process };
      });
      setRequests(apply); setMyOrders(apply);
      void loadOrders(true);
    };
    window.addEventListener('zipco-process-receipt', receive);
    return () => window.removeEventListener('zipco-process-receipt', receive);
  }, [loadOrders]);

  useEffect(() => {
    for (const order of [...requests, ...myOrders]) {
      if (order.requestProcess) acceptanceRef.current.acknowledge(order.requestProcess);
    }
  }, [requests, myOrders]);

  const performAction = useCallback(
    async (
      order: BusinessRequest | MyOrder,
      actor: OrderActor,
      action: OrderAction,
      cancellationReason?: ClosureReason,
      reasonDetail?: string,
    ) => {
      const current = currentOrders.current.find((item) => item.id === order.id);
      if (current && hasRequestProcess(current) &&
        (!hasRequestProcess(order) || current.requestProcess?.id !== order.requestProcess?.id ||
          current.requestProcess?.version !== order.requestProcess?.version ||
          current.requestProcess?.currentProposalId !== order.requestProcess?.currentProposalId ||
          !canSubmitOrderStatus(current, actor, action))) {
        showAppToast(REFRESH_CONDITIONS_MESSAGE, 'error');
        await loadOrders(true);
        return false;
      }
      if (!canSubmitOrderStatus(order, actor, action)) return false;
      const actionable = getActionableOrder(order);
      const payload = actionToPayload(action, cancellationReason, reasonDetail);
      const token = localStorage.getItem("zipco-token");
      if (
        !actionable ||
        !payload ||
        !token ||
        !guardRef.current.begin(actionable.id)
      )
        return false;

      setUpdatingOrderIds((current) => new Set(current).add(actionable.id));
      try {
        if (hasRequestProcess(order)) {
          if (!order.requestProcess) return false;
          const result = await acceptanceRef.current.accept(actionable.id, order.requestProcess, token, async () => {
            const businessId = parsePositiveInteger(localStorage.getItem('zipco-business-id'));
            if (!businessId) throw new RequestProcessError('No se pudo verificar el negocio. Actualiza la pantalla.', 0);
            const latest = await readBusinessOrderForRecovery(actionable.id, businessId, token);
            if (latest) setRequests((items) => mergeProcessOrderUpdates(
              items.map((item) => item.id === latest.id ? latest : item), items,
            ));
            return latest;
          });
          if (!result) return false;
          const update = <T extends BusinessRequest | MyOrder>(items: T[]): T[] => items.map((item) =>
            item.id === result.orderId ? { ...item, status: result.orderStatus, requestProcess: result.requestProcess } : item);
          setRequests(update);
          setMyOrders(update);
          showAppToast('Pedido aceptado. Coordinación pendiente.');
          await loadOrders(true);
          return true;
        }
        await patchOrderStatus(actionable.id, payload, token);
        const reloaded = await loadOrders();
        if (reloaded) {
          if (actor === "customer" && action === "complete-reception") {
            showAppToast("", "success", {
              title: "Pedido completado",
              description: "Lo guardamos en tu Historial.",
              durationMs: 7000,
            });
          } else {
            showAppToast("Pedido actualizado correctamente.");
          }
        }
        return reloaded;
      } catch (error) {
        const policy = getOrderErrorPolicy(error);
        showAppToast(policy.message, "error");
        if (policy.reload || (error instanceof RequestProcessError && error.refreshConditions)) await loadOrders();
        if (policy.expireSession) onSessionExpired();
        return false;
      } finally {
        guardRef.current.end(actionable.id);
        setUpdatingOrderIds((current) => {
          const next = new Set(current);
          next.delete(actionable.id);
          return next;
        });
      }
    },
    [loadOrders, onSessionExpired],
  );

  const setArchived = useCallback(
    async (id: number, archived: boolean) => {
      if ([...requests, ...myOrders].some((order) => order.id === id && hasRequestProcess(order))) return;
      const token = localStorage.getItem("zipco-token");
      if (!token) return;
      try {
        await archiveOrder(id, archived, token);
        await loadOrders();
        showAppToast(
          archived
            ? "Pedido movido a Eliminados."
            : "Pedido restaurado al historial.",
        );
      } catch (error) {
        showAppToast(
          error instanceof OrdersApiError
            ? error.message
            : "No se pudo actualizar el historial.",
          "error",
        );
      }
    },
    [loadOrders, requests, myOrders],
  );

  const deletePermanently = useCallback(
    async (id: number) => {
      if ([...requests, ...myOrders].some((order) => order.id === id && hasRequestProcess(order))) return;
      const token = localStorage.getItem("zipco-token");
      if (!token) return;
      try {
        await deleteOrderPermanently(id, token);
        await loadOrders();
        showAppToast("Pedido eliminado definitivamente.");
      } catch (error) {
        showAppToast(
          error instanceof OrdersApiError
            ? error.message
            : "No se pudo eliminar el pedido.",
          "error",
        );
      }
    },
    [loadOrders, requests, myOrders],
  );

  const proposeAlternative = useCallback(
    async (
      id: number,
      payload: {
        date?: string;
        time?: string;
        item?: string;
        quantity?: number;
        priceClp?: number;
        message: string;
      },
    ) => {
      const token = localStorage.getItem("zipco-token");
      if (!token) return;
      try {
        const order = requests.find((item) => item.id === id);
        if (!order || hasRequestProcess(order)) return;
        await proposeOrderAlternative(id, payload, token);
        await loadOrders();
        showAppToast("Alternativa enviada al cliente.");
      } catch (error) {
        showAppToast(
          error instanceof OrdersApiError
            ? error.message
            : "No se pudo enviar la alternativa.",
          "error",
        );
      }
    },
    [loadOrders, requests],
  );

  return {
    hasBusiness,
    isLoading,
    loadError,
    myOrders,
    requests,
    updatingOrderIds,
    loadOrders,
    performAction,
    proposeAlternative,
    setArchived,
    deletePermanently,
  };
}

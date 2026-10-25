import { useCallback, useEffect, useRef, useState } from "react";
import { createFixedOrderAcceptance } from './fixedOrderAcceptance';
import { announceAction } from './ActionHologram';
import { readCoordinationSession } from './coordinationSession';
import { hasRequestProcess } from './requestProcess';
import { RequestProcessError, REFRESH_CONDITIONS_MESSAGE, FLOW_UPDATE_MESSAGE, processApiError } from './requestProcessErrors';
import { mergeProcessOrderUpdates } from './processOrderUpdates';
import { readBusinessOrderForRecovery } from './requestProcessApi';
import { parsePositiveInteger } from './orderValueParsers';
import { API_BASE_URL } from "../../api/apiConfig";
import { AVAILABILITY_QUERY } from './availabilityContract';
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
import { normalizeRequestProcess, isPendingRequestRejected, isProposalRejected } from './requestProcess';
import { diagnoseLoadOrdersRead, type LoadReadContext, type LoadTrigger, type LoadCancellation } from './loadOrdersDiagnostics';
import type {
  BusinessRequest,
  ClosureReason,
  MyOrder,
  OrderAction,
  OrderActor,
} from "./types";

const FALLBACK_BUSINESS_IMAGE =
  "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80";
let loadSequence = 0;
type OrderLoadFlight = {
  token: string; businessId: string | null; controller: AbortController; context: LoadReadContext;
  cancelReason: LoadCancellation | null; promise: Promise<boolean>;
};

async function readOrdersResponse<T>(operation: Parameters<typeof diagnoseLoadOrdersRead>[0] | null,
  request: () => Promise<Response>, consume: (response: Response) => Promise<T>, context?: LoadReadContext): Promise<T> {
  if (import.meta.env.QA_LOAD_DIAGNOSTICS && operation) return diagnoseLoadOrdersRead(operation, request, consume, context);
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
  const loader = useRef<{ mounted: boolean; flight: OrderLoadFlight | null }>({ mounted: true, flight: null });
  const cancelLoad = useCallback((reason: LoadCancellation) => {
    const flight = loader.current.flight;
    if (flight) { flight.cancelReason = reason; loader.current.flight = null; flight.controller.abort(); }
    if (loader.current.mounted) setIsLoading(false);
  }, []);
  const hasBusiness =
    typeof window !== "undefined" &&
    Boolean(localStorage.getItem("zipco-business-id"));

  const getBusinessName = useCallback(async (id: number, context: LoadReadContext) => {
    if (businessNameCache.current.has(id))
      return businessNameCache.current.get(id) ?? "";
    return readOrdersResponse(import.meta.env.QA_LOAD_DIAGNOSTICS ? 'loadOrders.businessName' : null, () => fetch(`${API_BASE_URL}/businesses/${id}`, {signal:context.signal}), async (response) => {
      if (!response.ok) return "";
      const payload: unknown = await response.json();
      const name = isRecord(payload) && typeof payload.name === "string" ? payload.name : "";
      if (!context.signal.aborted) businessNameCache.current.set(id, name);
      return name;
    }, context);
  }, []);

  const loadOrders = useCallback(
    async (silent = false, trigger: LoadTrigger = 'manual') => {
      const token = localStorage.getItem("zipco-token");
      const businessId = localStorage.getItem("zipco-business-id");
      if (!loader.current.mounted) return false;
      if (!token) {
        cancelLoad('superseded');
        setIsLoading(false);
        return false;
      }
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return false;
      const previous = loader.current.flight;
      if (previous && previous.token === token && previous.businessId === businessId && trigger !== 'receipt') return previous.promise;
      if (previous) cancelLoad('superseded');
      const controller = new AbortController();
      const flight: OrderLoadFlight = { token, businessId, controller, cancelReason:null, promise:Promise.resolve(false),
        context:{loadId:++loadSequence,trigger,signal:controller.signal,cancellationReason:()=>flight.cancelReason} };
      loader.current.flight = flight;
      const active = () => loader.current.mounted && loader.current.flight === flight && !controller.signal.aborted &&
        localStorage.getItem('zipco-token') === token && localStorage.getItem('zipco-business-id') === businessId;
      if (!silent) setIsLoading(true);
      const execute = async () => {
        try {
          const myPayload: unknown = await readOrdersResponse(import.meta.env.QA_LOAD_DIAGNOSTICS ? 'loadOrders.customer' : null, () => fetch(`${API_BASE_URL}/orders/my-orders${AVAILABILITY_QUERY}`, {
            headers: { Authorization: `Bearer ${token}` }, signal:controller.signal,
          }), async (myResponse) => {
            if (myResponse.status === 409) throw processApiError(409,await myResponse.json().catch(()=>null));
            if (!myResponse.ok)
              throw new OrdersApiError(
                "No se pudieron cargar tus pedidos.",
                myResponse.status,
              );
            return myResponse.json();
          }, flight.context);
          if (!active()) return false;
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
                    : await getBusinessName(order.businessId, flight.context);
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
          if (!active()) return false;
          setMyOrders((current) => mergeProcessOrderUpdates(customerOrders, current));

          if (businessId) {
            const businessPayload: unknown = await readOrdersResponse(import.meta.env.QA_LOAD_DIAGNOSTICS ? 'loadOrders.business' : null, () => fetch(
              `${API_BASE_URL}/orders/business/${businessId}${AVAILABILITY_QUERY}`,
              {
                headers: { Authorization: `Bearer ${token}` }, signal:controller.signal,
              },
            ), async (businessResponse) => {
              if (businessResponse.status === 409) throw processApiError(409,await businessResponse.json().catch(()=>null));
              if (!businessResponse.ok) {
                throw new OrdersApiError(
                  "No se pudieron cargar los pedidos del negocio.",
                  businessResponse.status,
                );
              }
              return businessResponse.json();
            }, flight.context);
            if (!active()) return false;
            setRequests((current) => mergeProcessOrderUpdates(normalizeBusinessOrdersPayload(businessPayload), current));
          } else {
            setRequests([]);
          }
          setLoadError('');
          return true;
        } catch (error) {
          // Suppress only a controlled cancellation or an obsolete/session-bound
          // result. An unexpected AbortError/TypeError from a current read is real.
          if (!active()) return false;
          if (error instanceof OrdersApiError && error.status === 401) {
            showAppToast(
              "Tu sesión venció. Ingresa nuevamente por SMS.",
              "error",
            );
            onSessionExpired();
          } else {
            setLoadError(error instanceof RequestProcessError && error.message === FLOW_UPDATE_MESSAGE ? FLOW_UPDATE_MESSAGE :
              "No se pudieron cargar los pedidos. Revisa tu conexión e intenta nuevamente.");
            showAppToast(
              error instanceof RequestProcessError && error.message === FLOW_UPDATE_MESSAGE ? FLOW_UPDATE_MESSAGE : "No se pudieron cargar los pedidos. Intenta nuevamente.",
              "error",
            );
          }
          return false;
        } finally {
          if (loader.current.flight === flight) {
            loader.current.flight = null;
            if (loader.current.mounted) setIsLoading(false);
          }
        }
      };
      flight.promise = execute();
      return flight.promise;
    },
    [getBusinessName, onSessionExpired, cancelLoad],
  );

  useEffect(() => {
    loader.current.mounted = true;
    void loadOrders(false, 'initial');
    return () => { loader.current.mounted = false; cancelLoad('unmount'); };
  }, [loadOrders, cancelLoad]);

  useEffect(() => {
    const expire = () => onSessionExpired();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const resume = () => {
      clearTimeout(timer);
      if (document.visibilityState === 'hidden') { cancelLoad('page-hidden'); return; }
      timer = setTimeout(() => { if (document.visibilityState === 'visible') void loadOrders(true, 'resume'); }, 150);
    };
    const hide = () => { clearTimeout(timer); cancelLoad('pagehide'); };
    window.addEventListener('zipco-coordination-session-expired', expire);
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('pageshow', resume);
    window.addEventListener('pagehide', hide);
    return () => {
      window.removeEventListener('zipco-coordination-session-expired', expire);
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('pageshow', resume);
      window.removeEventListener('pagehide', hide);
      clearTimeout(timer);
    };
  }, [loadOrders, onSessionExpired, cancelLoad]);

  useEffect(() => {
    const receive = (event: Event) => {
      const receipt: unknown = (event as CustomEvent).detail;
      if (!isRecord(receipt) || !Number.isSafeInteger(receipt.orderId) || !['pending', 'accepted', 'cancelled', 'ready', 'completed', 'rejected', 'alternative_proposed'].includes(String(receipt.orderStatus))) return;
      const process = normalizeRequestProcess(receipt.requestProcess);
      if(receipt.orderStatus==='pending'&&(process?.flowContract!=='AVAILABILITY_V1'||process.state!=='AWAITING_CUSTOMER_CONTINUATION'))return;
      if (!process || (receipt.orderStatus === 'rejected' && !isPendingRequestRejected(process) && !isProposalRejected(process))) return;
      const apply = <T extends BusinessRequest | MyOrder>(items: T[]): T[] => items.map((item) => {
        if (item.id !== receipt.orderId || item.requestProcess?.id !== process.id || item.requestProcess.version > process.version) return item;
        // A historical replay can omit optional fields already learned by GET at
        // this version. Keep those fields, never carry them across versions.
        const requestProcess = item.requestProcess.version === process.version ? { ...item.requestProcess, ...process } : process;
        return { ...item, status: receipt.orderStatus as 'pending' | 'accepted' | 'cancelled' | 'ready' | 'completed' | 'rejected' | 'alternative_proposed', requestProcess };
      });
      setRequests(apply); setMyOrders(apply);
      void loadOrders(true, 'receipt');
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
      const acceptanceSession = readCoordinationSession();
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
          if (acceptanceSession && readCoordinationSession() === acceptanceSession)
            announceAction('accepted', { key: `fixed-order:${result.requestProcess.id}:${result.requestProcess.version}`,
              title: 'Pedido aceptado', description: 'El pedido pasó a Por coordinar. Revisa la autorización de contacto para continuar por WhatsApp.' });
          await loadOrders(true);
          return true;
        }
        await patchOrderStatus(actionable.id, payload, token);
        const ownBusinessFeedback = actor === 'business' && ['accept','reject','cancel','mark-ready'].includes(action);
        if (ownBusinessFeedback && acceptanceSession && readCoordinationSession() === acceptanceSession) {
          const notice = action === 'accept' ? { kind:'accepted' as const,title:'Pedido aceptado',description:'El pedido fue aceptado. Revisa sus siguientes pasos en Solicitudes.' }
            : action === 'reject' ? {kind:'rejected' as const,title:'Solicitud rechazada',description:'La solicitud quedó en Historial.'}
              : action === 'cancel' ? {kind:'annulled' as const,title:'Solicitud anulada',description:'La solicitud quedó en Historial.'}
                : {kind:'ready' as const,title:'Pedido listo',description:'El pedido quedó marcado como listo. Coordina la entrega con el cliente.'};
          announceAction(notice.kind,{key:`legacy-order:${actionable.id}:${payload.status}`,title:notice.title,description:notice.description});
        }
        const reloaded = await loadOrders();
        if (reloaded) {
          if (actor === "customer" && action === "complete-reception") {
            showAppToast("", "success", {
              title: "Pedido completado",
              description: "Lo guardamos en tu Historial.",
              durationMs: 7000,
            });
          } else if (!ownBusinessFeedback) {
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
        const session = readCoordinationSession();
        await proposeOrderAlternative(id, payload, token);
        await loadOrders();
        if (session && readCoordinationSession() === session) announceAction('alternative', { key:`legacy-alternative:${id}:${crypto.randomUUID()}`,
          description:'El cliente podrá revisar tu alternativa en Solicitudes.' });
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

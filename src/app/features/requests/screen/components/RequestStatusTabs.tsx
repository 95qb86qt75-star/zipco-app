import * as React from 'react';
























import { businessOrderTabs } from "../../domain/orderTabs";
import RequestStatusTab from "./RequestStatusTab";






import type { RequestsScreenModel } from "../application/useRequestsScreenController";
/** Canonical visual section; data and commands come from its screen controller. */
export default function RequestStatusTabs({model}:{model:Pick<RequestsScreenModel,"customerReadyArrival"|"prefersReducedMotion"|"requestType"|"requests"|"selectStatusView"|"statusCountState"|"statusCounts"|"statusView"|"subTab"|"unreadHistoryCount">}){
const {customerReadyArrival,prefersReducedMotion,requestType,requests,selectStatusView,statusCountState,statusCounts,statusView,subTab,unreadHistoryCount}=model;
return (<div className="zipco-status-tabs mb-3">
          {(requestType === "quotes"
            ? ([
                {
                  key: "pending",
                  label: subTab === "my-business" ? "Nuevas" : "Enviadas",
                  count: statusCounts.pending,
                },
                {
                  key: "waiting",
                  label:
                    subTab === "my-business"
                      ? "Esperando cliente"
                      : "Por responder",
                  count: statusCounts.waiting,
                },
                {
                  key: "active",
                  label: "En curso",
                  count: statusCounts.active,
                },
                ...(statusCounts.ready > 0
                  ? [
                      {
                        key: "ready",
                        label:
                          subTab === "my-business"
                            ? "Listo y notificado"
                            : "Listos",
                        count: statusCounts.ready,
                      } as const,
                    ]
                  : []),
                {
                  key: "history",
                  label: "Historial",
                  count: unreadHistoryCount,
                },
              ] as const)
            : subTab === "my-business" ? businessOrderTabs(statusCounts, unreadHistoryCount, requests.some((order) => order.requestProcess?.state === 'READY')) : ([
                {
                  key: "pending",
                  label: "Pendientes",
                  count: statusCounts.pending,
                },
                {
                  key: "waiting",
                  label: "Por responder",
                  count: statusCounts.waiting,
                },
                ...(statusCounts.coordination > 0 ? [{ key: 'coordination', label: 'Coordinación', count: statusCounts.coordination } as const] : []),
                {
                  key: "active",
                  label: "En curso",
                  count: statusCounts.active,
                },
                ...(statusCounts.ready > 0
                  ? [
                      {
                        key: "ready",
                        label: "Listos",
                        count: statusCounts.ready,
                      } as const,
                    ]
                  : []),
                {
                  key: "history",
                  label: "Historial",
                  count: unreadHistoryCount,
                },
              ] as const)
          ).map((item) => (
            <RequestStatusTab key={item.key} item={item} selected={statusView === item.key}
              arrival={subTab === 'my-orders' && requestType === 'orders' && item.key === 'ready' ? customerReadyArrival : undefined}
              countState={statusCountState}
              reducedMotion={prefersReducedMotion} onSelect={() => selectStatusView(item.key)} />
          ))}
        </div>);
}

import { CalendarDays, Package } from "lucide-react";
import { Fragment, useState } from "react";
import EmptyRequestsState from "./EmptyRequestsState";
import MyOrderCard from "./MyOrderCard";
import OrderActionModal from "./OrderActionModal";
import type { ClosureReason, MyOrder, OrderAction } from "./types";
import {
  interactionKey,
  useUnreadInteractions,
} from "../../notifications/unreadInteractions";

type Props = {
  myOrders: MyOrder[];
  updatingOrderIds: Set<number>;
  onAction: (
    order: MyOrder,
    action: OrderAction,
    reason?: ClosureReason,
    detail?: string,
  ) => Promise<void>;
  onRetry: () => Promise<boolean>;
  emptyTitle: string;
  emptyDescription: string;
};

export default function MyOrdersTab({
  myOrders,
  updatingOrderIds,
  onAction,
  onRetry,
  emptyTitle,
  emptyDescription,
}: Props) {
  const { unread, markRead } = useUnreadInteractions();
  const [selection, setSelection] = useState<{
    order: MyOrder;
    action: OrderAction;
  } | null>(null);
  const displayed = myOrders.filter(
    (order) => order.recordState === "available",
  );
  const unavailable = myOrders.filter(
    (order) => order.recordState === "unavailable",
  );
  const selectedId =
    selection?.order.recordState === "available" ? selection.order.id : null;
  const isSubmitting = selectedId !== null && updatingOrderIds.has(selectedId);

  const confirm = async (reason?: ClosureReason, detail?: string) => {
    if (!selection) return;
    await onAction(selection.order, selection.action, reason, detail);
    setSelection(null);
  };

  return (
    <>
      {displayed.length > 0 ? (
        <div className="space-y-3">
          {displayed.map((order, index) => (
            <Fragment key={order.clientKey}>
              {(index === 0 || displayed[index - 1].date !== order.date) && (
                <div className="flex items-center gap-2 pt-1 text-xs font-bold text-slate-500">
                  <CalendarDays className="h-4 w-4" />
                  <span>{order.date}</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
              )}
              <MyOrderCard
                order={order}
                isUpdating={
                  order.recordState === "available" &&
                  updatingOrderIds.has(order.id)
                }
                onAction={(action) => setSelection({ order, action })}
                onRetry={() => {
                  void onRetry();
                }}
                isUnread={
                  order.recordState === "available" &&
                  unread.has(interactionKey("order", order.id))
                }
                onOpen={() => {
                  if (order.recordState === "available")
                    markRead("order", order.id);
                }}
              />
            </Fragment>
          ))}
        </div>
      ) : (
        <EmptyRequestsState
          icon={Package}
          title={emptyTitle}
          description={emptyDescription}
        />
      )}

      {unavailable.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-bold text-gray-800">No disponibles</h3>
          {unavailable.map((order) => (
            <MyOrderCard
              key={order.clientKey}
              order={order}
              isUpdating={false}
              onAction={() => undefined}
              onRetry={() => {
                void onRetry();
              }}
            />
          ))}
        </div>
      )}

      <OrderActionModal
        key={
          selection
            ? `${selection.order.clientKey}-${selection.action}`
            : "closed"
        }
        action={selection?.action ?? null}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) setSelection(null);
        }}
        onConfirm={(reason, detail) => {
          void confirm(reason, detail);
        }}
      />
    </>
  );
}

import * as React from 'react';








import type { BusinessRequest, MyOrder } from "../../../domain/types";

import CompactHistoryList from './CompactHistoryList';
import { normalizeOrder } from './historyPresentation';
export function OrderHistoryList({
  orders,
  owner,
  deleted,
  onArchive,
  onDelete,
}: {
  orders: Array<MyOrder | BusinessRequest>;
  owner: "customer" | "business";
  deleted: boolean;
  onArchive: (id: number, archived: boolean) => void;
  onDelete?: (id: number) => void;
}) {
  return (
    <CompactHistoryList
      items={orders.map((order) => normalizeOrder(order, owner))}
      deleted={deleted}
      onArchive={onArchive}
      onDelete={onDelete}
    />
  );
}

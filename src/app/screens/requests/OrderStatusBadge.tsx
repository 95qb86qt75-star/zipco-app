import { STATUS_LABELS } from "./orderPresentation";
import type { DisplayOrderStatus } from "./types";
import { Clock3 } from "lucide-react";

const STATUS_CLASSES: Record<DisplayOrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  alternative_proposed: "bg-teal-100 text-teal-700",
  accepted: "bg-blue-100 text-blue-700",
  ready: "bg-teal-100 text-teal-700",
  completed: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-gray-200 text-gray-700",
  unavailable: "bg-gray-100 text-gray-700",
};

export default function OrderStatusBadge({
  status,
}: {
  status: DisplayOrderStatus;
}) {
  return (
    <span
      className={`zipco-status-${status} inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${STATUS_CLASSES[status]}`}
    >
      {status === "pending" && (
        <Clock3 className="zipco-pending-clock h-3 w-3 shrink-0" />
      )}
      {STATUS_LABELS[status]}
    </span>
  );
}

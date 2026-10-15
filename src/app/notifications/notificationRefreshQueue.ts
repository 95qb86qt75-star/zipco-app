import { isRecord, parsePositiveInteger } from '../screens/requests/orderValueParsers';

export type NotificationRefresh = {
  navigate: boolean;
  pushedOrderIds: ReadonlySet<number>;
};

// Pushes are hints to refresh, never a source of user-facing copy or links.
export function createNotificationRefreshQueue(run: (context: NotificationRefresh) => Promise<boolean>) {
  let inFlight: Promise<void> | null = null;
  let requested = false;
  let navigateRequested = false;
  const pushedOrderIds = new Set<number>();

  return (navigate = false, payload?: unknown): Promise<void> => {
    requested = true;
    navigateRequested ||= navigate;
    if (isRecord(payload) && typeof payload.type === 'string') {
      const id = parsePositiveInteger(payload.orderId);
      if (id !== null) pushedOrderIds.add(id);
    }
    if (!inFlight) {
      // Coalesce simultaneous push, polling and foreground triggers. Reads are
      // serialized so an older response cannot consume a newer transition.
      inFlight = Promise.resolve().then(async () => {
        try {
          while (requested) {
            requested = false;
            const ids = new Set(pushedOrderIds);
            const context = { navigate: navigateRequested, pushedOrderIds: ids };
            navigateRequested = false;
            try {
              if (await run(context)) ids.forEach((id) => pushedOrderIds.delete(id));
            } catch {
              // Preserve push hints for the next refresh after a failed read.
            }
          }
        } finally { inFlight = null; }
      });
    }
    return inFlight;
  };
}

// Branches are eliminated from production; the store is a separate QA-only chunk.
export function traceNotificationClick(stage: string, flags: Record<string, boolean> = {}, correlationId?: string) {
  if (import.meta.env.QA_NOTIFICATION_TRACE) {
    void import('./qaNotificationClickTrace').then((trace) => trace.recordClickTrace(stage, flags, correlationId)).catch(() => {});
  }
}

import { useCallback, useEffect, useState } from "react";

export type InteractionKind = "order" | "quote";
const EVENT_NAME = "zipco-unread-interactions";
export const ACTIVE_REQUEST_COUNT_EVENT = "zipco-active-request-count";

const storageKey = () =>
  `zipco-unread-interactions:${localStorage.getItem("zipco-user-id") ?? "anonymous"}`;
export const interactionKey = (kind: InteractionKind, id: number) =>
  `${kind}:${id}`;

export function getUnreadInteractions(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey()) ?? "[]");
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function save(items: string[]) {
  const unique = [...new Set(items)];
  localStorage.setItem(storageKey(), JSON.stringify(unique));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: unique.length }));
}

export function markInteractionUnread(kind: InteractionKind, id: number) {
  if (!Number.isInteger(id) || id <= 0) return;
  save([...getUnreadInteractions(), interactionKey(kind, id)]);
}

export function markInteractionRead(kind: InteractionKind, id: number) {
  save(
    getUnreadInteractions().filter((key) => key !== interactionKey(kind, id)),
  );
}

export function publishUnreadCount() {
  window.dispatchEvent(
    new CustomEvent(EVENT_NAME, { detail: getUnreadInteractions().length }),
  );
}

const activeRequestCountKey = () =>
  `zipco-active-request-count:${localStorage.getItem("zipco-user-id") ?? "anonymous"}`;

export function getActiveRequestCount() {
  return Math.max(
    0,
    Number(localStorage.getItem(activeRequestCountKey())) || 0,
  );
}

export function publishActiveRequestCount(count: number) {
  const next = Math.max(0, Math.trunc(count));
  localStorage.setItem(activeRequestCountKey(), String(next));
  window.dispatchEvent(
    new CustomEvent(ACTIVE_REQUEST_COUNT_EVENT, { detail: next }),
  );
}

export function useUnreadInteractions() {
  const [unread, setUnread] = useState(() => new Set(getUnreadInteractions()));
  useEffect(() => {
    const refresh = () => setUnread(new Set(getUnreadInteractions()));
    window.addEventListener(EVENT_NAME, refresh);
    return () => window.removeEventListener(EVENT_NAME, refresh);
  }, []);
  const markRead = useCallback(
    (kind: InteractionKind, id: number) => markInteractionRead(kind, id),
    [],
  );
  return { unread, markRead };
}

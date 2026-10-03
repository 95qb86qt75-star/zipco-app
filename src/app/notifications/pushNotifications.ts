import { API_BASE_URL } from "../api/apiConfig";

export type PushSupport = "supported" | "unsupported";

export type PushActivationErrorCode =
  | "unsupported"
  | "permission-denied"
  | "service-worker-failed"
  | "configuration-unavailable"
  | "browser-subscription-failed"
  | "backend-registration-failed";

export class PushActivationError extends Error {
  constructor(
    public readonly code: PushActivationErrorCode,
    public readonly detail?: string,
  ) {
    super(code);
    this.name = "PushActivationError";
  }
}

export function getPushSupport(): PushSupport {
  return typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
    ? "supported"
    : "unsupported";
}

export function urlBase64ToUint8Array(value: string): Uint8Array {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const decoded = globalThis.atob(base64);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

async function getPushRegistration() {
  try {
    const existing = await navigator.serviceWorker.getRegistration("/");
    if (existing) return existing;
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (cause) {
    throw new PushActivationError(
      "service-worker-failed",
      cause instanceof DOMException ? cause.name : undefined,
    );
  }
}

function serializeSubscription(subscription: PushSubscription) {
  const json = subscription.toJSON();
  return {
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh ?? "",
    auth: json.keys?.auth ?? "",
  };
}

async function requestJson(
  path: string,
  token: string,
  init: RequestInit = {},
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new PushActivationError(
      "backend-registration-failed",
      String(response.status),
    );
  }
  return response.json();
}

export async function getExistingPushSubscription() {
  if (getPushSupport() === "unsupported") return null;
  const registration = await getPushRegistration();
  return registration.pushManager.getSubscription();
}

export async function enablePushNotifications(token: string) {
  if (getPushSupport() === "unsupported") {
    throw new PushActivationError("unsupported");
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new PushActivationError("permission-denied");
  }

  const registration = await getPushRegistration();
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    const keyResponse = await fetch(`${API_BASE_URL}/push/public-key`);
    if (!keyResponse.ok) {
      throw new PushActivationError(
        "configuration-unavailable",
        String(keyResponse.status),
      );
    }
    const payload: unknown = await keyResponse.json();
    const publicKey =
      typeof payload === "object" &&
      payload !== null &&
      "publicKey" in payload &&
      typeof payload.publicKey === "string"
        ? payload.publicKey
        : "";
    if (!publicKey) {
      throw new PushActivationError("configuration-unavailable");
    }
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    } catch (cause) {
      throw new PushActivationError(
        "browser-subscription-failed",
        cause instanceof DOMException ? cause.name : undefined,
      );
    }
  }

  await requestJson("/push/subscriptions", token, {
    method: "POST",
    body: JSON.stringify(serializeSubscription(subscription)),
  });
  // Presence is best effort. A registered subscription is already active even
  // if this secondary heartbeat temporarily fails.
  await updatePushPresence(token, true).catch(() => undefined);
  return subscription;
}

export async function updatePushPresence(token: string, isForeground: boolean) {
  const subscription = await getExistingPushSubscription();
  if (!subscription) return;
  await requestJson("/push/presence", token, {
    method: "POST",
    body: JSON.stringify({ endpoint: subscription.endpoint, isForeground }),
    keepalive: !isForeground,
  });
}

export async function disablePushNotifications(token: string) {
  const subscription = await getExistingPushSubscription();
  if (!subscription) return;
  const endpoint = subscription.endpoint;
  try {
    await requestJson("/push/subscriptions", token, {
      method: "DELETE",
      body: JSON.stringify({ endpoint }),
    });
  } finally {
    await subscription.unsubscribe();
  }
}

import { API_BASE_URL } from '../api/apiConfig';

export type PushSupport = 'supported' | 'unsupported';

export function getPushSupport(): PushSupport {
  return typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
    ? 'supported'
    : 'unsupported';
}

export function urlBase64ToUint8Array(value: string): Uint8Array {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const decoded = globalThis.atob(base64);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

function serializeSubscription(subscription: PushSubscription) {
  const json = subscription.toJSON();
  return {
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh ?? '',
    auth: json.keys?.auth ?? ''
  };
}

async function requestJson(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers
    }
  });
  if (!response.ok) throw new Error(`Push request failed: ${response.status}`);
  return response.json();
}

export async function getExistingPushSubscription() {
  if (getPushSupport() === 'unsupported') return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function enablePushNotifications(token: string) {
  if (getPushSupport() === 'unsupported') {
    throw new Error('unsupported');
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('permission-denied');

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    const keyResponse = await fetch(`${API_BASE_URL}/push/public-key`);
    if (!keyResponse.ok) throw new Error('configuration-unavailable');
    const payload: unknown = await keyResponse.json();
    const publicKey = typeof payload === 'object' && payload !== null &&
      'publicKey' in payload && typeof payload.publicKey === 'string'
      ? payload.publicKey
      : '';
    if (!publicKey) throw new Error('configuration-unavailable');
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
  }

  await requestJson('/push/subscriptions', token, {
    method: 'POST',
    body: JSON.stringify(serializeSubscription(subscription))
  });
  return subscription;
}

export async function disablePushNotifications(token: string) {
  const subscription = await getExistingPushSubscription();
  if (!subscription) return;
  const endpoint = subscription.endpoint;
  try {
    await requestJson('/push/subscriptions', token, {
      method: 'DELETE',
      body: JSON.stringify({ endpoint })
    });
  } finally {
    await subscription.unsubscribe();
  }
}

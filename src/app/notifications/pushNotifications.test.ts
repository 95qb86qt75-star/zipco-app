import { describe, expect, it } from 'vitest';
import { getPushSupport, urlBase64ToUint8Array } from './pushNotifications';

describe('pushNotifications', () => {
  it('reports unsupported outside a browser with Push API', () => {
    expect(getPushSupport()).toBe('unsupported');
  });

  it('decodes a URL-safe VAPID public key', () => {
    expect(Array.from(urlBase64ToUint8Array('AQIDBA'))).toEqual([1, 2, 3, 4]);
  });
});

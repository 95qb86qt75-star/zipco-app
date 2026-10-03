import { describe, expect, it } from "vitest";
import {
  getPushSupport,
  PushActivationError,
  urlBase64ToUint8Array,
} from "./pushNotifications";

describe("pushNotifications", () => {
  it("reports unsupported outside a browser with Push API", () => {
    expect(getPushSupport()).toBe("unsupported");
  });

  it("decodes a URL-safe VAPID public key", () => {
    expect(Array.from(urlBase64ToUint8Array("AQIDBA"))).toEqual([1, 2, 3, 4]);
  });

  it("preserves a safe activation code and detail for diagnostics", () => {
    const error = new PushActivationError("backend-registration-failed", "503");

    expect(error.message).toBe("backend-registration-failed");
    expect(error.code).toBe("backend-registration-failed");
    expect(error.detail).toBe("503");
  });
});

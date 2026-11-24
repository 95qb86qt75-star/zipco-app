import { afterEach, describe, expect, it, vi } from "vitest";
import { requestQaSession } from "./qaAuthApi";

const config = {
  state: "enabled" as const,
  apiOrigin: "https://zipco-backend-qa.up.railway.app",
};
const session = {
  access_token: "qa-jwt",
  user: {
    id: 1,
    name: "Cliente QA",
    email: "qa.customer@zipco.test",
    role: "user" as const,
  },
  businessId: null,
};

describe("QA auth API", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends the manually entered key only to the QA endpoint", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 201, json: async () => session });
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      requestQaSession(config, "customer", "manual-key"),
    ).resolves.toEqual(session);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://zipco-backend-qa.up.railway.app/qa/auth/session",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "X-QA-Auth-Key": "manual-key" }),
      }),
    );
  });

  it("rejects missing or padded keys before fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(requestQaSession(config, "customer", "")).rejects.toThrow(
      "configuración QA",
    );
    await expect(
      requestQaSession(config, "customer", " padded "),
    ).rejects.toThrow("configuración QA");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

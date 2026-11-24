import { describe, expect, it } from "vitest";
import { isQaAccount, resolveQaAuthConfig } from "./qaAuthConfig";

const valid = {
  isProd: true,
  enabled: "true",
  apiUrl: "https://zipco-backend-qa.up.railway.app",
};

describe("QA auth configuration", () => {
  it("enables only the exact QA backend", () => {
    expect(resolveQaAuthConfig(valid)).toEqual({
      state: "enabled",
      apiOrigin: valid.apiUrl,
    });
  });

  it("is disabled without the exact production build flag", () => {
    expect(resolveQaAuthConfig({ ...valid, isProd: false })).toEqual({
      state: "disabled",
    });
    expect(resolveQaAuthConfig({ ...valid, enabled: "false" })).toEqual({
      state: "disabled",
    });
  });

  it.each([
    "https://zipco-backend-production.up.railway.app",
    "http://zipco-backend-qa.up.railway.app",
    "https://zipco-backend-qa.up.railway.app/path",
    "not-a-url",
  ])("fails closed for API URL %s", (apiUrl) => {
    expect(resolveQaAuthConfig({ ...valid, apiUrl })).toEqual({
      state: "misconfigured",
    });
  });

  it("accepts only customer and business owner", () => {
    expect(isQaAccount("customer")).toBe(true);
    expect(isQaAccount("business-owner")).toBe(true);
    expect(isQaAccount("admin")).toBe(false);
  });
});

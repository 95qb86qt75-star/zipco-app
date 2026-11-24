export const QA_ACCOUNT_OPTIONS = [
  { account: "customer", label: "Cliente de prueba" },
  { account: "business-owner", label: "Dueño de negocio" },
] as const;

export type QaAccount = (typeof QA_ACCOUNT_OPTIONS)[number]["account"];

type QaAuthEnvironment = {
  isProd: boolean;
  enabled: string | undefined;
  apiUrl: string | undefined;
};

export type QaAuthConfig =
  | { state: "disabled" }
  | { state: "misconfigured" }
  | { state: "enabled"; apiOrigin: string };

const QA_API_ORIGIN = "https://zipco-backend-qa.up.railway.app";

export function resolveQaAuthConfig(
  environment: QaAuthEnvironment,
): QaAuthConfig {
  if (!environment.isProd || environment.enabled !== "true")
    return { state: "disabled" };
  if (!environment.apiUrl) return { state: "misconfigured" };
  try {
    const url = new URL(environment.apiUrl);
    const hasUnexpectedParts =
      url.username !== "" ||
      url.password !== "" ||
      (url.pathname !== "" && url.pathname !== "/") ||
      url.search !== "" ||
      url.hash !== "";
    if (hasUnexpectedParts || url.origin !== QA_API_ORIGIN)
      return { state: "misconfigured" };
    return { state: "enabled", apiOrigin: url.origin };
  } catch {
    return { state: "misconfigured" };
  }
}

export function isQaAccount(value: unknown): value is QaAccount {
  return (
    typeof value === "string" &&
    QA_ACCOUNT_OPTIONS.some((option) => option.account === value)
  );
}

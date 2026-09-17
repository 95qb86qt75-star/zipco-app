import {
  parseDevAuthSession,
  type DevAuthSessionResponse,
} from "../dev/devAuthApi";
import { isQaAccount, type QaAccount, type QaAuthConfig } from "./qaAuthConfig";

export class QaAuthError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "QaAuthError";
    this.status = status;
  }
}

function errorMessage(status: number): string {
  if (status === 400) return "La cuenta QA no está disponible.";
  if (status === 401) return "La clave QA fue rechazada.";
  if (status === 404) return "El acceso QA no está habilitado.";
  return "No se pudo iniciar la sesión QA.";
}

export async function requestQaSession(
  config: QaAuthConfig,
  account: QaAccount,
  key: string,
): Promise<DevAuthSessionResponse> {
  if (
    config.state !== "enabled" ||
    !isQaAccount(account) ||
    !key ||
    key !== key.trim()
  ) {
    throw new QaAuthError("La configuración QA no es válida.", 0);
  }
  let response: Response;
  try {
    response = await fetch(`${config.apiOrigin}/qa/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-QA-Auth-Key": key },
      body: JSON.stringify({ account }),
    });
  } catch {
    throw new QaAuthError("No se pudo conectar con el backend QA.", 0);
  }
  if (!response.ok)
    throw new QaAuthError(errorMessage(response.status), response.status);
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  const parsed = parseDevAuthSession(data);
  if (!parsed)
    throw new QaAuthError(
      "El backend QA devolvió una respuesta inválida.",
      response.status,
    );
  return parsed;
}

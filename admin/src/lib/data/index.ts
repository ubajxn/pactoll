import { createHttpAdapter } from "./http";

export * from "./contracts";

/** The application always uses the authenticated API; no local fallback. */
export function createConfiguredAdapter() {
  return createHttpAdapter("/api/crm");
}

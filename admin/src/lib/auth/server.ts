import { DataError } from "@/lib/data/contracts";
import { createHttpAdapter } from "@/lib/data/http";
import type { WorkspaceContext } from "./types";

function apiBase() {
  if (typeof window !== "undefined") return "/api/crm";
  const base =
    process.env.BETTER_AUTH_URL ||
    `http://localhost:${process.env.PORT || 3000}`;
  return `${base}/api/crm`;
}

export async function registrationStatus(): Promise<{
  signupAllowed: boolean;
}> {
  const base =
    process.env.BETTER_AUTH_URL ||
    `http://localhost:${process.env.PORT || 3000}`;
  const response = await fetch(`${base}/api/registration`, {
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok)
    throw new Error("Could not check registration availability. Try again.");
  return response.json();
}

export function serverData(headers: Headers) {
  return createHttpAdapter(`${apiBase()}`, (url, init) =>
    fetch(url, {
      ...init,
      headers: { ...init?.headers, cookie: headers.get("cookie") || "" },
    }),
  );
}

export async function workspaceSession(
  headers: Headers,
): Promise<WorkspaceContext | "unauthorized" | "workspace_required"> {
  const base =
    process.env.BETTER_AUTH_URL ||
    `http://localhost:${process.env.PORT || 3000}`;
  const response = await fetch(`${base}/api/context`, {
    headers: { cookie: headers.get("cookie") || "" },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (response.status === 401) return "unauthorized";
  if (response.status === 409) return "workspace_required";
  if (!response.ok)
    throw new Error(
      "The CRM service is unavailable. Start the backend and try again.",
    );
  return response.json();
}

export async function authorizeConversation(request: Request, id: string) {
  const data = serverData(request.headers);
  const conversation = await data.getConversation(id);
  if (conversation.access !== "owner")
    throw new DataError(
      "forbidden",
      "Only the chat owner can control responses",
    );
  return data;
}

export function authErrorResponse(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? error.code
      : "unavailable";
  const status =
    code === "unauthorized"
      ? 401
      : code === "not_found"
        ? 404
        : code === "forbidden" || code === "workspace_required"
          ? 403
          : 503;
  return new Response(
    status === 401
      ? "Sign in to continue."
      : status === 404
        ? "Conversation not found."
        : status === 403
          ? "Conversation access denied."
          : "The CRM service is unavailable.",
    { status },
  );
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  if (process.env.BETTER_AUTH_URL)
    return origin === process.env.BETTER_AUTH_URL;
  const url = new URL(request.url);
  const host = request.headers.get("host");
  if (host) url.host = host;
  return origin === url.origin;
}

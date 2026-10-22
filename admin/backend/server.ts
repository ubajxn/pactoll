/// <reference types="bun-types" />

import type { Pool } from "pg";
import { DataError } from "../src/lib/data/contracts";
import { createAuth } from "./auth";
import { authBaseUrl } from "./config";
import { getWorkspaceContext } from "./context";
import { createPostgresAdapter, migrate, openDatabase } from "./db";
import type { Email } from "./email";
import { publicSignupAllowed } from "./registration";
import { createHandler } from "./routes/api";

export async function startServer(
  options: {
    port?: number;
    pool?: Pool;
    baseURL?: string;
    secret?: string;
    sendEmail?: (email: Email) => Promise<void>;
  } = {},
) {
  const port = options.port ?? Number(process.env.CRM_BACKEND_PORT || 3001);
  if (!Number.isInteger(port) || port < 0 || port > 65535)
    throw new Error("Invalid CRM_BACKEND_PORT");
  const pool = options.pool ?? openDatabase();
  try {
    await migrate(pool);
    const baseURL = options.baseURL ?? authBaseUrl();
    const auth = createAuth(pool, { ...options, baseURL });
    const resolveContext = (request: Request) =>
      getWorkspaceContext(auth, pool, request);
    const handler = createHandler(
      async (request) =>
        createPostgresAdapter(pool, await resolveContext(request)),
      [baseURL],
    );
    const server = Bun.serve({
      hostname: process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1",
      port,
      maxRequestBodySize: 1024 * 1024,
      async fetch(request, server) {
        const url = new URL(request.url);
        const origin = request.headers.get("origin");
        const allowedOrigins = new Set([baseURL]);
        if (process.env.ALLOWED_ORIGINS)
          for (const o of process.env.ALLOWED_ORIGINS.split(","))
            allowedOrigins.add(o.trim());
        if (origin && !allowedOrigins.has(origin))
          return Response.json(
            { error: { code: "forbidden", message: "Origin is not allowed" } },
            { status: 403 },
          );
        if (url.pathname.startsWith("/api/auth/")) {
          // This loopback service never trusts client-supplied IP headers.
          const headers = new Headers(request.headers);
          headers.set(
            "x-crm-client-ip",
            server.requestIP(request)?.address || "127.0.0.1",
          );
          return auth.handler(new Request(request, { headers }));
        }
        if (url.pathname === "/api/registration" && request.method === "GET") {
          return Response.json(
            { signupAllowed: await publicSignupAllowed(pool) },
            {
              headers: { "Cache-Control": "no-store" },
            },
          );
        }
        if (url.pathname === "/api/context" && request.method === "GET") {
          try {
            return Response.json(await resolveContext(request), {
              headers: { "Cache-Control": "no-store" },
            });
          } catch (error) {
            if (!(error instanceof DataError)) {
              console.error("Session lookup failed");
              return Response.json(
                {
                  error: {
                    code: "unavailable",
                    message: "Could not check your session",
                  },
                },
                { status: 503 },
              );
            }
            return Response.json(
              { error: { code: error.code, message: error.message } },
              {
                status: error.code === "unauthorized" ? 401 : 409,
                headers: { "Cache-Control": "no-store" },
              },
            );
          }
        }
        return handler(request);
      },
    });
    return {
      server,
      pool,
      auth,
      async close() {
        await server.stop(true);
        if (!options.pool) await pool.end();
      },
    };
  } catch (error) {
    if (!options.pool) await pool.end();
    throw error;
  }
}
if (import.meta.main) {
  const app = await startServer();
  console.log(`CRM API listening at ${app.server.url}`);
  let closing = false;
  const close = async () => {
    if (closing) return;
    closing = true;
    await app.close();
    process.exit(0);
  };
  process.on("SIGINT", close);
  process.on("SIGTERM", close);
}

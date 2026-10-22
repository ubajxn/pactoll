import type { Pool } from "pg";
import { createAuth, type Auth } from "../../../backend/auth";
import { openDatabase, migrate } from "../../../backend/db";
import { createHandler } from "../../../backend/routes/api";
import { getWorkspaceContext } from "../../../backend/context";
import { createPostgresAdapter } from "../../../backend/db";
import { publicSignupAllowed } from "../../../backend/registration";
import { authBaseUrl } from "../../../backend/config";

let pool: Pool | undefined;
let auth: Auth | undefined;
let crmHandler: ((request: Request) => Promise<Response>) | undefined;
let migrated = false;

export function getPool(): Pool {
  if (!pool) pool = openDatabase();
  return pool;
}

async function ensureMigrated(p: Pool) {
  if (migrated) return;
  await migrate(p);
  migrated = true;
}

export async function getAuth(): Promise<Auth> {
  if (auth) return auth;
  const p = getPool();
  await ensureMigrated(p);
  const baseURL = authBaseUrl();
  auth = createAuth(p, { baseURL });
  return auth;
}

export async function getCrmHandler(): Promise<
  (request: Request) => Promise<Response>
> {
  if (crmHandler) return crmHandler;
  const p = getPool();
  await ensureMigrated(p);
  const baseURL = authBaseUrl();
  const a = await getAuth();
  const resolveContext = (request: Request) =>
    getWorkspaceContext(a, p, request);
  crmHandler = createHandler(
    async (request) => createPostgresAdapter(p, await resolveContext(request)),
    [baseURL],
  );
  return crmHandler;
}

export async function getRegistrationStatus() {
  const p = getPool();
  await ensureMigrated(p);
  return { signupAllowed: await publicSignupAllowed(p) };
}

export async function getContext(request: Request) {
  const p = getPool();
  const a = await getAuth();
  return getWorkspaceContext(a, p, request);
}

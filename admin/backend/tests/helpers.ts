import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import type { WorkspaceContext } from "../../src/lib/auth/types";
import { createHttpAdapter } from "../../src/lib/data/http";
import { databaseUrl } from "../config";
import type { Email } from "../email";
import { startServer } from "../server";

export async function isolatedDatabase() {
  const connectionString = process.env.CRM_TEST_DATABASE_URL || databaseUrl();
  const admin = new Pool({ connectionString });
  const name = `crm_test_${randomUUID().replaceAll("-", "")}`;
  await admin.query(`CREATE DATABASE "${name}"`);
  const url = new URL(connectionString);
  url.pathname = `/${name}`;
  const pool = new Pool({ connectionString: url.toString() });
  return {
    pool,
    connectionString: url.toString(),
    async close() {
      await pool.end();
      await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
      await admin.end();
    },
  };
}

export async function testApp(
  options: { sendEmail?: (email: Email) => Promise<void> } = {},
) {
  const database = await isolatedDatabase();
  const emails: Email[] = [];
  const baseURL = "http://localhost:3000";
  const serverOptions = {
    port: 0,
    pool: database.pool,
    baseURL,
    secret: randomUUID() + randomUUID(),
    sendEmail: async (message: Email) => {
      await options.sendEmail?.(message);
      emails.push(message);
    },
  };
  let app: Awaited<ReturnType<typeof startServer>>;
  try {
    app = await startServer(serverOptions);
  } catch (error) {
    await database.close();
    throw error;
  }
  function agent() {
    const cookies = new Map<string, string>();
    const request = async (path: string, method = "GET", body?: unknown) => {
      const response = await fetch(new URL(path, app.server.url), {
        method,
        redirect: "manual",
        headers: {
          origin: baseURL,
          cookie: [...cookies]
            .map(([key, value]) => `${key}=${value}`)
            .join("; "),
          ...(method === "GET" ? {} : { "Content-Type": "application/json" }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      for (const cookie of response.headers.getSetCookie()) {
        const pair = cookie.split(";")[0];
        const index = pair.indexOf("=");
        cookies.set(pair.slice(0, index), pair.slice(index + 1));
      }
      return response;
    };
    const api = createHttpAdapter("http://test.invalid/api", (url, init) =>
      request(
        new URL(url).pathname + new URL(url).search,
        init?.method,
        init?.body ? JSON.parse(String(init.body)) : undefined,
      ),
    );
    return {
      request,
      api,
      headers: () =>
        new Headers({
          cookie: [...cookies]
            .map(([key, value]) => `${key}=${value}`)
            .join("; "),
          origin: baseURL,
          host: "localhost:3000",
        }),
    };
  }
  async function login(
    email = `${randomUUID()}@example.test`,
    name = "Test Owner",
    invitationId?: string,
  ) {
    const user = agent();
    const sent = await user.request("/api/auth/sign-in/magic-link", "POST", {
      email,
      name,
      callbackURL: "/home",
      metadata: invitationId ? { invitationId } : undefined,
    });
    if (!sent.ok)
      throw new Error(`Requesting magic link failed: ${sent.status}`);
    const message = emails.findLast((message) => message.to === email);
    const link = message?.text.match(/https?:\/\/\S+/)?.[0];
    if (!link) throw new Error("No sign-in email delivered");
    const url = new URL(link);
    const verified = await user.request(url.pathname + url.search);
    if (
      verified.status !== 302 ||
      new URL(
        verified.headers.get("location") || baseURL,
        baseURL,
      ).searchParams.has("error")
    )
      throw new Error("Magic link verification failed");
    return user;
  }
  async function workspace(
    user: ReturnType<typeof agent>,
    name = "Test Workspace",
  ) {
    const response = await user.request(
      "/api/auth/organization/update",
      "POST",
      { data: { name } },
    );
    if (!response.ok)
      throw new Error(
        `Renaming company failed: ${response.status} ${await response.text()}`,
      );
    const context = await user.request("/api/context");
    if (!context.ok)
      throw new Error(`Workspace context failed: ${context.status}`);
    return (await context.json()) as WorkspaceContext;
  }
  // Pre-existing nonmember fixtures for data/permission suites. Signup policy is
  // tested separately through raw HTTP requests, without these fixtures.
  async function existingAccount(
    email = `${randomUUID()}@example.test`,
    name = "Existing account",
  ) {
    const client = await database.pool.connect();
    try {
      await client.query("BEGIN");
      const invitationId = randomUUID();
      await client.query(
        `INSERT INTO invitation (id,"organizationId",email,role,status,"expiresAt","inviterId")
        SELECT $1,o.id,$2,'member','pending',now()+interval '1 day',m."userId"
        FROM organization o JOIN member m ON m."organizationId"=o.id WHERE m.role='owner' LIMIT 1`,
        [invitationId, email],
      );
      await client.query(
        `INSERT INTO "user" (name,email,"emailVerified") VALUES ($1,$2,true)`,
        [name, email],
      );
      await client.query("DELETE FROM invitation WHERE id=$1", [invitationId]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    return login(email, name);
  }
  // Deliberately construct legacy foreign-workspace data for defense-in-depth
  // relationship tests. Production has no path to create a second company.
  async function legacyWorkspace(
    user: ReturnType<typeof agent>,
    name = "Legacy company",
  ) {
    const session = await app.auth.api.getSession({ headers: user.headers() });
    if (!session) throw new Error("Missing fixture session");
    const id = randomUUID();
    await database.pool.query(
      "DROP INDEX IF EXISTS organization_single_company",
    );
    await database.pool.query(
      `INSERT INTO organization (id,name,slug,"createdAt") VALUES ($1,$2,$3,now())`,
      [id, name, id],
    );
    await database.pool.query(
      `INSERT INTO member ("organizationId","userId",role,"createdAt") VALUES ($1,$2,'owner',now())`,
      [id, session.user.id],
    );
    await user.request("/api/auth/organization/set-active", "POST", {
      organizationId: id,
    });
    return (await (
      await user.request("/api/context")
    ).json()) as WorkspaceContext;
  }
  return {
    agent,
    login,
    workspace,
    existingAccount,
    legacyWorkspace,
    emails,
    pool: database.pool,
    get app() {
      return app;
    },
    async restart() {
      await app.close();
      app = await startServer(serverOptions);
    },
    async close() {
      await app.close();
      await database.close();
    },
  };
}
export type TestApp = Awaited<ReturnType<typeof testApp>>;

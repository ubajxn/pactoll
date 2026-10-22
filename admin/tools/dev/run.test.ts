import { expect, test } from "bun:test";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isolatedDatabase } from "../../backend/tests/helpers";

async function freePort() {
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch: () => new Response(),
  });
  const port = server.port as number;
  await server.stop(true);
  return port;
}
async function waitUntil(
  check: () => boolean | Promise<boolean>,
  timeout = 30000,
) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await Bun.sleep(100);
  }
  throw new Error("Timed out waiting for development process");
}
async function assertReleased(ports: number[]) {
  for (const port of ports) {
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port,
      fetch: () => new Response(),
    });
    await server.stop(true);
  }
}
function launch(port: number, backendPort: number, path: string) {
  const child = Bun.spawn([process.execPath, "tools/dev/run.ts"], {
    env: {
      ...process.env,
      PORT: String(port),
      CRM_BACKEND_PORT: String(backendPort),
      DATABASE_URL: path,
      CRM_MANAGE_SERVICES: "false",
      BETTER_AUTH_URL: `http://localhost:${port}`,
    },
    stdout: "pipe",
    stderr: "pipe",
  });
  let logs = "";
  const capture = async (stream: ReadableStream<Uint8Array>) => {
    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      logs += new TextDecoder().decode(value);
    }
  };
  const output = Promise.all([capture(child.stdout), capture(child.stderr)]);
  return { child, output, logs: () => logs };
}
for (const occupied of ["web", "api"])
  test(`occupied ${occupied} port fails without orphan servers`, async () => {
    const port = await freePort();
    const backendPort = await freePort();
    const blocker = Bun.serve({
      hostname: "127.0.0.1",
      port: occupied === "web" ? port : backendPort,
      fetch: () => new Response(),
    });
    const directory = mkdtempSync(join(tmpdir(), "crm-dev-"));
    const database = await isolatedDatabase();
    const run = launch(port, backendPort, database.connectionString);
    try {
      expect(await run.child.exited).toBe(1);
      await run.output;
      expect(run.logs()).toContain("occupied");
      await assertReleased([occupied === "web" ? backendPort : port]);
    } finally {
      run.child.kill();
      await blocker.stop(true);
      await database.close();
      rmSync(directory, { recursive: true, force: true });
    }
  }, 10000);

test("combined boot, API watch restart, frontend response, and SIGINT release both process groups", async () => {
  const port = await freePort();
  const backendPort = await freePort();
  const directory = mkdtempSync(join(tmpdir(), "crm-dev-"));
  const database = await isolatedDatabase();
  const run = launch(port, backendPort, database.connectionString);
  const source = "backend/server.ts";
  const original = statSync(source);
  try {
    await waitUntil(() => run.logs().includes("Ready in"));
    const page = await fetch(`http://127.0.0.1:${port}/home`, {
      signal: AbortSignal.timeout(25000),
      redirect: "manual",
    });
    expect(page.status).toBe(307);
    expect(page.headers.get("location")).toBe("/login?next=%2Fhome");
    const login = await fetch(`http://127.0.0.1:${port}/login?next=%2Fhome`);
    expect(login.status).toBe(200);
    expect(await login.text()).toContain("Set up your company");
    expect(run.logs()).toContain("[web]");
    expect(run.logs()).toContain("[api]");
    const count = () => run.logs().split("CRM API listening").length;
    const before = count();
    writeFileSync(source, readFileSync(source));
    await waitUntil(() => count() > before);
    expect(
      (await fetch(`http://127.0.0.1:${backendPort}/api/health`)).status,
    ).toBe(200);
    run.child.kill("SIGINT");
    expect(await run.child.exited).toBe(0);
    await run.output;
    await assertReleased([port, backendPort]);
  } catch (error) {
    console.error(run.logs());
    throw error;
  } finally {
    run.child.kill("SIGTERM");
    await run.child.exited;
    utimesSync(source, original.atime, original.mtime);
    await database.close();
    rmSync(directory, { recursive: true, force: true });
  }
}, 60000);

test("unexpected child exit terminates the other server and returns failure", async () => {
  const port = await freePort();
  const backendPort = await freePort();
  const directory = mkdtempSync(join(tmpdir(), "crm-dev-"));
  const database = await isolatedDatabase();
  const run = launch(port, backendPort, database.connectionString);
  try {
    await waitUntil(() => run.logs().includes("Ready in"));
    const ps = Bun.spawn(["ps", "-axo", "pid=,ppid=,command="], {
      stdout: "pipe",
    });
    const rows = (await new Response(ps.stdout).text()).split("\n");
    await ps.exited;
    const backend = rows.find((row) => {
      const [, ppid, ...command] = row.trim().split(/\s+/);
      return (
        Number(ppid) === run.child.pid &&
        command.join(" ").includes("backend/server.ts")
      );
    });
    if (!backend) throw new Error("Backend watcher child was not found");
    process.kill(Number(backend.trim().split(/\s+/)[0]), "SIGTERM");
    await waitUntil(() => run.child.exitCode !== null, 10000);
    expect(await run.child.exited).toBe(1);
    await run.output;
    await assertReleased([port, backendPort]);
  } finally {
    run.child.kill("SIGTERM");
    await run.child.exited;
    await database.close();
    rmSync(directory, { recursive: true, force: true });
  }
}, 45000);

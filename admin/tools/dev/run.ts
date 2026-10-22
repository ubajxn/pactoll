import { type ChildProcess, spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { createInterface } from "node:readline";

const frontendOnly = process.argv.includes("--frontend-only");
const port = Number(process.env.PORT || 3000);
const backendPort = Number(process.env.CRM_BACKEND_PORT || 3001);
for (const value of frontendOnly ? [port] : [port, backendPort])
  if (!Number.isInteger(value) || value < 1 || value > 65535)
    throw new Error("Ports must be integers from 1 to 65535");
if (!frontendOnly && port === backendPort)
  throw new Error("Frontend and backend ports must differ");
async function checkPort(value: number) {
  await new Promise<void>((resolve, reject) => {
    const server = createServer();
    server.once("error", () =>
      reject(new Error(`Port ${value} is occupied; choose another port`)),
    );
    server.listen(value, "127.0.0.1", () =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  });
}
const children: ChildProcess[] = [];
let stopping = false;
function signalTree(child: ChildProcess, signal: NodeJS.Signals) {
  if (!child.pid) return;
  try {
    process.kill(-child.pid, signal);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
  }
}
async function shutdown(code: number) {
  if (stopping) return;
  stopping = true;
  for (const child of children) signalTree(child, "SIGTERM");
  // Process groups include the Next worker and Bun watcher. Kill any stubborn descendants.
  await new Promise((resolve) => setTimeout(resolve, 800));
  for (const child of children) signalTree(child, "SIGKILL");
  process.exit(code);
}
function launch(
  label: string,
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
) {
  const child = spawn(command, args, {
    cwd: resolve(import.meta.dir, "../.."),
    env,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  children.push(child);
  for (const stream of [child.stdout, child.stderr])
    if (stream)
      createInterface({ input: stream }).on("line", (line) =>
        console.log(`[${label}] ${line}`),
      );
  child.once("error", (error) => {
    console.error(`[${label}] ${error.message}`);
    void shutdown(1);
  });
  child.once("exit", (code, signal) => {
    if (!stopping) {
      console.error(`[${label}] exited unexpectedly (${code ?? signal})`);
      void shutdown(1);
    }
  });
}
async function waitForBackend() {
  const deadline = Date.now() + 10000;
  while (!stopping && Date.now() < deadline) {
    try {
      const response = await fetch(
        `http://127.0.0.1:${backendPort}/api/health`,
        { signal: AbortSignal.timeout(500) },
      );
      if (response.ok && (await response.json()).service === "crm") return;
    } catch {
      /* The watcher may still be booting. */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Backend did not become healthy within 10 seconds");
}
process.on("SIGINT", () => void shutdown(0));
process.on("SIGTERM", () => void shutdown(0));
try {
  await checkPort(port);
  if (!frontendOnly) await checkPort(backendPort);
  if (!frontendOnly && process.env.CRM_MANAGE_SERVICES !== "false") {
    const services = spawnSync("docker", ["compose", "up", "-d", "--wait"], {
      stdio: "inherit",
    });
    if (services.error || services.status !== 0)
      throw new Error(
        "Could not start Postgres and Mailpit. Start Docker and retry.",
      );
  }
  const env = {
    ...process.env,
    PORT: String(port),
    CRM_BACKEND_PORT: String(backendPort),
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || `http://localhost:${port}`,
    CRM_BACKEND_URL:
      process.env.CRM_BACKEND_URL || `http://127.0.0.1:${backendPort}`,
  };
  if (!frontendOnly) {
    launch("api", process.execPath, ["--watch", "backend/server.ts"], env);
    await waitForBackend();
  }
  if (stopping) process.exit(1);
  launch(
    "web",
    "node",
    [
      "node_modules/next/dist/bin/next",
      "dev",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    env,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  await shutdown(1);
}

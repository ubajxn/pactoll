import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __backendDir = dirname(fileURLToPath(import.meta.url));

export function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.NODE_ENV === "production")
    throw new Error("DATABASE_URL is required");
  return `postgres://crm:crm_local@127.0.0.1:${process.env.POSTGRES_PORT || 5432}/crm`;
}

export function authBaseUrl() {
  const value =
    process.env.BETTER_AUTH_URL ||
    `http://localhost:${process.env.PORT || 3000}`;
  const url = new URL(value);
  if (url.origin !== value || !["http:", "https:"].includes(url.protocol))
    throw new Error("BETTER_AUTH_URL must be an exact HTTP(S) origin");
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:")
    throw new Error("BETTER_AUTH_URL must use HTTPS in production");
  return value;
}

export function authSecret() {
  const configured = process.env.BETTER_AUTH_SECRET;
  if (configured) {
    if (configured.length < 32)
      throw new Error("BETTER_AUTH_SECRET must be at least 32 characters");
    return configured;
  }
  if (process.env.NODE_ENV === "production")
    throw new Error("BETTER_AUTH_SECRET is required");
  const directory = resolve(__backendDir, "data");
  const path = resolve(directory, "auth-secret");
  mkdirSync(directory, { recursive: true });
  try {
    writeFileSync(path, randomBytes(48).toString("base64url"), {
      flag: "wx",
      mode: 0o600,
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
  return readFileSync(path, "utf8").trim();
}

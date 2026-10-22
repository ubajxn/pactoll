import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { copyRelease, packageRelease } from "./package";

test("release includes source, migrations, tests and notices while excluding private and generated material", () => {
  const directory = mkdtempSync(join(tmpdir(), "crm-package-test-"));
  const source = join(directory, "source");
  const output = join(directory, "customer");
  const keep = [
    "package.json",
    "bun.lock",
    ".env.example",
    "LICENSE.txt",
    "THIRD_PARTY_NOTICES.md",
    "licenses/inter-OFL.txt",
    "src/app/page.tsx",
    "backend/migrations/001_auth.sql",
    "backend/tests/contracts.test.ts",
    "tools/release/package.ts",
    "public/product-screenshot.png",
  ];
  const omit = [
    ".env",
    ".env.production",
    "package-lock.json",
    "node_modules/secret.txt",
    ".next/cache/build.js",
    ".git/config",
    "backend/data/auth-secret",
    "backend/data/backup.dump",
    "src/.DS_Store",
    "src/._metadata",
    "src/debug.log",
    "tools/output/verification.png",
    "tools/test-results/trace.zip",
    "tools/playwright-report/index.html",
    "coverage/index.html",
    "backend/private.pem",
    "backend/old.sqlite",
    "tsconfig.tsbuildinfo",
  ];
  try {
    for (const path of [...keep, ...omit]) {
      mkdirSync(dirname(join(source, path)), { recursive: true });
      writeFileSync(join(source, path), path);
    }
    copyRelease(source, output);
    for (const path of keep)
      expect(readFileSync(join(output, path), "utf8")).toBe(path);
    for (const path of omit) expect(existsSync(join(output, path))).toBe(false);
    expect(readFileSync(join(source, "backend/data/backup.dump"), "utf8")).toBe(
      "backend/data/backup.dump",
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("release rejects symlinks that could copy content from outside the project", () => {
  const directory = mkdtempSync(join(tmpdir(), "crm-package-test-"));
  try {
    const source = join(directory, "source");
    mkdirSync(join(source, "public"), { recursive: true });
    writeFileSync(join(directory, "private.txt"), "private");
    symlinkSync(
      join(directory, "private.txt"),
      join(source, "public/link.txt"),
    );
    expect(() => copyRelease(source, join(directory, "customer"))).toThrow(
      "symlinks",
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("customer archive contains only the source tree and no macOS metadata entries", () => {
  const directory = mkdtempSync(join(tmpdir(), "crm-archive-test-"));
  try {
    const source = join(directory, "source");
    mkdirSync(join(source, "src"), { recursive: true });
    writeFileSync(
      join(source, "src/page.tsx"),
      "export default function Page() { return null; }",
    );
    writeFileSync(join(source, "src/._page.tsx"), "Finder metadata");
    const archive = join(directory, "customer package.tar.gz");
    packageRelease(source, archive);
    const result = spawnSync("tar", ["-tzf", archive], { encoding: "utf8" });
    expect(result.status).toBe(0);
    const entries = result.stdout.trim().split("\n");
    expect(entries).toContain("crm-dashboard/src/page.tsx");
    expect(entries.every((path) => path.startsWith("crm-dashboard/"))).toBe(
      true,
    );
    expect(
      entries.some((path) =>
        path.split("/").some((name) => name.startsWith("._")),
      ),
    ).toBe(false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

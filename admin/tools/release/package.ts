import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

// Explicit source roots keep local databases, credentials and audit output out
// of the customer package, even when they are accidentally tracked by Git.
const sourceEntries = [
  "src",
  "backend",
  "tools",
  "public",
  "docs",
  "licenses",
  "package.json",
  "bun.lock",
  "bunfig.toml",
  "tsconfig.json",
  "next.config.ts",
  "postcss.config.mjs",
  "biome.json",
  "components.json",
  "compose.yaml",
  ".env.example",
  ".gitignore",
  "AGENTS.md",
  "CLAUDE.md",
  "README.md",
  "THIRD_PARTY_NOTICES.md",
  "LICENSE",
  "LICENSE.txt",
  "LICENSE.md",
];
const excludedDirectories = new Set([
  ".git",
  ".next",
  "node_modules",
  "coverage",
  "test-results",
  "playwright-report",
  "blob-report",
  "output",
  "outputs",
  "__pycache__",
]);

export function copyRelease(source: string, destination: string) {
  function copy(relative: string) {
    const name = relative.split("/").at(-1) ?? relative;
    if (
      relative === "backend/data" ||
      excludedDirectories.has(name) ||
      name === ".DS_Store" ||
      name.startsWith("._") ||
      (name.startsWith(".env") && relative !== ".env.example") ||
      /\.(log|tsbuildinfo|pem|key|dump|sqlite(?:3)?(?:-wal|-shm)?|bak)$/i.test(
        name,
      )
    )
      return;
    const input = join(source, relative);
    if (!existsSync(input)) return;
    const entry = lstatSync(input);
    if (entry.isSymbolicLink())
      throw new Error(`Release source must not contain symlinks: ${relative}`);
    const output = join(destination, relative);
    if (entry.isDirectory()) {
      mkdirSync(output, { recursive: true });
      for (const child of readdirSync(input).sort())
        copy(`${relative}/${child}`);
    } else if (entry.isFile()) {
      mkdirSync(dirname(output), { recursive: true });
      copyFileSync(input, output);
    }
  }
  for (const entry of sourceEntries) copy(entry);
}

export function packageRelease(root: string, output: string) {
  const staging = mkdtempSync(join(tmpdir(), "crm-release-"));
  try {
    copyRelease(root, join(staging, "crm-dashboard"));
    mkdirSync(dirname(output), { recursive: true });
    const archive = spawnSync(
      "tar",
      ["-czf", output, "-C", staging, "crm-dashboard"],
      {
        stdio: "inherit",
        env: { ...process.env, COPYFILE_DISABLE: "1" },
      },
    );
    if (archive.error) throw archive.error;
    if (archive.status !== 0) throw new Error("Release packaging failed");
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  const root = resolve(import.meta.dir, "../..");
  const output = resolve(
    process.argv[2] ?? join(root, "release/crm-dashboard.tar.gz"),
  );
  packageRelease(root, output);
  console.log(output);
}

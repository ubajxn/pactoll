import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getPool } from "@/lib/api/singleton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function sourceHTML() {
  const filePath = resolve(process.cwd(), "public", "proposal-source.html");
  return readFile(filePath, "utf-8");
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  if (url.searchParams.has("reset")) {
    try {
      const pool = getPool();
      await pool.query("DELETE FROM crm_documents WHERE slug = $1", ["proposal"]);
    } catch {}
    const html = await sourceHTML();
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    const pool = getPool();
    const { rows } = await pool.query<{ html: string }>(
      "SELECT html FROM crm_documents WHERE slug = $1 LIMIT 1",
      ["proposal"],
    );

    if (rows[0]?.html) {
      return new Response(rows[0].html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  } catch {
    // DB not ready or table doesn't exist yet — fall through to static file
  }

  const html = await sourceHTML();
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

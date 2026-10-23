import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getPool } from "@/lib/api/singleton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
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

  const filePath = resolve(process.cwd(), "public", "proposal-source.html");
  const html = await readFile(filePath, "utf-8");
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

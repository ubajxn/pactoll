import { NextResponse } from "next/server";
import { getPool, getContext } from "@/lib/api/singleton";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const context = await getContext(request);
    const { html } = await request.json();
    if (!html || typeof html !== "string") {
      return NextResponse.json({ error: "Missing html" }, { status: 400 });
    }

    const pool = getPool();
    await pool.query(
      `INSERT INTO crm_documents (slug, org_id, html, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (slug) DO UPDATE SET html = $3, updated_by = $4, updated_at = now()`,
      ["proposal", context.workspace.id, html, context.user.id],
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Save failed";
    if (message.includes("unauthorized") || message.includes("Sign in")) {
      return NextResponse.json({ error: "Sign in to save" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

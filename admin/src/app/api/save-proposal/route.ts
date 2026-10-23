import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Saving is not available in production. Use the admin CRM to manage proposals." },
      { status: 403 },
    );
  }

  try {
    const { html } = await request.json();
    if (!html || typeof html !== "string") {
      return NextResponse.json({ error: "Missing html" }, { status: 400 });
    }

    const dest = resolve(process.cwd(), "public", "proposal.html");
    await writeFile(dest, html, "utf-8");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Write failed" }, { status: 500 });
  }
}

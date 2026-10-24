import { NextResponse } from "next/server";
import { getPool } from "@/lib/api/singleton";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = url.searchParams.get("page");
  const status = url.searchParams.get("status") || "open";

  const pool = getPool();

  if (page) {
    if (status === "all") {
      const { rows } = await pool.query(
        `SELECT * FROM site_reviews WHERE page = $1 ORDER BY created_at DESC`,
        [page],
      );
      return NextResponse.json(rows);
    }
    const { rows } = await pool.query(
      `SELECT * FROM site_reviews WHERE page = $1 AND status = $2 ORDER BY created_at DESC`,
      [page, status],
    );
    return NextResponse.json(rows);
  }

  const { rows } = await pool.query(
    `SELECT * FROM site_reviews ORDER BY created_at DESC LIMIT 200`,
  );
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { page, reviewer, comment, pin_x, pin_y, element_selector } = body;

    if (!page || !reviewer || !comment) {
      return NextResponse.json(
        { error: "page, reviewer, and comment are required" },
        { status: 400 },
      );
    }

    const pool = getPool();
    const { rows } = await pool.query(
      `INSERT INTO site_reviews (page, reviewer, comment, pin_x, pin_y, element_selector)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [page, reviewer, comment, pin_x ?? null, pin_y ?? null, element_selector ?? null],
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "id and status are required" },
        { status: 400 },
      );
    }

    const pool = getPool();
    const { rows } = await pool.query(
      `UPDATE site_reviews SET status = $1, resolved_at = CASE WHEN $1 = 'resolved' THEN now() ELSE NULL END
       WHERE id = $2 RETURNING *`,
      [status, id],
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

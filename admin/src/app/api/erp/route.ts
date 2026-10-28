import { getPool } from "@/lib/api/singleton";
import { getContext } from "@/lib/api/singleton";
import { canAccessTable } from "@/lib/permissions";

export const runtime = "nodejs";

const ALLOWED_TABLES = [
  "erp_jobs",
  "erp_job_lines",
  "erp_coils",
  "erp_processing_steps",
  "erp_inspections",
  "erp_material_grades",
  "erp_equipment",
  "erp_carriers",
  "erp_vehicles",
  "erp_shipments",
  "erp_shipment_items",
  "erp_insurance_policies",
  "erp_insurance_claims",
  "erp_coi_tracking",
  "erp_properties",
  "erp_tenants",
  "erp_property_maintenance",
  "erp_vendors",
  "erp_vendor_contracts",
  "erp_invoices",
  "erp_invoice_lines",
  "erp_payments",
  "erp_purchase_orders",
  "erp_po_lines",
  "erp_expenses",
  "erp_employees",
  "erp_certifications",
  "erp_safety_incidents",
  "erp_equipment_maintenance",
  "erp_documents",
  "erp_audit_log",
  "erp_notifications",
  "erp_territories",
  "erp_territory_zones",
  "erp_territory_performance",
  "erp_territory_assignments",
  "erp_target_markets",
  "erp_campaigns",
  "erp_campaign_touches",
  "erp_opportunities",
  "erp_cost_centers",
  "erp_labor_costs",
  "erp_consumables",
  "erp_consumable_usage",
  "erp_capex",
  "erp_budgets",
  "erp_utility_accounts",
  "erp_utility_bills",
  "erp_competitors",
  "erp_deliverables",
  "erp_digital_presence",
  "erp_consultant_invoices",
  "erp_consultant_deliverables",
  "erp_consultant_retainer",
];

const SYSTEM_COLUMNS = ["id", "org_id", "created_at"];

function validateTable(table: string): boolean {
  return ALLOWED_TABLES.includes(table);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const table = url.searchParams.get("table");
  const orgId = url.searchParams.get("org");

  if (!table || !orgId) {
    return Response.json({ error: "Missing table or org" }, { status: 400 });
  }

  if (!validateTable(table)) {
    return Response.json({ error: "Invalid table" }, { status: 400 });
  }

  try {
    const context = await getContext(request);
    if (!context) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessTable(context.role, table)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const pool = getPool();
    const limit = Math.min(
      Number(url.searchParams.get("limit")) || 100,
      500,
    );
    const offset = Number(url.searchParams.get("offset")) || 0;
    const status = url.searchParams.get("status");
    const id = url.searchParams.get("id");
    const parentField = url.searchParams.get("parent_field");
    const parentId = url.searchParams.get("parent_id");
    const orderBy = url.searchParams.get("order_by") || "created_at";
    const orderDir = url.searchParams.get("order_dir") === "asc" ? "ASC" : "DESC";
    const search = url.searchParams.get("search");

    if (id) {
      const { rows } = await pool.query(
        `SELECT * FROM ${table} WHERE id = $1 AND org_id = $2`,
        [id, orgId],
      );
      if (rows.length === 0) {
        return Response.json({ error: "Not found" }, { status: 404 });
      }
      return Response.json({ data: rows[0] });
    }

    let query = `SELECT * FROM ${table} WHERE org_id = $1`;
    const params: unknown[] = [orgId];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (parentField && parentId) {
      const safeField = parentField.replace(/[^a-z_]/g, "");
      params.push(parentId);
      query += ` AND ${safeField} = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR COALESCE(notes,'') ILIKE $${params.length})`;
    }

    const safeOrder = orderBy.replace(/[^a-z_]/g, "");
    query += ` ORDER BY ${safeOrder} ${orderDir} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);

    const countParams = params.slice(0, -2);
    const countQuery = query
      .replace(/SELECT \*/, "SELECT count(*)")
      .replace(/ ORDER BY.*$/, "");
    const countResult = await pool.query(countQuery, countParams);

    return Response.json({
      data: rows,
      total: Number(countResult.rows[0].count),
      limit,
      offset,
    });
  } catch (e) {
    console.error("ERP API error:", e);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await getContext(request);
    if (!context) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { table, org_id, ...fields } = body;

    if (!table || !org_id) {
      return Response.json({ error: "Missing table or org_id" }, { status: 400 });
    }
    if (!validateTable(table)) {
      return Response.json({ error: "Invalid table" }, { status: 400 });
    }
    if (!canAccessTable(context.role, table)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const pool = getPool();
    const columns = Object.keys(fields).filter((k) => !SYSTEM_COLUMNS.includes(k));
    const values = columns.map((k) => fields[k]);

    const colList = ["org_id", ...columns].join(", ");
    const valPlaceholders = ["$1", ...columns.map((_, i) => `$${i + 2}`)].join(", ");

    const { rows } = await pool.query(
      `INSERT INTO ${table} (${colList}) VALUES (${valPlaceholders}) RETURNING *`,
      [org_id, ...values],
    );

    await pool.query(
      `INSERT INTO erp_audit_log (org_id, table_name, record_id, action, changed_by, new_values)
       VALUES ($1, $2, $3, 'create', $4, $5)`,
      [org_id, table, rows[0].id, context.user.id, JSON.stringify(fields)],
    );

    return Response.json({ data: rows[0] }, { status: 201 });
  } catch (e: unknown) {
    console.error("ERP POST error:", e);
    const msg = e instanceof Error ? e.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const context = await getContext(request);
    if (!context) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { table, id, org_id, ...fields } = body;

    if (!table || !id || !org_id) {
      return Response.json({ error: "Missing table, id, or org_id" }, { status: 400 });
    }
    if (!validateTable(table)) {
      return Response.json({ error: "Invalid table" }, { status: 400 });
    }
    if (!canAccessTable(context.role, table)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const pool = getPool();

    const existing = await pool.query(
      `SELECT * FROM ${table} WHERE id = $1 AND org_id = $2`,
      [id, org_id],
    );
    if (existing.rows.length === 0) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const columns = Object.keys(fields).filter((k) => !SYSTEM_COLUMNS.includes(k));
    if (columns.length === 0) {
      return Response.json({ data: existing.rows[0] });
    }

    const setClauses = columns.map((k, i) => `${k} = $${i + 3}`);
    setClauses.push(`updated_at = now()`);
    const values = columns.map((k) => fields[k]);

    const { rows } = await pool.query(
      `UPDATE ${table} SET ${setClauses.join(", ")} WHERE id = $1 AND org_id = $2 RETURNING *`,
      [id, org_id, ...values],
    );

    await pool.query(
      `INSERT INTO erp_audit_log (org_id, table_name, record_id, action, changed_by, old_values, new_values)
       VALUES ($1, $2, $3, 'update', $4, $5, $6)`,
      [org_id, table, id, context.user.id, JSON.stringify(existing.rows[0]), JSON.stringify(fields)],
    );

    return Response.json({ data: rows[0] });
  } catch (e: unknown) {
    console.error("ERP PUT error:", e);
    const msg = e instanceof Error ? e.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await getContext(request);
    if (!context) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const table = url.searchParams.get("table");
    const id = url.searchParams.get("id");
    const orgId = url.searchParams.get("org");

    if (!table || !id || !orgId) {
      return Response.json({ error: "Missing table, id, or org" }, { status: 400 });
    }
    if (!validateTable(table)) {
      return Response.json({ error: "Invalid table" }, { status: 400 });
    }
    if (!canAccessTable(context.role, table)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const pool = getPool();

    const existing = await pool.query(
      `SELECT * FROM ${table} WHERE id = $1 AND org_id = $2`,
      [id, orgId],
    );
    if (existing.rows.length === 0) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    await pool.query(
      `DELETE FROM ${table} WHERE id = $1 AND org_id = $2`,
      [id, orgId],
    );

    await pool.query(
      `INSERT INTO erp_audit_log (org_id, table_name, record_id, action, changed_by, old_values)
       VALUES ($1, $2, $3, 'delete', $4, $5)`,
      [orgId, table, id, context.user.id, JSON.stringify(existing.rows[0])],
    );

    return Response.json({ success: true });
  } catch (e: unknown) {
    console.error("ERP DELETE error:", e);
    const msg = e instanceof Error ? e.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}

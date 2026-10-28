export type Role = "owner" | "admin" | "member";

export type Module =
  | "home"
  | "tasks"
  | "chat"
  | "accounts"
  | "contacts"
  | "opportunities"
  | "jobs"
  | "inventory"
  | "equipment"
  | "shipments"
  | "quality"
  | "safety"
  | "invoices"
  | "purchase-orders"
  | "expenses"
  | "properties"
  | "insurance"
  | "vendors"
  | "analytics"
  | "territories"
  | "campaigns"
  | "competitors"
  | "proposal"
  | "digital-presence"
  | "my-invoices"
  | "my-deliverables"
  | "settings"
  | "lists";

const OWNER_ONLY: readonly Module[] = [
  "competitors",
  "expenses",
  "properties",
  "insurance",
  "analytics",
  "proposal",
  "my-invoices",
  "my-deliverables",
];

const ADMIN_AND_ABOVE: readonly Module[] = [
  "invoices",
  "purchase-orders",
  "vendors",
  "territories",
  "campaigns",
  "digital-presence",
];

const ROLE_HIERARCHY: Record<Role, number> = {
  member: 0,
  admin: 1,
  owner: 2,
};

function minRoleForModule(mod: Module): Role {
  if (OWNER_ONLY.includes(mod)) return "owner";
  if (ADMIN_AND_ABOVE.includes(mod)) return "admin";
  return "member";
}

export function canAccess(role: string, mod: Module): boolean {
  const userLevel = ROLE_HIERARCHY[role as Role] ?? -1;
  const requiredLevel = ROLE_HIERARCHY[minRoleForModule(mod)];
  return userLevel >= requiredLevel;
}

export function filterNavByRole<T extends { href: string }>(
  items: readonly T[],
  role: string,
): T[] {
  return items.filter((item) => {
    const mod = hrefToModule(item.href);
    return mod ? canAccess(role, mod) : true;
  });
}

function hrefToModule(href: string): Module | null {
  const slug = href.replace(/^\//, "").split("/")[0];
  const map: Record<string, Module> = {
    home: "home",
    tasks: "tasks",
    accounts: "accounts",
    contacts: "contacts",
    opportunities: "opportunities",
    jobs: "jobs",
    inventory: "inventory",
    equipment: "equipment",
    shipments: "shipments",
    quality: "quality",
    safety: "safety",
    invoices: "invoices",
    "purchase-orders": "purchase-orders",
    expenses: "expenses",
    properties: "properties",
    insurance: "insurance",
    vendors: "vendors",
    analytics: "analytics",
    territories: "territories",
    campaigns: "campaigns",
    competitors: "competitors",
    proposal: "proposal",
    "digital-presence": "digital-presence",
    "my-invoices": "my-invoices",
    "my-deliverables": "my-deliverables",
    settings: "settings",
    lists: "lists",
    chat: "chat",
  };
  return map[slug] ?? null;
}

const TABLE_MODULE_MAP: Record<string, Module> = {
  erp_competitors: "competitors",
  erp_deliverables: "proposal",
  erp_campaigns: "campaigns",
  erp_campaign_touches: "campaigns",
  erp_territories: "territories",
  erp_territory_zones: "territories",
  erp_territory_performance: "territories",
  erp_territory_assignments: "territories",
  erp_target_markets: "territories",
  erp_opportunities: "opportunities",
  erp_jobs: "jobs",
  erp_job_lines: "jobs",
  erp_coils: "inventory",
  erp_processing_steps: "jobs",
  erp_inspections: "quality",
  erp_material_grades: "inventory",
  erp_equipment: "equipment",
  erp_equipment_maintenance: "equipment",
  erp_carriers: "shipments",
  erp_vehicles: "shipments",
  erp_shipments: "shipments",
  erp_shipment_items: "shipments",
  erp_insurance_policies: "insurance",
  erp_insurance_claims: "insurance",
  erp_coi_tracking: "insurance",
  erp_properties: "properties",
  erp_tenants: "properties",
  erp_property_maintenance: "properties",
  erp_vendors: "vendors",
  erp_vendor_contracts: "vendors",
  erp_invoices: "invoices",
  erp_invoice_lines: "invoices",
  erp_payments: "invoices",
  erp_purchase_orders: "purchase-orders",
  erp_po_lines: "purchase-orders",
  erp_expenses: "expenses",
  erp_employees: "home",
  erp_certifications: "safety",
  erp_safety_incidents: "safety",
  erp_documents: "home",
  erp_audit_log: "home",
  erp_notifications: "home",
  erp_cost_centers: "expenses",
  erp_labor_costs: "expenses",
  erp_consumables: "inventory",
  erp_consumable_usage: "inventory",
  erp_capex: "expenses",
  erp_budgets: "expenses",
  erp_utility_accounts: "properties",
  erp_utility_bills: "properties",
  erp_digital_presence: "digital-presence",
  erp_consultant_invoices: "my-invoices",
  erp_consultant_deliverables: "my-deliverables",
  erp_consultant_retainer: "my-invoices",
};

export function canAccessTable(role: string, table: string): boolean {
  const mod = TABLE_MODULE_MAP[table];
  if (!mod) return false;
  return canAccess(role, mod);
}

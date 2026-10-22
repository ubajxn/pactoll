"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, Building2, Wrench, DollarSign, Plus, Pencil, X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/crm/page-header";
import { PermissionGate } from "@/components/crm/permission-gate";

const ORG_ID = "da62326b-707d-41bd-bc2d-a61a81926dae";

type Property = {
  id: string;
  name: string;
  type: string;
  status: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  square_footage: number | null;
  lot_size_acres: number | null;
  purchase_date: string | null;
  purchase_price: number | null;
  current_value: number | null;
  monthly_cost: number | null;
  notes: string | null;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#059669", bg: "#ecfdf5" },
  under_renovation: { label: "Renovation", color: "#d97706", bg: "#fffbeb" },
  vacant: { label: "Vacant", color: "#6b7280", bg: "#f3f4f6" },
  for_sale: { label: "For Sale", color: "#2563eb", bg: "#eff6ff" },
  sold: { label: "Sold", color: "#9ca3af", bg: "#f9fafb" },
  leased: { label: "Leased", color: "#157070", bg: "#e6f3f3" },
};

const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label }));

const TYPE_OPTIONS = [
  { value: "plant", label: "Plant" },
  { value: "warehouse", label: "Warehouse" },
  { value: "yard", label: "Storage Yard" },
  { value: "office", label: "Office" },
  { value: "lot", label: "Lot" },
  { value: "other", label: "Other" },
];

type PropertyFormData = {
  name: string;
  type: string;
  status: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip: string;
  square_footage: string;
  lot_size_acres: string;
  purchase_date: string;
  purchase_price: string;
  current_value: string;
  monthly_cost: string;
  notes: string;
};

const EMPTY_FORM: PropertyFormData = {
  name: "", type: "plant", status: "active",
  address_line1: "", address_line2: "", city: "", state: "", zip: "",
  square_footage: "", lot_size_acres: "",
  purchase_date: "", purchase_price: "", current_value: "", monthly_cost: "",
  notes: "",
};

function PropertyEditor({ property, onSave, onClose, onDelete }: {
  property: Property | null;
  onSave: (data: PropertyFormData) => Promise<void>;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const isEdit = !!property;
  const [form, setForm] = useState<PropertyFormData>(() => {
    if (!property) return EMPTY_FORM;
    return {
      name: property.name,
      type: property.type,
      status: property.status,
      address_line1: property.address_line1 || "",
      address_line2: property.address_line2 || "",
      city: property.city || "",
      state: property.state || "",
      zip: property.zip || "",
      square_footage: property.square_footage?.toString() || "",
      lot_size_acres: property.lot_size_acres?.toString() || "",
      purchase_date: property.purchase_date || "",
      purchase_price: property.purchase_price?.toString() || "",
      current_value: property.current_value?.toString() || "",
      monthly_cost: property.monthly_cost?.toString() || "",
      notes: property.notes || "",
    };
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"basics" | "location" | "financials">("basics");

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  const set = (key: keyof PropertyFormData, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l bg-background shadow-2xl"
    >
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">{isEdit ? "Edit Property" : "New Property"}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{isEdit ? "Update property details" : "Register a new property or facility"}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
      </div>

      <div className="flex gap-1 border-b px-5">
        {(["basics", "location", "financials"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${tab === t ? "border-[#157070] text-[#157070]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t === "basics" ? "Basics" : t === "location" ? "Location" : "Financials"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "basics" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Property Name *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. Carson Main Plant" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
                <select value={form.type} onChange={(e) => set("type", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]">
                  {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]">
                  {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Square Footage</label>
                <input value={form.square_footage} onChange={(e) => set("square_footage", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. 45000" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Lot Size (acres)</label>
                <input value={form.lot_size_acres} onChange={(e) => set("lot_size_acres", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. 2.5" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes</label>
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="Facility details, special features, lease terms..." />
            </div>
          </div>
        )}

        {tab === "location" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Address Line 1</label>
              <input value={form.address_line1} onChange={(e) => set("address_line1", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="Street address" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Address Line 2</label>
              <input value={form.address_line2} onChange={(e) => set("address_line2", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="Suite, unit, building" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">City</label>
                <input value={form.city} onChange={(e) => set("city", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="Carson" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">State</label>
                <input value={form.state} onChange={(e) => set("state", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="CA" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">ZIP</label>
                <input value={form.zip} onChange={(e) => set("zip", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="90745" />
              </div>
            </div>
          </div>
        )}

        {tab === "financials" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Purchase Date</label>
              <input type="date" value={form.purchase_date} onChange={(e) => set("purchase_date", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Purchase Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input value={form.purchase_price} onChange={(e) => set("purchase_price", e.target.value)} className="w-full rounded-md border bg-background py-2 pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="1,500,000" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Current Value</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input value={form.current_value} onChange={(e) => set("current_value", e.target.value)} className="w-full rounded-md border bg-background py-2 pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="1,800,000" />
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Monthly Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input value={form.monthly_cost} onChange={(e) => set("monthly_cost", e.target.value)} className="w-full rounded-md border bg-background py-2 pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="12,000" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t px-5 py-3">
        <div>
          {isEdit && onDelete && (
            <button type="button" onClick={onDelete} className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 className="size-3.5" /> Delete
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onClose} className="rounded-md border px-4 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving || !form.name.trim()} className="rounded-md bg-[#157070] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#126060] disabled:opacity-50 transition-colors">
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Property"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, icon: Icon, color, delay, prefix, suffix }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; color: string; delay: number; prefix?: string; suffix?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }} className="rounded-lg border bg-card p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}18` }}><Icon className="size-4" style={{ color }} /></div>
      </div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: delay + 0.2 }} className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{prefix}{value}{suffix && <span className="ml-1 text-sm font-normal text-muted-foreground">{suffix}</span>}</motion.p>
    </motion.div>
  );
}

export default function PropertiesPage() {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  const [editor, setEditor] = useState<{ open: boolean; property: Property | null }>({ open: false, property: null });

  const loadData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ table: "erp_properties", org: ORG_ID });
    if (filter !== "all") params.set("status", filter);
    fetch(`/api/erp?${params}`)
      .then((r) => r.json())
      .then((d) => { setItems(d.data || []); setTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (data: PropertyFormData) => {
    const payload = {
      table: "erp_properties",
      org_id: ORG_ID,
      name: data.name,
      type: data.type,
      status: data.status,
      address_line1: data.address_line1 || null,
      address_line2: data.address_line2 || null,
      city: data.city || null,
      state: data.state || null,
      zip: data.zip || null,
      square_footage: data.square_footage ? Number(data.square_footage.replace(/,/g, "")) : null,
      lot_size_acres: data.lot_size_acres ? Number(data.lot_size_acres) : null,
      purchase_date: data.purchase_date || null,
      purchase_price: data.purchase_price ? Number(data.purchase_price.replace(/,/g, "")) : null,
      current_value: data.current_value ? Number(data.current_value.replace(/,/g, "")) : null,
      monthly_cost: data.monthly_cost ? Number(data.monthly_cost.replace(/,/g, "")) : null,
      notes: data.notes || null,
    };
    if (editor.property) {
      await fetch("/api/erp", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: editor.property.id }) });
    } else {
      await fetch("/api/erp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setEditor({ open: false, property: null });
    loadData();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/erp?table=erp_properties&id=${id}&org=${ORG_ID}`, { method: "DELETE" });
    setEditor({ open: false, property: null });
    loadData();
  };

  const totalValue = items.reduce((s, p) => s + (Number(p.current_value) || 0), 0);
  const totalSqFt = items.reduce((s, p) => s + (Number(p.square_footage) || 0), 0);
  const monthlyCosts = items.reduce((s, p) => s + (Number(p.monthly_cost) || 0), 0);

  return (
    <PermissionGate module="properties">
      <PageHeader title="Properties" description="Facilities, storage yards, and real estate" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Properties" value={total} icon={Building2} color="#157070" delay={0} />
        <StatCard label="Portfolio Value" value={totalValue > 0 ? totalValue.toLocaleString() : "0"} icon={DollarSign} color="#059669" delay={0.1} prefix="$" />
        <StatCard label="Total Sq Ft" value={totalSqFt > 0 ? totalSqFt.toLocaleString() : "0"} icon={MapPin} color="#2563eb" delay={0.2} />
        <StatCard label="Monthly Cost" value={monthlyCosts > 0 ? monthlyCosts.toLocaleString() : "0"} icon={Wrench} color="#d97706" delay={0.3} prefix="$" suffix="/mo" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium">Property Registry</h3>
            <div className="flex items-center gap-1">
              {["all", "active", "leased", "vacant", "for_sale"].map((s) => (
                <button key={s} type="button" onClick={() => setFilter(s)} className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${filter === s ? "bg-[#157070] text-white" : "text-muted-foreground hover:bg-muted"}`}>
                  {s === "all" ? "All" : s === "for_sale" ? "For Sale" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setEditor({ open: true, property: null })} className="flex items-center gap-1.5 rounded-md bg-[#157070] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#126060] transition-colors">
            <Plus className="size-3.5" /> Add Property
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="size-6 animate-spin rounded-full border-2 border-[#157070] border-t-transparent" /></div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <Building2 className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No properties registered</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Properties will appear as facilities are added</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Address</th>
                  <th className="px-4 py-2.5 text-right">Sq Ft</th>
                  <th className="px-4 py-2.5 text-right">Lot (ac)</th>
                  <th className="px-4 py-2.5 text-right">Value</th>
                  <th className="px-4 py-2.5 text-right">Monthly</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((prop, i) => {
                  const sc = STATUS_CONFIG[prop.status] || { label: prop.status, color: "#6b7280", bg: "#f3f4f6" };
                  const addr = [prop.city, prop.state].filter(Boolean).join(", ");
                  return (
                    <motion.tr key={prop.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }} className="border-b transition-colors last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{prop.name}</td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{prop.type?.replace(/_/g, " ") || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{addr || "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{prop.square_footage ? Number(prop.square_footage).toLocaleString() : "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{prop.lot_size_acres || "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{prop.current_value ? `$${Number(prop.current_value).toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{prop.monthly_cost ? `$${Number(prop.monthly_cost).toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span></td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => setEditor({ open: true, property: prop })} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                          <Pencil className="size-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {editor.open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black" onClick={() => setEditor({ open: false, property: null })} />
            <PropertyEditor
              property={editor.property}
              onSave={handleSave}
              onClose={() => setEditor({ open: false, property: null })}
              onDelete={editor.property ? () => handleDelete(editor.property!.id) : undefined}
            />
          </>
        )}
      </AnimatePresence>
    </PermissionGate>
  );
}

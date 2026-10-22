"use client";

import { useCallback, useEffect, useState } from "react";
import { Wrench, CheckCircle2, Clock, Star, Plus, Pencil, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/crm/page-header";
import { PermissionGate } from "@/components/crm/permission-gate";

const ORG_ID = "da62326b-707d-41bd-bc2d-a61a81926dae";

type Vendor = {
  id: string;
  name: string;
  code: string | null;
  type: string;
  status: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  city: string | null;
  state: string | null;
  payment_terms: string | null;
  rating: number | null;
  tax_id: string | null;
  notes: string | null;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#059669", bg: "#ecfdf5" },
  pending: { label: "Pending", color: "#d97706", bg: "#fffbeb" },
  approved: { label: "Approved", color: "#7c3aed", bg: "#f5f3ff" },
  suspended: { label: "Suspended", color: "#dc2626", bg: "#fef2f2" },
  inactive: { label: "Inactive", color: "#6b7280", bg: "#f3f4f6" },
};

const TYPE_LABELS: Record<string, string> = {
  steel_supplier: "Steel Supplier",
  consumables: "Consumables",
  equipment: "Equipment",
  maintenance: "Maintenance",
  logistics: "Logistics",
  professional_services: "Professional Services",
  utilities: "Utilities",
  insurance: "Insurance",
  other: "Other",
};

const PAYMENT_TERMS = [
  { value: "net_15", label: "Net 15" },
  { value: "net_30", label: "Net 30" },
  { value: "net_45", label: "Net 45" },
  { value: "net_60", label: "Net 60" },
  { value: "net_90", label: "Net 90" },
  { value: "cod", label: "COD" },
  { value: "prepaid", label: "Prepaid" },
  { value: "2_10_net_30", label: "2/10 Net 30" },
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

function StatCard({ label, value, icon: Icon, color, delay }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }} className="rounded-lg border bg-card p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}18` }}><Icon className="size-4" style={{ color }} /></div>
      </div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: delay + 0.2 }} className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</motion.p>
    </motion.div>
  );
}

type VendorFormData = {
  name: string;
  code: string;
  type: string;
  status: string;
  notes: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  city: string;
  state: string;
  payment_terms: string;
  rating: string;
  tax_id: string;
};

const EMPTY_FORM: VendorFormData = {
  name: "", code: "", type: "steel_supplier", status: "pending",
  notes: "", contact_name: "", contact_email: "", contact_phone: "",
  city: "", state: "", payment_terms: "net_30", rating: "", tax_id: "",
};

function VendorEditor({ vendor, onSave, onClose, onDelete }: {
  vendor: Vendor | null;
  onSave: (data: VendorFormData) => Promise<void>;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const isEdit = !!vendor;
  const [form, setForm] = useState<VendorFormData>(() => {
    if (!vendor) return EMPTY_FORM;
    return {
      name: vendor.name,
      code: vendor.code || "",
      type: vendor.type,
      status: vendor.status,
      notes: vendor.notes || "",
      contact_name: vendor.contact_name || "",
      contact_email: vendor.contact_email || "",
      contact_phone: vendor.contact_phone || "",
      city: vendor.city || "",
      state: vendor.state || "",
      payment_terms: vendor.payment_terms || "net_30",
      rating: vendor.rating?.toString() || "",
      tax_id: vendor.tax_id || "",
    };
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"basics" | "contact" | "terms">("basics");

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  const set = (key: keyof VendorFormData, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l bg-background shadow-2xl"
    >
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">{isEdit ? "Edit Vendor" : "New Vendor"}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{isEdit ? "Update vendor details and terms" : "Add a new supplier or service provider"}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
      </div>

      <div className="flex gap-1 border-b px-5">
        {(["basics", "contact", "terms"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${tab === t ? "border-[#157070] text-[#157070]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t === "basics" ? "Basics" : t === "contact" ? "Contact" : "Terms"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "basics" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Vendor Name *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. Pacific Steel Supply" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Vendor Code</label>
                <input value={form.code} onChange={(e) => set("code", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. PSS-001" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
                <select value={form.type} onChange={(e) => set("type", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]">
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]">
                {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes</label>
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="Vendor notes, history, special arrangements..." />
            </div>
          </div>
        )}

        {tab === "contact" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Contact Name</label>
              <input value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="Primary contact" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
                <input type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="email@vendor.com" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Phone</label>
                <input value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="(310) 555-0100" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">City</label>
                <input value={form.city} onChange={(e) => set("city", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. Carson" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">State</label>
                <select value={form.state} onChange={(e) => set("state", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]">
                  <option value="">Select state</option>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {tab === "terms" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Payment Terms</label>
              <select value={form.payment_terms} onChange={(e) => set("payment_terms", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]">
                {PAYMENT_TERMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Rating (1-5)</label>
              <input type="number" min="1" max="5" step="0.1" value={form.rating} onChange={(e) => set("rating", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. 4.5" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Tax ID</label>
              <input value={form.tax_id} onChange={(e) => set("tax_id", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="XX-XXXXXXX" />
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
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Vendor"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function VendorsPage() {
  const [items, setItems] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  const [editor, setEditor] = useState<{ open: boolean; vendor: Vendor | null }>({ open: false, vendor: null });

  const loadData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ table: "erp_vendors", org: ORG_ID });
    if (filter !== "all") params.set("status", filter);
    fetch(`/api/erp?${params}`)
      .then((r) => r.json())
      .then((d) => { setItems(d.data || []); setTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (data: VendorFormData) => {
    const payload = {
      table: "erp_vendors",
      org_id: ORG_ID,
      name: data.name,
      code: data.code || null,
      type: data.type,
      status: data.status,
      contact_name: data.contact_name || null,
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
      city: data.city || null,
      state: data.state || null,
      payment_terms: data.payment_terms || null,
      rating: data.rating ? Number(data.rating) : null,
      tax_id: data.tax_id || null,
      notes: data.notes || null,
    };
    if (editor.vendor) {
      await fetch("/api/erp", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: editor.vendor.id }) });
    } else {
      await fetch("/api/erp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setEditor({ open: false, vendor: null });
    loadData();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/erp?table=erp_vendors&id=${id}&org=${ORG_ID}`, { method: "DELETE" });
    setEditor({ open: false, vendor: null });
    loadData();
  };

  const active = items.filter((v) => v.status === "active").length;
  const pending = items.filter((v) => v.status === "pending").length;
  const topRated = items.filter((v) => (v.rating || 0) >= 4).length;

  return (
    <PermissionGate module="vendors">
      <PageHeader title="Vendors" description="Supplier management, contracts, and ratings" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Vendors" value={active} icon={CheckCircle2} color="#059669" delay={0} />
        <StatCard label="Pending Approval" value={pending} icon={Clock} color="#d97706" delay={0.1} />
        <StatCard label="Top Rated (4+)" value={topRated} icon={Star} color="#7c3aed" delay={0.2} />
        <StatCard label="Total Vendors" value={total} icon={Wrench} color="#157070" delay={0.3} />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium">Vendor Directory</h3>
            <div className="flex items-center gap-1">
              {["all", "active", "pending", "suspended", "inactive"].map((s) => (
                <button key={s} type="button" onClick={() => setFilter(s)} className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${filter === s ? "bg-[#157070] text-white" : "text-muted-foreground hover:bg-muted"}`}>
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setEditor({ open: true, vendor: null })} className="flex items-center gap-1.5 rounded-md bg-[#157070] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#126060] transition-colors">
            <Plus className="size-3.5" /> Add Vendor
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="size-6 animate-spin rounded-full border-2 border-[#157070] border-t-transparent" /></div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <Wrench className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No vendors registered</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Vendors will appear as supplier relationships are added</p>
            <button type="button" onClick={() => setEditor({ open: true, vendor: null })} className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#157070] px-4 py-2 text-xs font-medium text-white hover:bg-[#126060]">
              <Plus className="size-3.5" /> Add Vendor
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Code</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Contact</th>
                  <th className="px-4 py-2.5">Location</th>
                  <th className="px-4 py-2.5">Terms</th>
                  <th className="px-4 py-2.5">Rating</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((ven, i) => {
                  const sc = STATUS_CONFIG[ven.status] || { label: ven.status, color: "#6b7280", bg: "#f3f4f6" };
                  const loc = [ven.city, ven.state].filter(Boolean).join(", ");
                  return (
                    <motion.tr key={ven.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }} className="border-b transition-colors last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{ven.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{ven.code || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{TYPE_LABELS[ven.type] || ven.type}</td>
                      <td className="px-4 py-3 text-muted-foreground">{ven.contact_name || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{loc || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{ven.payment_terms || "—"}</td>
                      <td className="px-4 py-3">{ven.rating ? <span className="inline-flex items-center gap-1 text-xs"><Star className="size-3 fill-amber-400 text-amber-400" />{ven.rating}</span> : "—"}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span></td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => setEditor({ open: true, vendor: ven })} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black" onClick={() => setEditor({ open: false, vendor: null })} />
            <VendorEditor
              vendor={editor.vendor}
              onSave={handleSave}
              onClose={() => setEditor({ open: false, vendor: null })}
              onDelete={editor.vendor ? () => handleDelete(editor.vendor!.id) : undefined}
            />
          </>
        )}
      </AnimatePresence>
    </PermissionGate>
  );
}

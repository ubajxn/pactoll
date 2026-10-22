"use client";

import { useCallback, useEffect, useState } from "react";
import { Package, Clock, CheckCircle2, AlertTriangle, Plus, Pencil, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/crm/page-header";
import { PermissionGate } from "@/components/crm/permission-gate";

const ORG_ID = "da62326b-707d-41bd-bc2d-a61a81926dae";

type PurchaseOrder = {
  id: string;
  po_number: string;
  type: string;
  status: string;
  order_date: string | null;
  expected_date: string | null;
  subtotal: number | null;
  tax_amount: number | null;
  total_amount: number | null;
  shipping_cost: number | null;
  terms: string | null;
  notes: string | null;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "#6b7280", bg: "#f3f4f6" },
  submitted: { label: "Submitted", color: "#2563eb", bg: "#eff6ff" },
  approved: { label: "Approved", color: "#7c3aed", bg: "#f5f3ff" },
  ordered: { label: "Ordered", color: "#d97706", bg: "#fffbeb" },
  partial_received: { label: "Partial", color: "#ea580c", bg: "#fff7ed" },
  received: { label: "Received", color: "#059669", bg: "#ecfdf5" },
  invoiced: { label: "Invoiced", color: "#157070", bg: "#e6f3f3" },
  closed: { label: "Closed", color: "#6b7280", bg: "#f9fafb" },
  cancelled: { label: "Cancelled", color: "#9ca3af", bg: "#f9fafb" },
};

const PO_TYPES = [
  { value: "steel_coil", label: "Steel Coil" },
  { value: "consumables", label: "Consumables" },
  { value: "equipment", label: "Equipment" },
  { value: "maintenance", label: "Maintenance" },
  { value: "services", label: "Services" },
  { value: "other", label: "Other" },
];

const TERMS_OPTIONS = [
  { value: "net_30", label: "Net 30" },
  { value: "net_45", label: "Net 45" },
  { value: "net_60", label: "Net 60" },
  { value: "due_on_receipt", label: "Due on Receipt" },
  { value: "cod", label: "COD" },
  { value: "prepaid", label: "Prepaid" },
];

type POFormData = {
  po_number: string;
  type: string;
  status: string;
  order_date: string;
  expected_date: string;
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  shipping_cost: string;
  terms: string;
  notes: string;
};

const EMPTY_FORM: POFormData = {
  po_number: "", type: "steel_coil", status: "draft",
  order_date: "", expected_date: "",
  subtotal: "", tax_amount: "", total_amount: "", shipping_cost: "",
  terms: "net_30", notes: "",
};

function StatCard({ label, value, icon: Icon, color, delay, prefix }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string; delay: number; prefix?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }} className="rounded-lg border bg-card p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}18` }}><Icon className="size-4" style={{ color }} /></div>
      </div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: delay + 0.2 }} className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{prefix}{value}</motion.p>
    </motion.div>
  );
}

function POEditor({ po, onSave, onClose, onDelete }: {
  po: PurchaseOrder | null;
  onSave: (data: POFormData) => Promise<void>;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const isEdit = !!po;
  const [form, setForm] = useState<POFormData>(() => {
    if (!po) return EMPTY_FORM;
    return {
      po_number: po.po_number,
      type: po.type || "steel_coil",
      status: po.status || "draft",
      order_date: po.order_date || "",
      expected_date: po.expected_date || "",
      subtotal: po.subtotal?.toString() || "",
      tax_amount: po.tax_amount?.toString() || "",
      total_amount: po.total_amount?.toString() || "",
      shipping_cost: po.shipping_cost?.toString() || "",
      terms: po.terms || "net_30",
      notes: po.notes || "",
    };
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"basics" | "dates" | "amounts">("basics");

  const handleSave = async () => {
    if (!form.po_number.trim()) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  const set = (key: keyof POFormData, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l bg-background shadow-2xl"
    >
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">{isEdit ? "Edit Purchase Order" : "New Purchase Order"}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{isEdit ? "Update PO details and amounts" : "Create a new procurement order"}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
      </div>
      <div className="flex gap-1 border-b px-5">
        {(["basics", "dates", "amounts"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${tab === t ? "border-[#157070] text-[#157070]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t === "basics" ? "Basics" : t === "dates" ? "Dates" : "Amounts"}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "basics" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">PO Number *</label>
              <input value={form.po_number} onChange={(e) => set("po_number", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. PO-2024-001" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
                <select value={form.type} onChange={(e) => set("type", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]">
                  {PO_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]">
                  {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Terms</label>
              <select value={form.terms} onChange={(e) => set("terms", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]">
                {TERMS_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes</label>
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="Vendor instructions, delivery notes..." />
            </div>
          </div>
        )}
        {tab === "dates" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Order Date</label>
              <input type="date" value={form.order_date} onChange={(e) => set("order_date", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Expected Delivery</label>
              <input type="date" value={form.expected_date} onChange={(e) => set("expected_date", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" />
            </div>
          </div>
        )}
        {tab === "amounts" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Subtotal</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input value={form.subtotal} onChange={(e) => set("subtotal", e.target.value)} className="w-full rounded-md border bg-background py-2 pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Tax</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input value={form.tax_amount} onChange={(e) => set("tax_amount", e.target.value)} className="w-full rounded-md border bg-background py-2 pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="0.00" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Shipping</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input value={form.shipping_cost} onChange={(e) => set("shipping_cost", e.target.value)} className="w-full rounded-md border bg-background py-2 pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Total Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input value={form.total_amount} onChange={(e) => set("total_amount", e.target.value)} className="w-full rounded-md border bg-background py-2 pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="0.00" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t px-5 py-3">
        <div>{isEdit && onDelete && (<button type="button" onClick={onDelete} className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="size-3.5" /> Delete</button>)}</div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onClose} className="rounded-md border px-4 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving || !form.po_number.trim()} className="rounded-md bg-[#157070] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#126060] disabled:opacity-50 transition-colors">
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create PO"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function PurchaseOrdersPage() {
  const [items, setItems] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  const [editor, setEditor] = useState<{ open: boolean; po: PurchaseOrder | null }>({ open: false, po: null });

  const loadData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ table: "erp_purchase_orders", org: ORG_ID });
    if (filter !== "all") params.set("status", filter);
    fetch(`/api/erp?${params}`)
      .then((r) => r.json())
      .then((d) => { setItems(d.data || []); setTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (data: POFormData) => {
    const n = (v: string) => v ? Number(v.replace(/,/g, "")) : null;
    const payload = {
      table: "erp_purchase_orders", org_id: ORG_ID,
      po_number: data.po_number, type: data.type, status: data.status,
      order_date: data.order_date || null, expected_date: data.expected_date || null,
      subtotal: n(data.subtotal), tax_amount: n(data.tax_amount),
      total_amount: n(data.total_amount), shipping_cost: n(data.shipping_cost),
      terms: data.terms || null, notes: data.notes || null,
    };
    if (editor.po) {
      await fetch("/api/erp", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: editor.po.id }) });
    } else {
      await fetch("/api/erp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setEditor({ open: false, po: null });
    loadData();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/erp?table=erp_purchase_orders&id=${id}&org=${ORG_ID}`, { method: "DELETE" });
    setEditor({ open: false, po: null });
    loadData();
  };

  const open = items.filter((p) => ["submitted", "approved", "ordered"].includes(p.status)).length;
  const pendingValue = items.filter((p) => ["submitted", "approved", "ordered", "partial_received"].includes(p.status)).reduce((s, p) => s + (Number(p.total_amount) || 0), 0);
  const received = items.filter((p) => ["received", "invoiced", "closed"].includes(p.status)).length;

  return (
    <PermissionGate module="purchase-orders">
      <PageHeader title="Purchase Orders" description="Procurement, vendor ordering, and receiving" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open POs" value={open} icon={Clock} color="#2563eb" delay={0} />
        <StatCard label="Pending Value" value={pendingValue > 0 ? pendingValue.toLocaleString() : "0"} icon={AlertTriangle} color="#d97706" delay={0.1} prefix="$" />
        <StatCard label="Received" value={received} icon={CheckCircle2} color="#059669" delay={0.2} />
        <StatCard label="Total POs" value={total} icon={Package} color="#157070" delay={0.3} />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium">Purchase Orders</h3>
            <div className="flex items-center gap-1">
              {["all", "draft", "ordered", "partial_received", "received", "closed"].map((s) => (
                <button key={s} type="button" onClick={() => setFilter(s)} className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${filter === s ? "bg-[#157070] text-white" : "text-muted-foreground hover:bg-muted"}`}>
                  {s === "all" ? "All" : s === "partial_received" ? "Partial" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setEditor({ open: true, po: null })} className="flex items-center gap-1.5 rounded-md bg-[#157070] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#126060] transition-colors">
            <Plus className="size-3.5" /> New PO
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="size-6 animate-spin rounded-full border-2 border-[#157070] border-t-transparent" /></div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No purchase orders yet</p>
            <p className="mt-1 text-xs text-muted-foreground/70">POs will appear as procurement orders are created</p>
            <button type="button" onClick={() => setEditor({ open: true, po: null })} className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#157070] px-4 py-2 text-xs font-medium text-white hover:bg-[#126060]">
              <Plus className="size-3.5" /> Create PO
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-2.5">PO #</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Order Date</th>
                  <th className="px-4 py-2.5">Expected</th>
                  <th className="px-4 py-2.5">Terms</th>
                  <th className="px-4 py-2.5 text-right">Subtotal</th>
                  <th className="px-4 py-2.5 text-right">Shipping</th>
                  <th className="px-4 py-2.5 text-right">Total</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((po, i) => {
                  const sc = STATUS_CONFIG[po.status] || { label: po.status, color: "#6b7280", bg: "#f3f4f6" };
                  return (
                    <motion.tr key={po.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }} className="border-b transition-colors last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{po.po_number}</td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{po.type?.replace(/_/g, " ") || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{po.order_date || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{po.expected_date || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{po.terms || "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{po.subtotal ? `$${Number(po.subtotal).toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{po.shipping_cost ? `$${Number(po.shipping_cost).toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">{po.total_amount ? `$${Number(po.total_amount).toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span></td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => setEditor({ open: true, po })} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black" onClick={() => setEditor({ open: false, po: null })} />
            <POEditor
              po={editor.po}
              onSave={handleSave}
              onClose={() => setEditor({ open: false, po: null })}
              onDelete={editor.po ? () => handleDelete(editor.po!.id) : undefined}
            />
          </>
        )}
      </AnimatePresence>
    </PermissionGate>
  );
}

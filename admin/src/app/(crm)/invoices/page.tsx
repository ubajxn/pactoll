"use client";

import { useCallback, useEffect, useState } from "react";
import { Receipt, DollarSign, Clock, CheckCircle2, Plus, Pencil, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/crm/page-header";

const ORG_ID = "da62326b-707d-41bd-bc2d-a61a81926dae";

type Invoice = {
  id: string;
  invoice_number: string;
  type: string;
  status: string;
  invoice_date: string | null;
  due_date: string | null;
  subtotal: number | null;
  tax_amount: number | null;
  total_amount: number | null;
  amount_paid: number | null;
  balance_due: number | null;
  terms: string | null;
  notes: string | null;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "#6b7280", bg: "#f3f4f6" },
  sent: { label: "Sent", color: "#2563eb", bg: "#eff6ff" },
  viewed: { label: "Viewed", color: "#7c3aed", bg: "#f5f3ff" },
  partial: { label: "Partial", color: "#d97706", bg: "#fffbeb" },
  paid: { label: "Paid", color: "#059669", bg: "#ecfdf5" },
  overdue: { label: "Overdue", color: "#dc2626", bg: "#fef2f2" },
  void: { label: "Void", color: "#9ca3af", bg: "#f9fafb" },
  write_off: { label: "Write Off", color: "#9ca3af", bg: "#f9fafb" },
};

const INVOICE_TYPES = [
  { value: "processing", label: "Processing" },
  { value: "storage", label: "Storage" },
  { value: "freight", label: "Freight" },
  { value: "material", label: "Material" },
  { value: "other", label: "Other" },
];

const TERMS_OPTIONS = [
  { value: "net_30", label: "Net 30" },
  { value: "net_45", label: "Net 45" },
  { value: "net_60", label: "Net 60" },
  { value: "due_on_receipt", label: "Due on Receipt" },
  { value: "cod", label: "COD" },
];

type InvoiceFormData = {
  invoice_number: string;
  type: string;
  status: string;
  invoice_date: string;
  due_date: string;
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  amount_paid: string;
  balance_due: string;
  terms: string;
  notes: string;
};

const EMPTY_FORM: InvoiceFormData = {
  invoice_number: "", type: "processing", status: "draft",
  invoice_date: "", due_date: "",
  subtotal: "", tax_amount: "", total_amount: "",
  amount_paid: "", balance_due: "",
  terms: "net_30", notes: "",
};

function StatCard({ label, value, icon: Icon, color, delay, prefix }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; color: string; delay: number; prefix?: string }) {
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

function InvoiceEditor({ invoice, onSave, onClose, onDelete }: {
  invoice: Invoice | null;
  onSave: (data: InvoiceFormData) => Promise<void>;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const isEdit = !!invoice;
  const [form, setForm] = useState<InvoiceFormData>(() => {
    if (!invoice) return EMPTY_FORM;
    return {
      invoice_number: invoice.invoice_number,
      type: invoice.type || "processing",
      status: invoice.status || "draft",
      invoice_date: invoice.invoice_date || "",
      due_date: invoice.due_date || "",
      subtotal: invoice.subtotal?.toString() || "",
      tax_amount: invoice.tax_amount?.toString() || "",
      total_amount: invoice.total_amount?.toString() || "",
      amount_paid: invoice.amount_paid?.toString() || "",
      balance_due: invoice.balance_due?.toString() || "",
      terms: invoice.terms || "net_30",
      notes: invoice.notes || "",
    };
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"basics" | "dates" | "amounts">("basics");

  const handleSave = async () => {
    if (!form.invoice_number.trim()) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  const set = (key: keyof InvoiceFormData, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l bg-background shadow-2xl"
    >
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">{isEdit ? "Edit Invoice" : "New Invoice"}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{isEdit ? "Update invoice details and amounts" : "Create a new customer invoice"}</p>
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
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Invoice Number *</label>
              <input value={form.invoice_number} onChange={(e) => set("invoice_number", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. INV-2024-001" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
                <select value={form.type} onChange={(e) => set("type", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]">
                  {INVOICE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
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
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="Internal notes, special instructions..." />
            </div>
          </div>
        )}
        {tab === "dates" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Invoice Date</label>
              <input type="date" value={form.invoice_date} onChange={(e) => set("invoice_date", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Due Date</label>
              <input type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" />
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
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Total Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input value={form.total_amount} onChange={(e) => set("total_amount", e.target.value)} className="w-full rounded-md border bg-background py-2 pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Amount Paid</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input value={form.amount_paid} onChange={(e) => set("amount_paid", e.target.value)} className="w-full rounded-md border bg-background py-2 pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Balance Due</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input value={form.balance_due} onChange={(e) => set("balance_due", e.target.value)} className="w-full rounded-md border bg-background py-2 pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="0.00" />
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
          <button type="button" onClick={handleSave} disabled={saving || !form.invoice_number.trim()} className="rounded-md bg-[#157070] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#126060] disabled:opacity-50 transition-colors">
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Invoice"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function InvoicesPage() {
  const [items, setItems] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  const [editor, setEditor] = useState<{ open: boolean; invoice: Invoice | null }>({ open: false, invoice: null });

  const loadData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ table: "erp_invoices", org: ORG_ID });
    if (filter !== "all") params.set("status", filter);
    fetch(`/api/erp?${params}`)
      .then((r) => r.json())
      .then((d) => { setItems(d.data || []); setTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (data: InvoiceFormData) => {
    const n = (v: string) => v ? Number(v.replace(/,/g, "")) : null;
    const payload = {
      table: "erp_invoices", org_id: ORG_ID,
      invoice_number: data.invoice_number, type: data.type, status: data.status,
      invoice_date: data.invoice_date || null, due_date: data.due_date || null,
      subtotal: n(data.subtotal), tax_amount: n(data.tax_amount), total_amount: n(data.total_amount),
      amount_paid: n(data.amount_paid), balance_due: n(data.balance_due),
      terms: data.terms || null, notes: data.notes || null,
    };
    if (editor.invoice) {
      await fetch("/api/erp", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: editor.invoice.id }) });
    } else {
      await fetch("/api/erp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setEditor({ open: false, invoice: null });
    loadData();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/erp?table=erp_invoices&id=${id}&org=${ORG_ID}`, { method: "DELETE" });
    setEditor({ open: false, invoice: null });
    loadData();
  };

  const outstanding = items.filter((i) => ["sent", "viewed", "partial"].includes(i.status)).reduce((s, i) => s + (Number(i.balance_due) || 0), 0);
  const overdue = items.filter((i) => i.status === "overdue").length;
  const paid = items.filter((i) => i.status === "paid").reduce((s, i) => s + (Number(i.total_amount) || 0), 0);

  return (
    <>
      <PageHeader title="Invoices" description="Customer billing, AR tracking, and payment status" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Outstanding" value={outstanding > 0 ? outstanding.toLocaleString() : "0"} icon={Clock} color="#d97706" delay={0} prefix="$" />
        <StatCard label="Overdue" value={overdue} icon={Receipt} color="#dc2626" delay={0.1} />
        <StatCard label="Collected" value={paid > 0 ? paid.toLocaleString() : "0"} icon={DollarSign} color="#059669" delay={0.2} prefix="$" />
        <StatCard label="Total Invoices" value={total} icon={Receipt} color="#157070" delay={0.3} />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium">Invoice Ledger</h3>
            <div className="flex items-center gap-1">
              {["all", "draft", "sent", "partial", "paid", "overdue"].map((s) => (
                <button key={s} type="button" onClick={() => setFilter(s)} className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${filter === s ? "bg-[#157070] text-white" : "text-muted-foreground hover:bg-muted"}`}>
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setEditor({ open: true, invoice: null })} className="flex items-center gap-1.5 rounded-md bg-[#157070] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#126060] transition-colors">
            <Plus className="size-3.5" /> New Invoice
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="size-6 animate-spin rounded-full border-2 border-[#157070] border-t-transparent" /></div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <Receipt className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No invoices yet</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Invoices will appear as billing is generated</p>
            <button type="button" onClick={() => setEditor({ open: true, invoice: null })} className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#157070] px-4 py-2 text-xs font-medium text-white hover:bg-[#126060]">
              <Plus className="size-3.5" /> Create Invoice
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-2.5">Invoice #</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Due</th>
                  <th className="px-4 py-2.5">Terms</th>
                  <th className="px-4 py-2.5 text-right">Total</th>
                  <th className="px-4 py-2.5 text-right">Paid</th>
                  <th className="px-4 py-2.5 text-right">Balance</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((inv, i) => {
                  const sc = STATUS_CONFIG[inv.status] || { label: inv.status, color: "#6b7280", bg: "#f3f4f6" };
                  return (
                    <motion.tr key={inv.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }} className="border-b transition-colors last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{inv.invoice_number}</td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{inv.type?.replace(/_/g, " ") || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{inv.invoice_date || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{inv.due_date || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{inv.terms || "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{inv.total_amount ? `$${Number(inv.total_amount).toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{inv.amount_paid ? `$${Number(inv.amount_paid).toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">{inv.balance_due ? `$${Number(inv.balance_due).toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span></td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => setEditor({ open: true, invoice: inv })} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black" onClick={() => setEditor({ open: false, invoice: null })} />
            <InvoiceEditor
              invoice={editor.invoice}
              onSave={handleSave}
              onClose={() => setEditor({ open: false, invoice: null })}
              onDelete={editor.invoice ? () => handleDelete(editor.invoice!.id) : undefined}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

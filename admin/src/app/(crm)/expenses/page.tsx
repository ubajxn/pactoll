"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, Clock, CheckCircle2, DollarSign, Plus, Pencil, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/crm/page-header";

const ORG_ID = "da62326b-707d-41bd-bc2d-a61a81926dae";

type Expense = {
  id: string;
  expense_number: string;
  category: string;
  status: string;
  expense_date: string | null;
  description: string | null;
  amount: number | null;
  tax_amount: number | null;
  total_amount: number | null;
  payment_method: string | null;
  receipt_on_file: boolean;
  notes: string | null;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "#6b7280", bg: "#f3f4f6" },
  submitted: { label: "Submitted", color: "#2563eb", bg: "#eff6ff" },
  approved: { label: "Approved", color: "#7c3aed", bg: "#f5f3ff" },
  reimbursed: { label: "Reimbursed", color: "#059669", bg: "#ecfdf5" },
  paid: { label: "Paid", color: "#059669", bg: "#ecfdf5" },
  rejected: { label: "Rejected", color: "#dc2626", bg: "#fef2f2" },
  void: { label: "Void", color: "#9ca3af", bg: "#f9fafb" },
};

const CATEGORY_LABELS: Record<string, string> = {
  materials: "Materials",
  consumables: "Consumables",
  equipment: "Equipment",
  maintenance: "Maintenance",
  utilities: "Utilities",
  fuel: "Fuel",
  office: "Office",
  travel: "Travel",
  insurance: "Insurance",
  rent: "Rent",
  payroll: "Payroll",
  professional_services: "Prof. Services",
  other: "Other",
};

const PAYMENT_METHODS = [
  { value: "check", label: "Check" },
  { value: "ach", label: "ACH" },
  { value: "wire", label: "Wire" },
  { value: "credit_card", label: "Credit Card" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
];

type ExpenseFormData = {
  expense_number: string;
  category: string;
  status: string;
  expense_date: string;
  description: string;
  amount: string;
  tax_amount: string;
  total_amount: string;
  payment_method: string;
  receipt_on_file: boolean;
  notes: string;
};

const EMPTY_FORM: ExpenseFormData = {
  expense_number: "", category: "materials", status: "draft",
  expense_date: "", description: "",
  amount: "", tax_amount: "", total_amount: "",
  payment_method: "check", receipt_on_file: false, notes: "",
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

function ExpenseEditor({ expense, onSave, onClose, onDelete }: {
  expense: Expense | null;
  onSave: (data: ExpenseFormData) => Promise<void>;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const isEdit = !!expense;
  const [form, setForm] = useState<ExpenseFormData>(() => {
    if (!expense) return EMPTY_FORM;
    return {
      expense_number: expense.expense_number,
      category: expense.category || "materials",
      status: expense.status || "draft",
      expense_date: expense.expense_date || "",
      description: expense.description || "",
      amount: expense.amount?.toString() || "",
      tax_amount: expense.tax_amount?.toString() || "",
      total_amount: expense.total_amount?.toString() || "",
      payment_method: expense.payment_method || "check",
      receipt_on_file: expense.receipt_on_file,
      notes: expense.notes || "",
    };
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"basics" | "details">("basics");

  const handleSave = async () => {
    if (!form.expense_number.trim()) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  const set = (key: keyof ExpenseFormData, val: unknown) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l bg-background shadow-2xl"
    >
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">{isEdit ? "Edit Expense" : "New Expense"}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{isEdit ? "Update expense details" : "Log a new operating expense"}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
      </div>
      <div className="flex gap-1 border-b px-5">
        {(["basics", "details"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${tab === t ? "border-[#157070] text-[#157070]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t === "basics" ? "Basics" : "Details"}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "basics" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Expense Number *</label>
              <input value={form.expense_number} onChange={(e) => set("expense_number", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. EXP-2024-001" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Category</label>
                <select value={form.category} onChange={(e) => set("category", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]">
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
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
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="What was purchased..." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input value={form.amount} onChange={(e) => set("amount", e.target.value)} className="w-full rounded-md border bg-background py-2 pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Tax</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input value={form.tax_amount} onChange={(e) => set("tax_amount", e.target.value)} className="w-full rounded-md border bg-background py-2 pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Total</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input value={form.total_amount} onChange={(e) => set("total_amount", e.target.value)} className="w-full rounded-md border bg-background py-2 pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="0.00" />
                </div>
              </div>
            </div>
          </div>
        )}
        {tab === "details" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Expense Date</label>
              <input type="date" value={form.expense_date} onChange={(e) => set("expense_date", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Payment Method</label>
              <select value={form.payment_method} onChange={(e) => set("payment_method", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]">
                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.receipt_on_file} onChange={(e) => set("receipt_on_file", e.target.checked)} className="rounded border-gray-300" />
                <span className="text-muted-foreground">Receipt on file</span>
              </label>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes</label>
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="Additional details, vendor info..." />
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t px-5 py-3">
        <div>{isEdit && onDelete && (<button type="button" onClick={onDelete} className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="size-3.5" /> Delete</button>)}</div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onClose} className="rounded-md border px-4 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving || !form.expense_number.trim()} className="rounded-md bg-[#157070] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#126060] disabled:opacity-50 transition-colors">
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Expense"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ExpensesPage() {
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  const [editor, setEditor] = useState<{ open: boolean; expense: Expense | null }>({ open: false, expense: null });

  const loadData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ table: "erp_expenses", org: ORG_ID });
    if (filter !== "all") params.set("status", filter);
    fetch(`/api/erp?${params}`)
      .then((r) => r.json())
      .then((d) => { setItems(d.data || []); setTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (data: ExpenseFormData) => {
    const n = (v: string) => v ? Number(v.replace(/,/g, "")) : null;
    const payload = {
      table: "erp_expenses", org_id: ORG_ID,
      expense_number: data.expense_number, category: data.category, status: data.status,
      expense_date: data.expense_date || null, description: data.description || null,
      amount: n(data.amount), tax_amount: n(data.tax_amount), total_amount: n(data.total_amount),
      payment_method: data.payment_method || null,
      receipt_on_file: data.receipt_on_file,
      notes: data.notes || null,
    };
    if (editor.expense) {
      await fetch("/api/erp", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: editor.expense.id }) });
    } else {
      await fetch("/api/erp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setEditor({ open: false, expense: null });
    loadData();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/erp?table=erp_expenses&id=${id}&org=${ORG_ID}`, { method: "DELETE" });
    setEditor({ open: false, expense: null });
    loadData();
  };

  const pending = items.filter((e) => ["submitted", "approved"].includes(e.status)).reduce((s, e) => s + (Number(e.total_amount) || 0), 0);
  const thisMonth = items.filter((e) => e.status === "paid" || e.status === "reimbursed").reduce((s, e) => s + (Number(e.total_amount) || 0), 0);
  const needsReceipt = items.filter((e) => !e.receipt_on_file && e.status !== "void" && e.status !== "rejected").length;

  return (
    <>
      <PageHeader title="Expenses" description="Operating costs, receipts, and reimbursements" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pending Approval" value={pending > 0 ? pending.toLocaleString() : "0"} icon={Clock} color="#d97706" delay={0} prefix="$" />
        <StatCard label="Total Paid" value={thisMonth > 0 ? thisMonth.toLocaleString() : "0"} icon={DollarSign} color="#059669" delay={0.1} prefix="$" />
        <StatCard label="Missing Receipts" value={needsReceipt} icon={CreditCard} color="#dc2626" delay={0.2} />
        <StatCard label="Total Expenses" value={total} icon={CreditCard} color="#157070" delay={0.3} />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium">Expense Log</h3>
            <div className="flex items-center gap-1">
              {["all", "submitted", "approved", "paid", "rejected"].map((s) => (
                <button key={s} type="button" onClick={() => setFilter(s)} className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${filter === s ? "bg-[#157070] text-white" : "text-muted-foreground hover:bg-muted"}`}>
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setEditor({ open: true, expense: null })} className="flex items-center gap-1.5 rounded-md bg-[#157070] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#126060] transition-colors">
            <Plus className="size-3.5" /> New Expense
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="size-6 animate-spin rounded-full border-2 border-[#157070] border-t-transparent" /></div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <CreditCard className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No expenses recorded</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Expenses will appear as costs are logged</p>
            <button type="button" onClick={() => setEditor({ open: true, expense: null })} className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#157070] px-4 py-2 text-xs font-medium text-white hover:bg-[#126060]">
              <Plus className="size-3.5" /> Log Expense
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-2.5">Expense #</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Description</th>
                  <th className="px-4 py-2.5">Payment</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                  <th className="px-4 py-2.5">Receipt</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((exp, i) => {
                  const sc = STATUS_CONFIG[exp.status] || { label: exp.status, color: "#6b7280", bg: "#f3f4f6" };
                  return (
                    <motion.tr key={exp.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }} className="border-b transition-colors last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{exp.expense_number}</td>
                      <td className="px-4 py-3 text-muted-foreground">{CATEGORY_LABELS[exp.category] || exp.category}</td>
                      <td className="px-4 py-3 text-muted-foreground">{exp.expense_date || "—"}</td>
                      <td className="px-4 py-3 max-w-[200px] truncate text-muted-foreground">{exp.description || "—"}</td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{exp.payment_method?.replace(/_/g, " ") || "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">{exp.total_amount ? `$${Number(exp.total_amount).toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3">{exp.receipt_on_file ? <span className="text-xs text-emerald-600">On file</span> : <span className="text-xs text-red-500">Missing</span>}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span></td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => setEditor({ open: true, expense: exp })} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black" onClick={() => setEditor({ open: false, expense: null })} />
            <ExpenseEditor
              expense={editor.expense}
              onSave={handleSave}
              onClose={() => setEditor({ open: false, expense: null })}
              onDelete={editor.expense ? () => handleDelete(editor.expense!.id) : undefined}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

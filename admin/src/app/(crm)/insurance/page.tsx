"use client";

import { useCallback, useEffect, useState } from "react";
import { Shield, AlertTriangle, CheckCircle2, DollarSign, Plus, Pencil, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/crm/page-header";
import { PermissionGate } from "@/components/crm/permission-gate";

const ORG_ID = "da62326b-707d-41bd-bc2d-a61a81926dae";

type InsurancePolicy = {
  id: string;
  policy_number: string;
  type: string;
  status: string;
  carrier: string | null;
  effective_date: string | null;
  expiration_date: string | null;
  premium_annual: number | null;
  deductible: number | null;
  coverage_limit: number | null;
  agent_name: string | null;
  agent_phone: string | null;
  notes: string | null;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#059669", bg: "#ecfdf5" },
  pending: { label: "Pending", color: "#d97706", bg: "#fffbeb" },
  expired: { label: "Expired", color: "#dc2626", bg: "#fef2f2" },
  cancelled: { label: "Cancelled", color: "#9ca3af", bg: "#f9fafb" },
  renewal_pending: { label: "Renewal", color: "#7c3aed", bg: "#f5f3ff" },
};

const TYPE_LABELS: Record<string, string> = {
  general_liability: "General Liability",
  cargo: "Cargo",
  property: "Property",
  workers_comp: "Workers' Comp",
  auto: "Auto",
  umbrella: "Umbrella",
  professional_liability: "Professional Liability",
  cyber: "Cyber",
  equipment: "Equipment",
};

const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));
const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }));

type PolicyFormData = {
  policy_number: string;
  type: string;
  status: string;
  carrier: string;
  effective_date: string;
  expiration_date: string;
  premium_annual: string;
  deductible: string;
  coverage_limit: string;
  agent_name: string;
  agent_phone: string;
  notes: string;
};

const EMPTY_FORM: PolicyFormData = {
  policy_number: "", type: "general_liability", status: "active",
  carrier: "", effective_date: "", expiration_date: "",
  premium_annual: "", deductible: "", coverage_limit: "",
  agent_name: "", agent_phone: "", notes: "",
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

function PolicyEditor({ policy, onSave, onClose, onDelete }: {
  policy: InsurancePolicy | null;
  onSave: (data: PolicyFormData) => Promise<void>;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const isEdit = !!policy;
  const [form, setForm] = useState<PolicyFormData>(() => {
    if (!policy) return EMPTY_FORM;
    return {
      policy_number: policy.policy_number,
      type: policy.type,
      status: policy.status,
      carrier: policy.carrier || "",
      effective_date: policy.effective_date || "",
      expiration_date: policy.expiration_date || "",
      premium_annual: policy.premium_annual?.toString() || "",
      deductible: policy.deductible?.toString() || "",
      coverage_limit: policy.coverage_limit?.toString() || "",
      agent_name: policy.agent_name || "",
      agent_phone: policy.agent_phone || "",
      notes: policy.notes || "",
    };
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"basics" | "coverage" | "agent">("basics");

  const handleSave = async () => {
    if (!form.policy_number.trim()) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  const set = (key: keyof PolicyFormData, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l bg-background shadow-2xl"
    >
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">{isEdit ? "Edit Policy" : "New Policy"}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{isEdit ? "Update policy details and coverage" : "Add a new insurance policy"}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
      </div>

      <div className="flex gap-1 border-b px-5">
        {(["basics", "coverage", "agent"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${tab === t ? "border-[#157070] text-[#157070]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t === "basics" ? "Basics" : t === "coverage" ? "Coverage & Dates" : "Agent & Notes"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "basics" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Policy Number *</label>
              <input value={form.policy_number} onChange={(e) => set("policy_number", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. GL-2024-001" />
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
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Carrier</label>
              <input value={form.carrier} onChange={(e) => set("carrier", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. Hartford, Zurich" />
            </div>
          </div>
        )}

        {tab === "coverage" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Annual Premium</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input value={form.premium_annual} onChange={(e) => set("premium_annual", e.target.value)} className="w-full rounded-md border bg-background py-2 pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="12,000" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Deductible</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input value={form.deductible} onChange={(e) => set("deductible", e.target.value)} className="w-full rounded-md border bg-background py-2 pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="5,000" />
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Coverage Limit</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input value={form.coverage_limit} onChange={(e) => set("coverage_limit", e.target.value)} className="w-full rounded-md border bg-background py-2 pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="1,000,000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Effective Date</label>
                <input type="date" value={form.effective_date} onChange={(e) => set("effective_date", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Expiration Date</label>
                <input type="date" value={form.expiration_date} onChange={(e) => set("expiration_date", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" />
              </div>
            </div>
          </div>
        )}

        {tab === "agent" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Agent Name</label>
              <input value={form.agent_name} onChange={(e) => set("agent_name", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="Agent or broker name" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Agent Phone</label>
              <input value={form.agent_phone} onChange={(e) => set("agent_phone", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="(310) 555-0100" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes</label>
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={4} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="Coverage details, exclusions, renewal notes..." />
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
          <button type="button" onClick={handleSave} disabled={saving || !form.policy_number.trim()} className="rounded-md bg-[#157070] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#126060] disabled:opacity-50 transition-colors">
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Policy"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function InsurancePage() {
  const [items, setItems] = useState<InsurancePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  const [editor, setEditor] = useState<{ open: boolean; policy: InsurancePolicy | null }>({ open: false, policy: null });

  const loadData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ table: "erp_insurance_policies", org: ORG_ID });
    if (filter !== "all") params.set("status", filter);
    fetch(`/api/erp?${params}`)
      .then((r) => r.json())
      .then((d) => { setItems(d.data || []); setTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (data: PolicyFormData) => {
    const payload = {
      table: "erp_insurance_policies",
      org_id: ORG_ID,
      policy_number: data.policy_number,
      type: data.type,
      status: data.status,
      carrier: data.carrier || null,
      effective_date: data.effective_date || null,
      expiration_date: data.expiration_date || null,
      premium_annual: data.premium_annual ? Number(data.premium_annual.replace(/,/g, "")) : null,
      deductible: data.deductible ? Number(data.deductible.replace(/,/g, "")) : null,
      coverage_limit: data.coverage_limit ? Number(data.coverage_limit.replace(/,/g, "")) : null,
      agent_name: data.agent_name || null,
      agent_phone: data.agent_phone || null,
      notes: data.notes || null,
    };

    if (editor.policy) {
      await fetch("/api/erp", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: editor.policy.id }) });
    } else {
      await fetch("/api/erp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setEditor({ open: false, policy: null });
    loadData();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/erp?table=erp_insurance_policies&id=${id}&org=${ORG_ID}`, { method: "DELETE" });
    setEditor({ open: false, policy: null });
    loadData();
  };

  const active = items.filter((p) => p.status === "active").length;
  const expiring = items.filter((p) => p.status === "renewal_pending" || p.status === "expired").length;
  const annualPremiums = items.filter((p) => p.status === "active").reduce((s, p) => s + (Number(p.premium_annual) || 0), 0);

  return (
    <PermissionGate module="insurance">
      <PageHeader title="Insurance" description="Policies, coverage, claims, and COI tracking" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Policies" value={active} icon={CheckCircle2} color="#059669" delay={0} />
        <StatCard label="Needs Attention" value={expiring} icon={AlertTriangle} color="#dc2626" delay={0.1} />
        <StatCard label="Annual Premiums" value={annualPremiums > 0 ? annualPremiums.toLocaleString() : "0"} icon={DollarSign} color="#d97706" delay={0.2} prefix="$" />
        <StatCard label="Total Policies" value={total} icon={Shield} color="#157070" delay={0.3} />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium">Insurance Policies</h3>
            <div className="flex items-center gap-1">
              {["all", "active", "pending", "renewal_pending", "expired"].map((s) => (
                <button key={s} type="button" onClick={() => setFilter(s)} className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${filter === s ? "bg-[#157070] text-white" : "text-muted-foreground hover:bg-muted"}`}>
                  {s === "all" ? "All" : s === "renewal_pending" ? "Renewal" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setEditor({ open: true, policy: null })} className="flex items-center gap-1.5 rounded-md bg-[#157070] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#126060] transition-colors">
            <Plus className="size-3.5" /> Add Policy
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="size-6 animate-spin rounded-full border-2 border-[#157070] border-t-transparent" /></div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <Shield className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No insurance policies</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Policies will appear as coverage is added</p>
            <button type="button" onClick={() => setEditor({ open: true, policy: null })} className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#157070] px-4 py-2 text-xs font-medium text-white hover:bg-[#126060]">
              <Plus className="size-3.5" /> Add Policy
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-2.5">Policy #</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Carrier</th>
                  <th className="px-4 py-2.5">Effective</th>
                  <th className="px-4 py-2.5">Expires</th>
                  <th className="px-4 py-2.5 text-right">Premium</th>
                  <th className="px-4 py-2.5 text-right">Deductible</th>
                  <th className="px-4 py-2.5 text-right">Coverage</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((pol, i) => {
                  const sc = STATUS_CONFIG[pol.status] || { label: pol.status, color: "#6b7280", bg: "#f3f4f6" };
                  return (
                    <motion.tr key={pol.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }} className="border-b transition-colors last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{pol.policy_number}</td>
                      <td className="px-4 py-3 text-muted-foreground">{TYPE_LABELS[pol.type] || pol.type}</td>
                      <td className="px-4 py-3 text-muted-foreground">{pol.carrier || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{pol.effective_date || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{pol.expiration_date || "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{pol.premium_annual ? `$${Number(pol.premium_annual).toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{pol.deductible ? `$${Number(pol.deductible).toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{pol.coverage_limit ? `$${Number(pol.coverage_limit).toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span></td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => setEditor({ open: true, policy: pol })} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black" onClick={() => setEditor({ open: false, policy: null })} />
            <PolicyEditor
              policy={editor.policy}
              onSave={handleSave}
              onClose={() => setEditor({ open: false, policy: null })}
              onDelete={editor.policy ? () => handleDelete(editor.policy!.id) : undefined}
            />
          </>
        )}
      </AnimatePresence>
    </PermissionGate>
  );
}

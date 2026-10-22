"use client";

import { useCallback, useEffect, useState } from "react";
import { Megaphone, TrendingUp, DollarSign, Users, Plus, Pencil, Trash2, X, ChevronDown, ChevronUp, Target, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/crm/page-header";
import { PermissionGate } from "@/components/crm/permission-gate";

const ORG_ID = "da62326b-707d-41bd-bc2d-a61a81926dae";

type Campaign = {
  id: string;
  name: string;
  type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  actual_spend: number | null;
  target_accounts: number | null;
  accounts_contacted: number | null;
  leads_generated: number | null;
  opportunities_created: number | null;
  deals_closed: number | null;
  revenue_generated: number | null;
  description: string | null;
  notes: string | null;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#059669", bg: "#ecfdf5" },
  planned: { label: "Planned", color: "#2563eb", bg: "#eff6ff" },
  paused: { label: "Paused", color: "#d97706", bg: "#fffbeb" },
  completed: { label: "Completed", color: "#71717a", bg: "#f4f4f5" },
  cancelled: { label: "Cancelled", color: "#dc2626", bg: "#fef2f2" },
};

const TYPE_LABELS: Record<string, string> = {
  outbound: "Outbound",
  trade_show: "Trade Show",
  referral: "Referral",
  digital: "Digital",
  direct_mail: "Direct Mail",
  cold_call: "Cold Call",
  partnership: "Partnership",
  other: "Other",
};

function StatCard({ label, value, icon: Icon, color, delay, prefix }: { label: string; value: number | string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string; delay: number; prefix?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }} className="rounded-lg border bg-card p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}18` }}>
          <Icon className="size-4" style={{ color }} />
        </div>
      </div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: delay + 0.2 }} className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{prefix}{value}</motion.p>
    </motion.div>
  );
}

type CampaignFormData = {
  name: string;
  type: string;
  status: string;
  description: string;
  notes: string;
  start_date: string;
  end_date: string;
  budget: string;
  actual_spend: string;
  target_accounts: string;
  accounts_contacted: string;
  leads_generated: string;
  opportunities_created: string;
  deals_closed: string;
  revenue_generated: string;
};

const EMPTY_FORM: CampaignFormData = {
  name: "", type: "digital", status: "planned", description: "", notes: "",
  start_date: "", end_date: "", budget: "", actual_spend: "", target_accounts: "",
  accounts_contacted: "", leads_generated: "", opportunities_created: "",
  deals_closed: "", revenue_generated: "",
};

function CampaignEditor({ campaign, onSave, onClose, onDelete }: {
  campaign: Campaign | null;
  onSave: (data: CampaignFormData) => Promise<void>;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const isEdit = !!campaign;
  const [form, setForm] = useState<CampaignFormData>(() => {
    if (!campaign) return EMPTY_FORM;
    return {
      name: campaign.name,
      type: campaign.type || "digital",
      status: campaign.status,
      description: campaign.description || "",
      notes: campaign.notes || "",
      start_date: campaign.start_date || "",
      end_date: campaign.end_date || "",
      budget: campaign.budget != null ? Number(campaign.budget).toString() : "",
      actual_spend: campaign.actual_spend != null ? Number(campaign.actual_spend).toString() : "",
      target_accounts: campaign.target_accounts != null ? campaign.target_accounts.toString() : "",
      accounts_contacted: campaign.accounts_contacted != null ? campaign.accounts_contacted.toString() : "",
      leads_generated: campaign.leads_generated != null ? campaign.leads_generated.toString() : "",
      opportunities_created: campaign.opportunities_created != null ? campaign.opportunities_created.toString() : "",
      deals_closed: campaign.deals_closed != null ? campaign.deals_closed.toString() : "",
      revenue_generated: campaign.revenue_generated != null ? Number(campaign.revenue_generated).toString() : "",
    };
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"basics" | "schedule" | "performance">("basics");

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  const set = (key: keyof CampaignFormData, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const inputClass = "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]";

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l bg-background shadow-2xl"
    >
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">{isEdit ? "Edit Campaign" : "New Campaign"}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{isEdit ? "Update campaign details and performance" : "Launch a new marketing campaign"}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
      </div>

      <div className="flex gap-1 border-b px-5">
        {(["basics", "schedule", "performance"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${tab === t ? "border-[#157070] text-[#157070]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t === "basics" ? "Basics" : t === "schedule" ? "Schedule & Budget" : "Performance"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "basics" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Campaign Name *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} placeholder="e.g. LinkedIn Ads — Automotive" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
                <select value={form.type} onChange={(e) => set("type", e.target.value)} className={inputClass}>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputClass}>
                  {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className={inputClass} placeholder="Campaign goals, target audience, channels..." />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes</label>
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className={inputClass} placeholder="Internal notes..." />
            </div>
          </div>
        )}

        {tab === "schedule" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Start Date</label>
                <input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">End Date</label>
                <input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Budget</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input value={form.budget} onChange={(e) => set("budget", e.target.value)} className={`${inputClass} pl-7`} placeholder="0" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Actual Spend</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input value={form.actual_spend} onChange={(e) => set("actual_spend", e.target.value)} className={`${inputClass} pl-7`} placeholder="0" />
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Target Accounts</label>
              <input value={form.target_accounts} onChange={(e) => set("target_accounts", e.target.value)} className={inputClass} placeholder="0" />
            </div>
          </div>
        )}

        {tab === "performance" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Accounts Contacted</label>
                <input value={form.accounts_contacted} onChange={(e) => set("accounts_contacted", e.target.value)} className={inputClass} placeholder="0" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Leads Generated</label>
                <input value={form.leads_generated} onChange={(e) => set("leads_generated", e.target.value)} className={inputClass} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Opportunities Created</label>
                <input value={form.opportunities_created} onChange={(e) => set("opportunities_created", e.target.value)} className={inputClass} placeholder="0" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Deals Closed</label>
                <input value={form.deals_closed} onChange={(e) => set("deals_closed", e.target.value)} className={inputClass} placeholder="0" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Revenue Generated</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input value={form.revenue_generated} onChange={(e) => set("revenue_generated", e.target.value)} className={`${inputClass} pl-7`} placeholder="0" />
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
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Launch Campaign"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function formatMoney(v: number | null | undefined): string {
  if (v == null) return "$0";
  const n = Number(v);
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return `$${n.toLocaleString()}`;
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function CampaignsPage() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ open: boolean; campaign: Campaign | null }>({ open: false, campaign: null });

  const loadData = useCallback(() => {
    setLoading(true);
    fetch(`/api/erp?table=erp_campaigns&org=${ORG_ID}`)
      .then((r) => r.json())
      .then((d) => setItems(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (data: CampaignFormData) => {
    const payload: Record<string, unknown> = {
      table: "erp_campaigns",
      org_id: ORG_ID,
      name: data.name,
      type: data.type,
      status: data.status,
      description: data.description || null,
      notes: data.notes || null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      budget: data.budget ? Number(data.budget) : null,
      actual_spend: data.actual_spend ? Number(data.actual_spend) : null,
      target_accounts: data.target_accounts ? Number(data.target_accounts) : null,
      accounts_contacted: data.accounts_contacted ? Number(data.accounts_contacted) : null,
      leads_generated: data.leads_generated ? Number(data.leads_generated) : null,
      opportunities_created: data.opportunities_created ? Number(data.opportunities_created) : null,
      deals_closed: data.deals_closed ? Number(data.deals_closed) : null,
      revenue_generated: data.revenue_generated ? Number(data.revenue_generated) : null,
    };
    if (editor.campaign) {
      await fetch("/api/erp", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: editor.campaign.id }) });
    } else {
      await fetch("/api/erp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setEditor({ open: false, campaign: null });
    loadData();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/erp?table=erp_campaigns&id=${id}&org=${ORG_ID}`, { method: "DELETE" });
    setEditor({ open: false, campaign: null });
    loadData();
  };

  const filtered = filter === "all" ? items : items.filter((c) => c.status === filter);
  const active = items.filter((c) => c.status === "active").length;
  const totalBudget = items.reduce((s, c) => s + Number(c.budget || 0), 0);
  const totalLeads = items.reduce((s, c) => s + Number(c.leads_generated || 0), 0);

  return (
    <PermissionGate module="campaigns">
      <PageHeader title="Campaigns" description="Marketing campaigns, performance tracking, and ROI analysis" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Campaigns" value={items.length} icon={Megaphone} color="#157070" delay={0} />
        <StatCard label="Active" value={active} icon={TrendingUp} color="#059669" delay={0.1} />
        <StatCard label="Total Budget" value={formatMoney(totalBudget)} icon={DollarSign} color="#2563eb" delay={0.2} />
        <StatCard label="Leads Generated" value={totalLeads.toLocaleString()} icon={Users} color="#d97706" delay={0.3} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium">Campaign Registry</h3>
            <div className="flex items-center gap-1">
              {["all", "active", "planned", "paused", "completed"].map((s) => (
                <button key={s} type="button" onClick={() => setFilter(s)} className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${filter === s ? "bg-[#157070] text-white" : "text-muted-foreground hover:bg-muted"}`}>
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setEditor({ open: true, campaign: null })} className="flex items-center gap-1.5 rounded-md bg-[#157070] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#126060] transition-colors">
            <Plus className="size-3.5" /> Add Campaign
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="size-6 animate-spin rounded-full border-2 border-[#157070] border-t-transparent" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Megaphone className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No campaigns found</p>
            <button type="button" onClick={() => setEditor({ open: true, campaign: null })} className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#157070] px-4 py-2 text-xs font-medium text-white hover:bg-[#126060]">
              <Plus className="size-3.5" /> Launch Campaign
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((c, i) => {
              const sc = STATUS_CONFIG[c.status] || { label: c.status, color: "#6b7280", bg: "#f3f4f6" };
              const budget = Number(c.budget || 0);
              const spend = Number(c.actual_spend || 0);
              const leads = Number(c.leads_generated || 0);
              const opps = Number(c.opportunities_created || 0);
              const cpl = leads > 0 && spend > 0 ? spend / leads : 0;
              const convRate = leads > 0 && opps > 0 ? ((opps / leads) * 100) : 0;
              const budgetPct = budget > 0 ? Math.min((spend / budget) * 100, 100) : 0;
              const isOpen = expanded === c.id;

              return (
                <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }}>
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                    <button type="button" onClick={() => setExpanded(isOpen ? null : c.id)} className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted">
                      {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{c.name}</span>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{TYPE_LABELS[c.type] || c.type}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatDate(c.start_date)} — {formatDate(c.end_date)}</span>
                        <span className="tabular-nums">{formatMoney(budget)} budget</span>
                        {spend > 0 && <span className="tabular-nums">{formatMoney(spend)} spent</span>}
                        {leads > 0 && <span className="tabular-nums">{leads} leads</span>}
                        {opps > 0 && <span className="tabular-nums">{opps} opps</span>}
                      </div>
                    </div>
                    <button type="button" onClick={() => setEditor({ open: true, campaign: c })} className="shrink-0 rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                      <Pencil className="size-3.5" />
                    </button>
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="grid grid-cols-2 gap-4 bg-muted/30 px-12 py-4 lg:grid-cols-4">
                          <div className="rounded-lg border bg-card p-3">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Budget Used</p>
                            <p className="mt-1 text-lg font-semibold tabular-nums">{budgetPct.toFixed(0)}%</p>
                            <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-[#157070] transition-all" style={{ width: `${budgetPct}%` }} />
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground tabular-nums">{formatMoney(spend)} / {formatMoney(budget)}</p>
                          </div>
                          <div className="rounded-lg border bg-card p-3">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cost Per Lead</p>
                            <p className="mt-1 text-lg font-semibold tabular-nums">{cpl > 0 ? `$${cpl.toFixed(0)}` : "—"}</p>
                          </div>
                          <div className="rounded-lg border bg-card p-3">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Conversion Rate</p>
                            <p className="mt-1 text-lg font-semibold tabular-nums">{convRate > 0 ? `${convRate.toFixed(1)}%` : "—"}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Lead → Opportunity</p>
                          </div>
                          <div className="rounded-lg border bg-card p-3">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Accounts</p>
                            <p className="mt-1 text-lg font-semibold tabular-nums">{Number(c.accounts_contacted || 0).toLocaleString()}</p>
                            <p className="mt-1 text-xs text-muted-foreground">of {Number(c.target_accounts || 0).toLocaleString()} target</p>
                          </div>
                        </div>
                        {c.description && (
                          <div className="px-12 pb-4">
                            <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {editor.open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black" onClick={() => setEditor({ open: false, campaign: null })} />
            <CampaignEditor
              campaign={editor.campaign}
              onSave={handleSave}
              onClose={() => setEditor({ open: false, campaign: null })}
              onDelete={editor.campaign ? () => handleDelete(editor.campaign!.id) : undefined}
            />
          </>
        )}
      </AnimatePresence>
    </PermissionGate>
  );
}

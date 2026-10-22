"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/crm/page-header";

const ORG_ID = "da62326b-707d-41bd-bc2d-a61a81926dae";

type Job = {
  id: string;
  job_number: string;
  type: string;
  status: string;
  priority: string;
  customer_po: string | null;
  material_description: string | null;
  gauge_in: number | null;
  width_in: number | null;
  weight_ordered: number | null;
  pieces_ordered: number | null;
  estimated_total: number | null;
  date_received: string | null;
  date_needed: string | null;
  date_scheduled: string | null;
  special_instructions: string | null;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  quote: { label: "Quote", color: "#6b7280", bg: "#f3f4f6" },
  received: { label: "Received", color: "#2563eb", bg: "#eff6ff" },
  scheduled: { label: "Scheduled", color: "#7c3aed", bg: "#f5f3ff" },
  in_progress: { label: "In Progress", color: "#d97706", bg: "#fffbeb" },
  quality_hold: { label: "Quality Hold", color: "#dc2626", bg: "#fef2f2" },
  complete: { label: "Complete", color: "#059669", bg: "#ecfdf5" },
  shipped: { label: "Shipped", color: "#0891b2", bg: "#ecfeff" },
  invoiced: { label: "Invoiced", color: "#157070", bg: "#e6f3f3" },
  closed: { label: "Closed", color: "#6b7280", bg: "#f9fafb" },
  cancelled: { label: "Cancelled", color: "#9ca3af", bg: "#f9fafb" },
};

const TYPE_LABELS: Record<string, string> = {
  blanking: "Blanking",
  slitting: "Slitting",
  leveling: "Leveling",
  cut_to_length: "Cut to Length",
  multi_process: "Multi-Process",
  shearing: "Shearing",
  custom: "Custom",
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  rush: { label: "Rush", color: "#dc2626" },
  high: { label: "High", color: "#d97706" },
  normal: { label: "Normal", color: "#059669" },
  low: { label: "Low", color: "#6b7280" },
};

function StatCard({ label, value, icon: Icon, color, delay }: {
  label: string; value: number; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string; delay: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }} className="rounded-lg border bg-card p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}18` }}>
          <Icon className="size-4" style={{ color }} />
        </div>
      </div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: delay + 0.2 }} className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</motion.p>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: config.color, backgroundColor: config.bg }}>
      {config.label}
    </span>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = { rush: "#dc2626", high: "#d97706", normal: "#059669", low: "#6b7280" };
  return <span className="inline-block size-2 rounded-full" style={{ backgroundColor: colors[priority] || "#6b7280" }} title={priority} />;
}

type JobFormData = {
  job_number: string;
  type: string;
  status: string;
  priority: string;
  customer_po: string;
  material_description: string;
  gauge_in: string;
  width_in: string;
  weight_ordered: string;
  pieces_ordered: string;
  estimated_total: string;
  date_received: string;
  date_needed: string;
  date_scheduled: string;
  special_instructions: string;
};

const EMPTY_FORM: JobFormData = {
  job_number: "", type: "blanking", status: "quote", priority: "normal",
  customer_po: "", material_description: "",
  gauge_in: "", width_in: "", weight_ordered: "", pieces_ordered: "",
  estimated_total: "", date_received: "", date_needed: "", date_scheduled: "",
  special_instructions: "",
};

function JobEditor({ job, onSave, onClose, onDelete }: {
  job: Job | null;
  onSave: (data: JobFormData) => Promise<void>;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const isEdit = !!job;
  const [form, setForm] = useState<JobFormData>(() => {
    if (!job) return EMPTY_FORM;
    return {
      job_number: job.job_number,
      type: job.type,
      status: job.status,
      priority: job.priority,
      customer_po: job.customer_po || "",
      material_description: job.material_description || "",
      gauge_in: job.gauge_in?.toString() || "",
      width_in: job.width_in?.toString() || "",
      weight_ordered: job.weight_ordered?.toString() || "",
      pieces_ordered: job.pieces_ordered?.toString() || "",
      estimated_total: job.estimated_total?.toString() || "",
      date_received: job.date_received || "",
      date_needed: job.date_needed || "",
      date_scheduled: job.date_scheduled || "",
      special_instructions: job.special_instructions || "",
    };
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"basics" | "material" | "schedule">("basics");

  const handleSave = async () => {
    if (!form.job_number.trim()) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  const set = (key: keyof JobFormData, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l bg-background shadow-2xl"
    >
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">{isEdit ? "Edit Job" : "New Job"}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{isEdit ? "Update work order details" : "Create a new work order"}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
      </div>

      <div className="flex gap-1 border-b px-5">
        {(["basics", "material", "schedule"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${tab === t ? "border-[#157070] text-[#157070]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t === "basics" ? "Basics" : t === "material" ? "Material" : "Schedule"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "basics" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Job Number *</label>
              <input value={form.job_number} onChange={(e) => set("job_number", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. JOB-2026-001" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
                <select value={form.type} onChange={(e) => set("type", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]">
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]">
                  {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Priority</label>
                <select value={form.priority} onChange={(e) => set("priority", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]">
                  {Object.entries(PRIORITY_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Customer PO</label>
                <input value={form.customer_po} onChange={(e) => set("customer_po", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="PO number" />
              </div>
            </div>
          </div>
        )}

        {tab === "material" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Material Description</label>
              <textarea value={form.material_description} onChange={(e) => set("material_description", e.target.value)} rows={2} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. A36 HRS 14ga x 48&quot; coil" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Gauge (in)</label>
                <input value={form.gauge_in} onChange={(e) => set("gauge_in", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. 0.0747" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Width (in)</label>
                <input value={form.width_in} onChange={(e) => set("width_in", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. 48" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Weight Ordered (lbs)</label>
                <input value={form.weight_ordered} onChange={(e) => set("weight_ordered", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. 40000" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Pieces Ordered</label>
                <input value={form.pieces_ordered} onChange={(e) => set("pieces_ordered", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. 500" />
              </div>
            </div>
          </div>
        )}

        {tab === "schedule" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Estimated Total</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input value={form.estimated_total} onChange={(e) => set("estimated_total", e.target.value)} className="w-full rounded-md border bg-background py-2 pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. 3200" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Date Received</label>
                <input type="date" value={form.date_received} onChange={(e) => set("date_received", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Date Needed</label>
                <input type="date" value={form.date_needed} onChange={(e) => set("date_needed", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Date Scheduled</label>
              <input type="date" value={form.date_scheduled} onChange={(e) => set("date_scheduled", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Special Instructions</label>
              <textarea value={form.special_instructions} onChange={(e) => set("special_instructions", e.target.value)} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="Deburr edges, band in 10-piece bundles, etc." />
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
          <button type="button" onClick={handleSave} disabled={saving || !form.job_number.trim()} className="rounded-md bg-[#157070] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#126060] disabled:opacity-50 transition-colors">
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Job"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [total, setTotal] = useState(0);
  const [editor, setEditor] = useState<{ open: boolean; job: Job | null }>({ open: false, job: null });

  const loadData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ table: "erp_jobs", org: ORG_ID });
    if (filter !== "all") params.set("status", filter);
    fetch(`/api/erp?${params}`)
      .then((r) => r.json())
      .then((d) => { setJobs(d.data || []); setTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (data: JobFormData) => {
    const payload = {
      table: "erp_jobs",
      org_id: ORG_ID,
      job_number: data.job_number,
      type: data.type,
      status: data.status,
      priority: data.priority,
      customer_po: data.customer_po || null,
      material_description: data.material_description || null,
      gauge_in: data.gauge_in ? Number(data.gauge_in) : null,
      width_in: data.width_in ? Number(data.width_in) : null,
      weight_ordered: data.weight_ordered ? Number(data.weight_ordered.replace(/,/g, "")) : null,
      pieces_ordered: data.pieces_ordered ? Number(data.pieces_ordered.replace(/,/g, "")) : null,
      estimated_total: data.estimated_total ? Number(data.estimated_total.replace(/,/g, "")) : null,
      date_received: data.date_received || null,
      date_needed: data.date_needed || null,
      date_scheduled: data.date_scheduled || null,
      special_instructions: data.special_instructions || null,
    };
    if (editor.job) {
      await fetch("/api/erp", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: editor.job.id }) });
    } else {
      await fetch("/api/erp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setEditor({ open: false, job: null });
    loadData();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/erp?table=erp_jobs&id=${id}&org=${ORG_ID}`, { method: "DELETE" });
    setEditor({ open: false, job: null });
    loadData();
  };

  const stats = {
    active: jobs.filter((j) => ["received", "scheduled", "in_progress"].includes(j.status)).length,
    holds: jobs.filter((j) => j.status === "quality_hold").length,
    complete: jobs.filter((j) => ["complete", "shipped", "invoiced"].includes(j.status)).length,
    totalWeight: jobs.reduce((s, j) => s + (j.weight_ordered || 0), 0),
  };

  return (
    <>
      <PageHeader title="Jobs" description="Work orders, processing jobs, and scheduling" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Jobs" value={stats.active} icon={ClipboardList} color="#2563eb" delay={0} />
        <StatCard label="Quality Holds" value={stats.holds} icon={AlertTriangle} color="#dc2626" delay={0.1} />
        <StatCard label="Completed" value={stats.complete} icon={CheckCircle2} color="#059669" delay={0.2} />
        <StatCard label="Total Jobs" value={total} icon={Clock} color="#157070" delay={0.3} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium">Work Orders</h3>
            <div className="flex items-center gap-1">
              {["all", "received", "in_progress", "quality_hold", "complete"].map((s) => (
                <button key={s} type="button" onClick={() => setFilter(s)}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${filter === s ? "bg-[#157070] text-white" : "text-muted-foreground hover:bg-muted"}`}>
                  {s === "all" ? "All" : s === "in_progress" ? "In Progress" : s === "quality_hold" ? "Q-Hold" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setEditor({ open: true, job: null })} className="flex items-center gap-1.5 rounded-md bg-[#157070] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#126060] transition-colors">
            <Plus className="size-3.5" /> New Job
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="size-6 animate-spin rounded-full border-2 border-[#157070] border-t-transparent" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-20 text-center">
            <ClipboardList className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No jobs yet</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Jobs will appear here as work orders are created</p>
            <button type="button" onClick={() => setEditor({ open: true, job: null })} className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#157070] px-4 py-2 text-xs font-medium text-white hover:bg-[#126060]">
              <Plus className="size-3.5" /> Create Job
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-2.5">Job #</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Priority</th>
                  <th className="px-4 py-2.5">Material</th>
                  <th className="px-4 py-2.5 text-right">Weight (lbs)</th>
                  <th className="px-4 py-2.5 text-right">Est. Total</th>
                  <th className="px-4 py-2.5">Needed</th>
                  <th className="px-4 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, i) => (
                  <motion.tr key={job.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }} className="border-b transition-colors last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{job.job_number}</td>
                    <td className="px-4 py-3 text-muted-foreground">{TYPE_LABELS[job.type] || job.type}</td>
                    <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <PriorityDot priority={job.priority} />
                        <span className="capitalize text-muted-foreground">{job.priority}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{job.material_description || "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{job.weight_ordered ? Number(job.weight_ordered).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{job.estimated_total ? `$${Number(job.estimated_total).toLocaleString()}` : "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{job.date_needed || "—"}</td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => setEditor({ open: true, job })} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <Pencil className="size-3.5" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {editor.open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black" onClick={() => setEditor({ open: false, job: null })} />
            <JobEditor
              job={editor.job}
              onSave={handleSave}
              onClose={() => setEditor({ open: false, job: null })}
              onDelete={editor.job ? () => handleDelete(editor.job!.id) : undefined}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Rocket, CheckCircle2, DollarSign, Plus, Pencil, Trash2, X, ChevronDown, ChevronRight, Target, Clock, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/crm/page-header";

const ORG_ID = "da62326b-707d-41bd-bc2d-a61a81926dae";

type Deliverable = {
  id: string;
  name: string;
  priority: string;
  status: string;
  category: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  assigned_to: string | null;
  due_date: string | null;
  completed_date: string | null;
  description: string | null;
  kpis: string | null;
  dependencies: string | null;
  notes: string | null;
  sort_order: number | null;
  is_active: boolean;
  created_at: string;
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  now: { label: "Now", color: "#157070", bg: "#e6f2f2" },
  next: { label: "Next", color: "#2563eb", bg: "#eff6ff" },
  later: { label: "Later", color: "#6b7280", bg: "#f3f4f6" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  planned: { label: "Planned", color: "#2563eb", bg: "#eff6ff" },
  in_progress: { label: "In Progress", color: "#d97706", bg: "#fffbeb" },
  completed: { label: "Completed", color: "#059669", bg: "#ecfdf5" },
  on_hold: { label: "On Hold", color: "#ea580c", bg: "#fff7ed" },
  cancelled: { label: "Cancelled", color: "#dc2626", bg: "#fef2f2" },
};

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  website: { label: "Website & SEO", color: "text-blue-600 dark:text-blue-400" },
  social: { label: "Social Media", color: "text-sky-600 dark:text-sky-400" },
  content: { label: "Content & Video", color: "text-emerald-600 dark:text-emerald-400" },
  directories: { label: "Directory Listings", color: "text-violet-600 dark:text-violet-400" },
  events: { label: "Events & Trade Shows", color: "text-orange-600 dark:text-orange-400" },
  email: { label: "Email Marketing", color: "text-amber-600 dark:text-amber-400" },
  publications: { label: "Publications & PR", color: "text-rose-600 dark:text-rose-400" },
  advertising: { label: "Advertising", color: "text-red-600 dark:text-red-400" },
  other: { label: "Other", color: "text-muted-foreground" },
};

function StatCard({ label, value, icon: Icon, color, delay, format }: { label: string; value: number | string; icon: React.ComponentType<{ className?: string }>; color: string; delay: number; format?: "currency" }) {
  const display = format === "currency" ? `$${Number(value).toLocaleString()}` : value;
  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }} className="rounded-lg border bg-card p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}18` }}>
          <Icon className="size-4" style={{ color }} />
        </div>
      </div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: delay + 0.2 }} className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{display}</motion.p>
    </motion.div>
  );
}

type DeliverableFormData = {
  name: string;
  priority: string;
  status: string;
  category: string;
  estimated_cost: string;
  sort_order: string;
  description: string;
  kpis: string;
  dependencies: string;
  notes: string;
  actual_cost: string;
  assigned_to: string;
  due_date: string;
  completed_date: string;
};

const EMPTY_FORM: DeliverableFormData = {
  name: "", priority: "next", status: "planned", category: "other",
  estimated_cost: "", sort_order: "0", description: "", kpis: "",
  dependencies: "", notes: "", actual_cost: "", assigned_to: "",
  due_date: "", completed_date: "",
};

function DeliverableEditor({ deliverable, onSave, onClose, onDelete }: {
  deliverable: Deliverable | null;
  onSave: (data: DeliverableFormData) => Promise<void>;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const isEdit = !!deliverable;
  const [form, setForm] = useState<DeliverableFormData>(() => {
    if (!deliverable) return EMPTY_FORM;
    return {
      name: deliverable.name,
      priority: deliverable.priority,
      status: deliverable.status,
      category: deliverable.category || "other",
      estimated_cost: deliverable.estimated_cost != null ? Number(deliverable.estimated_cost).toString() : "",
      sort_order: deliverable.sort_order?.toString() || "0",
      description: deliverable.description || "",
      kpis: deliverable.kpis || "",
      dependencies: deliverable.dependencies || "",
      notes: deliverable.notes || "",
      actual_cost: deliverable.actual_cost != null ? Number(deliverable.actual_cost).toString() : "",
      assigned_to: deliverable.assigned_to || "",
      due_date: deliverable.due_date || "",
      completed_date: deliverable.completed_date || "",
    };
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"basics" | "details" | "tracking">("basics");

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  const set = (key: keyof DeliverableFormData, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const inputClass = "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]";
  const labelClass = "mb-1 block text-xs font-medium text-muted-foreground";

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l bg-background shadow-2xl"
    >
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">{isEdit ? "Edit Deliverable" : "New Deliverable"}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{isEdit ? "Update deliverable details and tracking" : "Add a marketing deliverable"}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
      </div>

      <div className="flex gap-1 border-b px-5">
        {(["basics", "details", "tracking"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${tab === t ? "border-[#157070] text-[#157070]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t === "basics" ? "Basics" : t === "details" ? "Details" : "Tracking"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "basics" && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Deliverable Name *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} placeholder="e.g. LinkedIn Company Page Launch" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Priority</label>
                <select value={form.priority} onChange={(e) => set("priority", e.target.value)} className={inputClass}>
                  {Object.entries(PRIORITY_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputClass}>
                  {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Category</label>
                <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputClass}>
                  {Object.entries(CATEGORY_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Estimated Cost</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input value={form.estimated_cost} onChange={(e) => set("estimated_cost", e.target.value)} className={`${inputClass} pl-7`} placeholder="0" />
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>Sort Order</label>
              <input type="number" value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} className={inputClass} placeholder="0" />
            </div>
          </div>
        )}

        {tab === "details" && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Description</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} className={`${inputClass} min-h-[80px] resize-y`} placeholder="What will be delivered..." />
            </div>
            <div>
              <label className={labelClass}>KPIs / Success Metrics</label>
              <textarea value={form.kpis} onChange={(e) => set("kpis", e.target.value)} className={`${inputClass} min-h-[80px] resize-y`} placeholder="How success will be measured..." />
            </div>
            <div>
              <label className={labelClass}>Dependencies</label>
              <textarea value={form.dependencies} onChange={(e) => set("dependencies", e.target.value)} className={`${inputClass} min-h-[60px] resize-y`} placeholder="What this depends on..." />
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} className={`${inputClass} min-h-[60px] resize-y`} placeholder="Additional notes..." />
            </div>
          </div>
        )}

        {tab === "tracking" && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Actual Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input value={form.actual_cost} onChange={(e) => set("actual_cost", e.target.value)} className={`${inputClass} pl-7`} placeholder="0" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Assigned To</label>
              <input value={form.assigned_to} onChange={(e) => set("assigned_to", e.target.value)} className={inputClass} placeholder="e.g. Jeff Jack" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Due Date</label>
                <input type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Completed Date</label>
                <input type="date" value={form.completed_date} onChange={(e) => set("completed_date", e.target.value)} className={inputClass} />
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
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Deliverable"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function PrioritySection({ title, items, color, bg, expanded, onToggle, onEdit }: {
  title: string;
  items: Deliverable[];
  color: string;
  bg: string;
  expanded: boolean;
  onToggle: () => void;
  onEdit: (d: Deliverable) => void;
}) {
  return (
    <div className="rounded-lg border bg-card">
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors">
        {expanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ color, backgroundColor: bg }}>{title}</span>
        <span className="text-xs text-muted-foreground">{items.length} deliverable{items.length !== 1 ? "s" : ""}</span>
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          ${items.reduce((sum, d) => sum + Number(d.estimated_cost || 0), 0).toLocaleString()}
        </span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="border-t">
              {items.map((d) => (
                <DeliverableRow key={d.id} deliverable={d} onEdit={onEdit} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DeliverableRow({ deliverable, onEdit }: { deliverable: Deliverable; onEdit: (d: Deliverable) => void }) {
  const [expanded, setExpanded] = useState(false);
  const sc = STATUS_CONFIG[deliverable.status] || { label: deliverable.status, color: "#6b7280", bg: "#f3f4f6" };
  const cc = CATEGORY_CONFIG[deliverable.category || "other"] || CATEGORY_CONFIG.other;
  const cost = deliverable.estimated_cost != null ? `$${Number(deliverable.estimated_cost).toLocaleString()}` : "—";
  const actualCost = deliverable.actual_cost != null && Number(deliverable.actual_cost) > 0 ? Number(deliverable.actual_cost) : 0;
  const estCost = deliverable.estimated_cost != null ? Number(deliverable.estimated_cost) : 0;
  const progress = estCost > 0 && actualCost > 0 ? Math.min(100, Math.round((actualCost / estCost) * 100)) : 0;

  return (
    <div className="border-b last:border-0">
      <div className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/30 transition-colors">
        <button type="button" onClick={() => setExpanded(!expanded)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          {expanded ? <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />}
          <span className="min-w-0 flex-1 truncate font-medium">{deliverable.name}</span>
        </button>
        <span className={`shrink-0 text-xs font-medium ${cc.color}`}>{cc.label}</span>
        <span className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span>
        <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{cost}</span>
        {estCost > 0 && (
          <div className="w-16 shrink-0">
            <div className="h-1.5 rounded-full bg-muted">
              <div className="h-full rounded-full bg-[#157070] transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
        <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(deliverable); }} className="shrink-0 rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Pencil className="size-3.5" />
        </button>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="grid grid-cols-1 gap-3 border-t bg-muted/20 px-4 py-3 text-xs sm:grid-cols-2">
              {deliverable.description && (
                <div className="sm:col-span-2">
                  <span className="font-medium text-muted-foreground">Description:</span>
                  <p className="mt-0.5 text-foreground">{deliverable.description}</p>
                </div>
              )}
              {deliverable.kpis && (
                <div className="sm:col-span-2">
                  <span className="font-medium text-muted-foreground">KPIs:</span>
                  <p className="mt-0.5 text-foreground">{deliverable.kpis}</p>
                </div>
              )}
              {deliverable.dependencies && (
                <div>
                  <span className="font-medium text-muted-foreground">Dependencies:</span>
                  <p className="mt-0.5 text-foreground">{deliverable.dependencies}</p>
                </div>
              )}
              {deliverable.assigned_to && (
                <div>
                  <span className="font-medium text-muted-foreground">Assigned To:</span>
                  <p className="mt-0.5 text-foreground">{deliverable.assigned_to}</p>
                </div>
              )}
              {deliverable.due_date && (
                <div>
                  <span className="font-medium text-muted-foreground">Due Date:</span>
                  <p className="mt-0.5 text-foreground">{deliverable.due_date}</p>
                </div>
              )}
              {deliverable.notes && (
                <div className="sm:col-span-2">
                  <span className="font-medium text-muted-foreground">Notes:</span>
                  <p className="mt-0.5 text-foreground">{deliverable.notes}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProposalPage() {
  const [items, setItems] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editor, setEditor] = useState<{ open: boolean; deliverable: Deliverable | null }>({ open: false, deliverable: null });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ now: true, next: true, later: true });

  const loadData = useCallback(() => {
    setLoading(true);
    fetch(`/api/erp?table=erp_deliverables&org=${ORG_ID}`)
      .then((r) => r.json())
      .then((d) => setItems((d.data || []).sort((a: Deliverable, b: Deliverable) => (a.sort_order || 0) - (b.sort_order || 0))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (data: DeliverableFormData) => {
    const payload: Record<string, unknown> = {
      table: "erp_deliverables",
      org_id: ORG_ID,
      name: data.name,
      priority: data.priority,
      status: data.status,
      category: data.category,
      estimated_cost: data.estimated_cost ? Number(data.estimated_cost) : null,
      sort_order: data.sort_order ? Number(data.sort_order) : 0,
      description: data.description || null,
      kpis: data.kpis || null,
      dependencies: data.dependencies || null,
      notes: data.notes || null,
      actual_cost: data.actual_cost ? Number(data.actual_cost) : null,
      assigned_to: data.assigned_to || null,
      due_date: data.due_date || null,
      completed_date: data.completed_date || null,
    };
    if (editor.deliverable) {
      await fetch("/api/erp", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: editor.deliverable.id }) });
    } else {
      await fetch("/api/erp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setEditor({ open: false, deliverable: null });
    loadData();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/erp?table=erp_deliverables&id=${id}&org=${ORG_ID}`, { method: "DELETE" });
    setEditor({ open: false, deliverable: null });
    loadData();
  };

  const filtered = filter === "all" ? items : items.filter((d) => d.priority === filter);
  const now = filtered.filter((d) => d.priority === "now");
  const next = filtered.filter((d) => d.priority === "next");
  const later = filtered.filter((d) => d.priority === "later");

  const totalBudget = items.reduce((sum, d) => sum + Number(d.estimated_cost || 0), 0);
  const inProgress = items.filter((d) => d.status === "in_progress").length;
  const completed = items.filter((d) => d.status === "completed").length;

  return (
    <>
      <PageHeader title="Proposal & Deliverables" description="Marketing services scope, deliverables, and cost tracking" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Deliverables" value={items.length} icon={FileText} color="#157070" delay={0} />
        <StatCard label="In Progress" value={inProgress} icon={Rocket} color="#d97706" delay={0.1} />
        <StatCard label="Completed" value={completed} icon={CheckCircle2} color="#059669" delay={0.2} />
        <StatCard label="Total Budget" value={totalBudget} icon={DollarSign} color="#2563eb" delay={0.3} format="currency" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {["all", "now", "next", "later"].map((s) => (
              <button key={s} type="button" onClick={() => setFilter(s)} className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${filter === s ? "bg-[#157070] text-white" : "text-muted-foreground hover:bg-muted"}`}>
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setEditor({ open: true, deliverable: null })} className="flex items-center gap-1.5 rounded-md bg-[#157070] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#126060] transition-colors">
            <Plus className="size-3.5" /> Add Deliverable
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 rounded-lg border bg-card"><div className="size-6 animate-spin rounded-full border-2 border-[#157070] border-t-transparent" /></div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border bg-card py-20 text-center">
            <FileText className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No deliverables yet</p>
            <button type="button" onClick={() => setEditor({ open: true, deliverable: null })} className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#157070] px-4 py-2 text-xs font-medium text-white hover:bg-[#126060]">
              <Plus className="size-3.5" /> Add First Deliverable
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {(filter === "all" || filter === "now") && now.length > 0 && (
              <PrioritySection title="Now" items={now} color={PRIORITY_CONFIG.now.color} bg={PRIORITY_CONFIG.now.bg} expanded={expanded.now} onToggle={() => setExpanded((e) => ({ ...e, now: !e.now }))} onEdit={(d) => setEditor({ open: true, deliverable: d })} />
            )}
            {(filter === "all" || filter === "next") && next.length > 0 && (
              <PrioritySection title="Next" items={next} color={PRIORITY_CONFIG.next.color} bg={PRIORITY_CONFIG.next.bg} expanded={expanded.next} onToggle={() => setExpanded((e) => ({ ...e, next: !e.next }))} onEdit={(d) => setEditor({ open: true, deliverable: d })} />
            )}
            {(filter === "all" || filter === "later") && later.length > 0 && (
              <PrioritySection title="Later" items={later} color={PRIORITY_CONFIG.later.color} bg={PRIORITY_CONFIG.later.bg} expanded={expanded.later} onToggle={() => setExpanded((e) => ({ ...e, later: !e.later }))} onEdit={(d) => setEditor({ open: true, deliverable: d })} />
            )}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {editor.open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black" onClick={() => setEditor({ open: false, deliverable: null })} />
            <DeliverableEditor
              deliverable={editor.deliverable}
              onSave={handleSave}
              onClose={() => setEditor({ open: false, deliverable: null })}
              onDelete={editor.deliverable ? () => handleDelete(editor.deliverable!.id) : undefined}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

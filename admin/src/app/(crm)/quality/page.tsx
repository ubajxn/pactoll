"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle2, Clock, Plus, Pencil, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/crm/page-header";

const ORG_ID = "da62326b-707d-41bd-bc2d-a61a81926dae";

type Inspection = {
  id: string;
  inspection_number: string;
  type: string;
  status: string;
  inspection_date: string | null;
  inspector_name: string | null;
  result: string | null;
  gauge_measured: number | null;
  width_measured: number | null;
  flatness_deviation: number | null;
  surface_defects: string | null;
  edge_condition: string | null;
  notes: string | null;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "#6b7280", bg: "#f3f4f6" },
  in_progress: { label: "In Progress", color: "#2563eb", bg: "#eff6ff" },
  complete: { label: "Complete", color: "#059669", bg: "#ecfdf5" },
  failed: { label: "Failed", color: "#dc2626", bg: "#fef2f2" },
  waived: { label: "Waived", color: "#9ca3af", bg: "#f9fafb" },
};

const RESULT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pass: { label: "Pass", color: "#059669", bg: "#ecfdf5" },
  fail: { label: "Fail", color: "#dc2626", bg: "#fef2f2" },
  conditional: { label: "Conditional", color: "#d97706", bg: "#fffbeb" },
  pending: { label: "Pending", color: "#6b7280", bg: "#f3f4f6" },
};

const TYPE_OPTIONS = [
  { value: "incoming", label: "Incoming Material" },
  { value: "in_process", label: "In-Process" },
  { value: "final", label: "Final" },
  { value: "dimensional", label: "Dimensional" },
  { value: "surface", label: "Surface Quality" },
  { value: "flatness", label: "Flatness" },
  { value: "edge", label: "Edge Condition" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }));
const RESULT_OPTIONS = Object.entries(RESULT_CONFIG).map(([value, { label }]) => ({ value, label }));

type InspectionFormData = {
  inspection_number: string;
  type: string;
  status: string;
  inspection_date: string;
  inspector_name: string;
  result: string;
  gauge_measured: string;
  width_measured: string;
  flatness_deviation: string;
  surface_defects: string;
  edge_condition: string;
  notes: string;
};

const EMPTY_FORM: InspectionFormData = {
  inspection_number: "", type: "incoming", status: "pending",
  inspection_date: "", inspector_name: "", result: "pending",
  gauge_measured: "", width_measured: "", flatness_deviation: "",
  surface_defects: "", edge_condition: "", notes: "",
};

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

function InspectionEditor({ inspection, onSave, onClose, onDelete }: {
  inspection: Inspection | null;
  onSave: (data: InspectionFormData) => Promise<void>;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const isEdit = !!inspection;
  const [form, setForm] = useState<InspectionFormData>(() => {
    if (!inspection) return EMPTY_FORM;
    return {
      inspection_number: inspection.inspection_number,
      type: inspection.type,
      status: inspection.status,
      inspection_date: inspection.inspection_date || "",
      inspector_name: inspection.inspector_name || "",
      result: inspection.result || "pending",
      gauge_measured: inspection.gauge_measured?.toString() || "",
      width_measured: inspection.width_measured?.toString() || "",
      flatness_deviation: inspection.flatness_deviation?.toString() || "",
      surface_defects: inspection.surface_defects || "",
      edge_condition: inspection.edge_condition || "",
      notes: inspection.notes || "",
    };
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"basics" | "measurements" | "notes">("basics");

  const handleSave = async () => {
    if (!form.inspection_number.trim()) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  const set = (key: keyof InspectionFormData, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l bg-background shadow-2xl"
    >
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">{isEdit ? "Edit Inspection" : "New Inspection"}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{isEdit ? "Update inspection results and measurements" : "Log a new quality inspection"}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
      </div>

      <div className="flex gap-1 border-b px-5">
        {(["basics", "measurements", "notes"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${tab === t ? "border-[#157070] text-[#157070]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t === "basics" ? "Basics" : t === "measurements" ? "Measurements" : "Quality & Notes"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "basics" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Inspection Number *</label>
              <input value={form.inspection_number} onChange={(e) => set("inspection_number", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. QC-2024-001" />
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
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Inspection Date</label>
                <input type="date" value={form.inspection_date} onChange={(e) => set("inspection_date", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Inspector</label>
                <input value={form.inspector_name} onChange={(e) => set("inspector_name", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="Inspector name" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Result</label>
              <select value={form.result} onChange={(e) => set("result", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]">
                {RESULT_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
        )}

        {tab === "measurements" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-[#157070]/5 p-3">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-4 text-[#157070]" />
                <p className="text-xs text-[#157070]">Record actual measurements against spec. Deviations flag automatically in reporting.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Gauge Measured (in)</label>
                <input value={form.gauge_measured} onChange={(e) => set("gauge_measured", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. 0.125" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Width Measured (in)</label>
                <input value={form.width_measured} onChange={(e) => set("width_measured", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. 48.0" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Flatness Deviation (in)</label>
              <input value={form.flatness_deviation} onChange={(e) => set("flatness_deviation", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. 0.005" />
            </div>
          </div>
        )}

        {tab === "notes" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Surface Defects</label>
              <input value={form.surface_defects} onChange={(e) => set("surface_defects", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="None, scratches, dents, rust, mill scale..." />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Edge Condition</label>
              <input value={form.edge_condition} onChange={(e) => set("edge_condition", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="Clean, burr, camber, wave..." />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes</label>
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={4} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="Additional inspection notes, non-conformance details..." />
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
          <button type="button" onClick={handleSave} disabled={saving || !form.inspection_number.trim()} className="rounded-md bg-[#157070] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#126060] disabled:opacity-50 transition-colors">
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Log Inspection"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function QualityPage() {
  const [items, setItems] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  const [editor, setEditor] = useState<{ open: boolean; inspection: Inspection | null }>({ open: false, inspection: null });

  const loadData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ table: "erp_inspections", org: ORG_ID });
    if (filter !== "all") params.set("status", filter);
    fetch(`/api/erp?${params}`)
      .then((r) => r.json())
      .then((d) => { setItems(d.data || []); setTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (data: InspectionFormData) => {
    const payload = {
      table: "erp_inspections",
      org_id: ORG_ID,
      inspection_number: data.inspection_number,
      type: data.type,
      status: data.status,
      inspection_date: data.inspection_date || null,
      inspector_name: data.inspector_name || null,
      result: data.result,
      gauge_measured: data.gauge_measured ? Number(data.gauge_measured) : null,
      width_measured: data.width_measured ? Number(data.width_measured) : null,
      flatness_deviation: data.flatness_deviation ? Number(data.flatness_deviation) : null,
      surface_defects: data.surface_defects || null,
      edge_condition: data.edge_condition || null,
      notes: data.notes || null,
    };

    if (editor.inspection) {
      await fetch("/api/erp", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: editor.inspection.id }) });
    } else {
      await fetch("/api/erp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setEditor({ open: false, inspection: null });
    loadData();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/erp?table=erp_inspections&id=${id}&org=${ORG_ID}`, { method: "DELETE" });
    setEditor({ open: false, inspection: null });
    loadData();
  };

  const pending = items.filter((i) => ["pending", "in_progress"].includes(i.status)).length;
  const passed = items.filter((i) => i.result === "pass").length;
  const failed = items.filter((i) => i.result === "fail").length;

  return (
    <>
      <PageHeader title="Quality" description="Inspections, measurements, and QC compliance" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pending QC" value={pending} icon={Clock} color="#d97706" delay={0} />
        <StatCard label="Passed" value={passed} icon={CheckCircle2} color="#059669" delay={0.1} />
        <StatCard label="Failed" value={failed} icon={AlertTriangle} color="#dc2626" delay={0.2} />
        <StatCard label="Total Inspections" value={total} icon={ShieldCheck} color="#157070" delay={0.3} />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium">Inspection Log</h3>
            <div className="flex items-center gap-1">
              {["all", "pending", "in_progress", "complete", "failed"].map((s) => (
                <button key={s} type="button" onClick={() => setFilter(s)} className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${filter === s ? "bg-[#157070] text-white" : "text-muted-foreground hover:bg-muted"}`}>
                  {s === "all" ? "All" : s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setEditor({ open: true, inspection: null })} className="flex items-center gap-1.5 rounded-md bg-[#157070] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#126060] transition-colors">
            <Plus className="size-3.5" /> New Inspection
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="size-6 animate-spin rounded-full border-2 border-[#157070] border-t-transparent" /></div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <ShieldCheck className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No inspections recorded</p>
            <p className="mt-1 text-xs text-muted-foreground/70">QC inspections will appear as quality checks are performed</p>
            <button type="button" onClick={() => setEditor({ open: true, inspection: null })} className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#157070] px-4 py-2 text-xs font-medium text-white hover:bg-[#126060]">
              <Plus className="size-3.5" /> New Inspection
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-2.5">Inspection #</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Inspector</th>
                  <th className="px-4 py-2.5 text-right">Gauge</th>
                  <th className="px-4 py-2.5 text-right">Width</th>
                  <th className="px-4 py-2.5">Surface</th>
                  <th className="px-4 py-2.5">Result</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((insp, i) => {
                  const sc = STATUS_CONFIG[insp.status] || { label: insp.status, color: "#6b7280", bg: "#f3f4f6" };
                  const rc = RESULT_CONFIG[insp.result || "pending"] || { label: insp.result || "—", color: "#6b7280", bg: "#f3f4f6" };
                  return (
                    <motion.tr key={insp.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }} className="border-b transition-colors last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{insp.inspection_number}</td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{insp.type?.replace(/_/g, " ") || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{insp.inspection_date || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{insp.inspector_name || "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{insp.gauge_measured ? `${insp.gauge_measured}"` : "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{insp.width_measured ? `${insp.width_measured}"` : "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{insp.surface_defects || "None"}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: rc.color, backgroundColor: rc.bg }}>{rc.label}</span></td>
                      <td className="px-4 py-3"><span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span></td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => setEditor({ open: true, inspection: insp })} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black" onClick={() => setEditor({ open: false, inspection: null })} />
            <InspectionEditor
              inspection={editor.inspection}
              onSave={handleSave}
              onClose={() => setEditor({ open: false, inspection: null })}
              onDelete={editor.inspection ? () => handleDelete(editor.inspection!.id) : undefined}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

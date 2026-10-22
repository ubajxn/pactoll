"use client";

import { useCallback, useEffect, useState } from "react";
import { HardHat, AlertTriangle, Clock, CheckCircle2, Plus, Pencil, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/crm/page-header";

const ORG_ID = "da62326b-707d-41bd-bc2d-a61a81926dae";

type SafetyIncident = {
  id: string;
  incident_number: string;
  type: string;
  severity: string;
  status: string;
  incident_date: string | null;
  location: string | null;
  description: string | null;
  root_cause: string | null;
  corrective_action: string | null;
  osha_recordable: boolean;
  lost_time: boolean;
  days_lost: number | null;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  reported: { label: "Reported", color: "#dc2626", bg: "#fef2f2" },
  investigating: { label: "Investigating", color: "#d97706", bg: "#fffbeb" },
  corrective_action: { label: "Corrective", color: "#7c3aed", bg: "#f5f3ff" },
  resolved: { label: "Resolved", color: "#059669", bg: "#ecfdf5" },
  closed: { label: "Closed", color: "#6b7280", bg: "#f9fafb" },
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  minor: { label: "Minor", color: "#059669", bg: "#ecfdf5" },
  moderate: { label: "Moderate", color: "#d97706", bg: "#fffbeb" },
  serious: { label: "Serious", color: "#ea580c", bg: "#fff7ed" },
  severe: { label: "Severe", color: "#dc2626", bg: "#fef2f2" },
  fatal: { label: "Fatal", color: "#7f1d1d", bg: "#fef2f2" },
};

const TYPE_OPTIONS = [
  { value: "injury", label: "Injury" },
  { value: "near_miss", label: "Near Miss" },
  { value: "property_damage", label: "Property Damage" },
  { value: "environmental", label: "Environmental" },
  { value: "vehicle", label: "Vehicle" },
  { value: "fire", label: "Fire" },
  { value: "chemical", label: "Chemical" },
  { value: "equipment_failure", label: "Equipment Failure" },
  { value: "other", label: "Other" },
];

const SEVERITY_OPTIONS = Object.entries(SEVERITY_CONFIG).map(([value, { label }]) => ({ value, label }));
const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }));

type IncidentFormData = {
  incident_number: string;
  type: string;
  severity: string;
  status: string;
  incident_date: string;
  location: string;
  description: string;
  root_cause: string;
  corrective_action: string;
  osha_recordable: boolean;
  lost_time: boolean;
  days_lost: string;
};

const EMPTY_FORM: IncidentFormData = {
  incident_number: "", type: "injury", severity: "minor", status: "reported",
  incident_date: "", location: "", description: "",
  root_cause: "", corrective_action: "",
  osha_recordable: false, lost_time: false, days_lost: "",
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

function IncidentEditor({ incident, onSave, onClose, onDelete }: {
  incident: SafetyIncident | null;
  onSave: (data: IncidentFormData) => Promise<void>;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const isEdit = !!incident;
  const [form, setForm] = useState<IncidentFormData>(() => {
    if (!incident) return EMPTY_FORM;
    return {
      incident_number: incident.incident_number,
      type: incident.type,
      severity: incident.severity,
      status: incident.status,
      incident_date: incident.incident_date || "",
      location: incident.location || "",
      description: incident.description || "",
      root_cause: incident.root_cause || "",
      corrective_action: incident.corrective_action || "",
      osha_recordable: incident.osha_recordable,
      lost_time: incident.lost_time,
      days_lost: incident.days_lost?.toString() || "",
    };
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"basics" | "details" | "resolution">("basics");

  const handleSave = async () => {
    if (!form.incident_number.trim()) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  const set = (key: keyof IncidentFormData, val: unknown) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l bg-background shadow-2xl"
    >
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">{isEdit ? "Edit Incident" : "Report Incident"}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{isEdit ? "Update incident details and resolution" : "Log a new safety incident"}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
      </div>

      <div className="flex gap-1 border-b px-5">
        {(["basics", "details", "resolution"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${tab === t ? "border-[#157070] text-[#157070]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t === "basics" ? "Basics" : t === "details" ? "Details" : "Resolution"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "basics" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Incident Number *</label>
              <input value={form.incident_number} onChange={(e) => set("incident_number", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. SI-2024-001" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
                <select value={form.type} onChange={(e) => set("type", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]">
                  {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Severity</label>
                <select value={form.severity} onChange={(e) => set("severity", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]">
                  {SEVERITY_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]">
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Incident Date</label>
                <input type="date" value={form.incident_date} onChange={(e) => set("incident_date", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Location</label>
                <input value={form.location} onChange={(e) => set("location", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. Bay 3, Slitter #2" />
              </div>
            </div>
          </div>
        )}

        {tab === "details" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="Describe what happened..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.osha_recordable} onChange={(e) => set("osha_recordable", e.target.checked)} className="rounded border-gray-300" />
                <span className="text-muted-foreground">OSHA Recordable</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.lost_time} onChange={(e) => set("lost_time", e.target.checked)} className="rounded border-gray-300" />
                <span className="text-muted-foreground">Lost Time Incident</span>
              </label>
            </div>
            {form.lost_time && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Days Lost</label>
                <input value={form.days_lost} onChange={(e) => set("days_lost", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="Number of days" />
              </div>
            )}
          </div>
        )}

        {tab === "resolution" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Root Cause</label>
              <textarea value={form.root_cause} onChange={(e) => set("root_cause", e.target.value)} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="What caused the incident?" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Corrective Action</label>
              <textarea value={form.corrective_action} onChange={(e) => set("corrective_action", e.target.value)} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="Actions taken or planned to prevent recurrence..." />
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
          <button type="button" onClick={handleSave} disabled={saving || !form.incident_number.trim()} className="rounded-md bg-[#157070] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#126060] disabled:opacity-50 transition-colors">
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Report Incident"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function SafetyPage() {
  const [items, setItems] = useState<SafetyIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  const [editor, setEditor] = useState<{ open: boolean; incident: SafetyIncident | null }>({ open: false, incident: null });

  const loadData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ table: "erp_safety_incidents", org: ORG_ID });
    if (filter !== "all") params.set("status", filter);
    fetch(`/api/erp?${params}`)
      .then((r) => r.json())
      .then((d) => { setItems(d.data || []); setTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (data: IncidentFormData) => {
    const payload = {
      table: "erp_safety_incidents",
      org_id: ORG_ID,
      incident_number: data.incident_number,
      type: data.type,
      severity: data.severity,
      status: data.status,
      incident_date: data.incident_date || null,
      location: data.location || null,
      description: data.description || null,
      root_cause: data.root_cause || null,
      corrective_action: data.corrective_action || null,
      osha_recordable: data.osha_recordable,
      lost_time: data.lost_time,
      days_lost: data.days_lost ? Number(data.days_lost) : null,
    };

    if (editor.incident) {
      await fetch("/api/erp", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: editor.incident.id }) });
    } else {
      await fetch("/api/erp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setEditor({ open: false, incident: null });
    loadData();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/erp?table=erp_safety_incidents&id=${id}&org=${ORG_ID}`, { method: "DELETE" });
    setEditor({ open: false, incident: null });
    loadData();
  };

  const openIncidents = items.filter((s) => ["reported", "investigating", "corrective_action"].includes(s.status)).length;
  const oshaRecordable = items.filter((s) => s.osha_recordable).length;
  const daysLost = items.reduce((s, i) => s + (Number(i.days_lost) || 0), 0);

  return (
    <>
      <PageHeader title="Safety" description="Incident tracking, OSHA compliance, and corrective actions" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open Incidents" value={openIncidents} icon={AlertTriangle} color="#dc2626" delay={0} />
        <StatCard label="OSHA Recordable" value={oshaRecordable} icon={HardHat} color="#d97706" delay={0.1} />
        <StatCard label="Days Lost" value={daysLost} icon={Clock} color="#7c3aed" delay={0.2} />
        <StatCard label="Total Incidents" value={total} icon={CheckCircle2} color="#157070" delay={0.3} />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium">Incident Log</h3>
            <div className="flex items-center gap-1">
              {["all", "reported", "investigating", "corrective_action", "resolved"].map((s) => (
                <button key={s} type="button" onClick={() => setFilter(s)} className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${filter === s ? "bg-[#157070] text-white" : "text-muted-foreground hover:bg-muted"}`}>
                  {s === "all" ? "All" : s === "corrective_action" ? "Corrective" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setEditor({ open: true, incident: null })} className="flex items-center gap-1.5 rounded-md bg-[#157070] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#126060] transition-colors">
            <Plus className="size-3.5" /> Report Incident
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="size-6 animate-spin rounded-full border-2 border-[#157070] border-t-transparent" /></div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <HardHat className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No safety incidents</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Safety incidents will be logged here</p>
            <button type="button" onClick={() => setEditor({ open: true, incident: null })} className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#157070] px-4 py-2 text-xs font-medium text-white hover:bg-[#126060]">
              <Plus className="size-3.5" /> Report Incident
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-2.5">Incident #</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Location</th>
                  <th className="px-4 py-2.5">Severity</th>
                  <th className="px-4 py-2.5">OSHA</th>
                  <th className="px-4 py-2.5">Lost Time</th>
                  <th className="px-4 py-2.5 text-right">Days Lost</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((inc, i) => {
                  const sc = STATUS_CONFIG[inc.status] || { label: inc.status, color: "#6b7280", bg: "#f3f4f6" };
                  const sev = SEVERITY_CONFIG[inc.severity] || { label: inc.severity, color: "#6b7280", bg: "#f3f4f6" };
                  return (
                    <motion.tr key={inc.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }} className="border-b transition-colors last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{inc.incident_number}</td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{inc.type?.replace(/_/g, " ") || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{inc.incident_date || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{inc.location || "—"}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: sev.color, backgroundColor: sev.bg }}>{sev.label}</span></td>
                      <td className="px-4 py-3">{inc.osha_recordable ? <span className="text-xs font-medium text-red-600">Yes</span> : <span className="text-xs text-muted-foreground">No</span>}</td>
                      <td className="px-4 py-3">{inc.lost_time ? <span className="text-xs font-medium text-red-600">Yes</span> : <span className="text-xs text-muted-foreground">No</span>}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{inc.days_lost || "—"}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span></td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => setEditor({ open: true, incident: inc })} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black" onClick={() => setEditor({ open: false, incident: null })} />
            <IncidentEditor
              incident={editor.incident}
              onSave={handleSave}
              onClose={() => setEditor({ open: false, incident: null })}
              onDelete={editor.incident ? () => handleDelete(editor.incident!.id) : undefined}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

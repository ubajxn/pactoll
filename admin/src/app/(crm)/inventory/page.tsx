"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Container,
  Package,
  MapPin,
  AlertCircle,
  Weight,
  Plus,
  Pencil,
  X,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/crm/page-header";

const ORG_ID = "da62326b-707d-41bd-bc2d-a61a81926dae";

type Coil = {
  id: string;
  coil_tag: string;
  heat_number: string | null;
  mill: string | null;
  mill_cert_on_file: boolean;
  grade_description: string | null;
  gauge: number;
  width: number;
  net_weight: number | null;
  status: string;
  yard_location: string | null;
  surface_quality: string | null;
  edge_condition: string | null;
  temper: string | null;
  received_date: string | null;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  in_transit: { label: "In Transit", color: "#2563eb", bg: "#eff6ff" },
  received: { label: "Received", color: "#059669", bg: "#ecfdf5" },
  staged: { label: "Staged", color: "#7c3aed", bg: "#f5f3ff" },
  in_process: { label: "In Process", color: "#d97706", bg: "#fffbeb" },
  partial: { label: "Partial", color: "#ea580c", bg: "#fff7ed" },
  finished: { label: "Finished", color: "#157070", bg: "#e6f3f3" },
  shipped: { label: "Shipped", color: "#0891b2", bg: "#ecfeff" },
  scrapped: { label: "Scrapped", color: "#dc2626", bg: "#fef2f2" },
  returned: { label: "Returned", color: "#6b7280", bg: "#f3f4f6" },
  on_hold: { label: "On Hold", color: "#dc2626", bg: "#fef2f2" },
};

const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label }));

type CoilFormData = {
  coil_tag: string;
  heat_number: string;
  mill: string;
  mill_cert_on_file: boolean;
  grade_description: string;
  gauge: string;
  width: string;
  net_weight: string;
  status: string;
  yard_location: string;
  surface_quality: string;
  edge_condition: string;
  temper: string;
  received_date: string;
};

const EMPTY_FORM: CoilFormData = {
  coil_tag: "", heat_number: "", mill: "", mill_cert_on_file: false,
  grade_description: "", gauge: "", width: "", net_weight: "",
  status: "received", yard_location: "", surface_quality: "",
  edge_condition: "", temper: "", received_date: "",
};

function CoilEditor({ coil, onSave, onClose, onDelete }: {
  coil: Coil | null;
  onSave: (data: CoilFormData) => Promise<void>;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const isEdit = !!coil;
  const [form, setForm] = useState<CoilFormData>(() => {
    if (!coil) return EMPTY_FORM;
    return {
      coil_tag: coil.coil_tag,
      heat_number: coil.heat_number || "",
      mill: coil.mill || "",
      mill_cert_on_file: coil.mill_cert_on_file,
      grade_description: coil.grade_description || "",
      gauge: coil.gauge?.toString() || "",
      width: coil.width?.toString() || "",
      net_weight: coil.net_weight?.toString() || "",
      status: coil.status,
      yard_location: coil.yard_location || "",
      surface_quality: coil.surface_quality || "",
      edge_condition: coil.edge_condition || "",
      temper: coil.temper || "",
      received_date: coil.received_date || "",
    };
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"basics" | "specs" | "location">("basics");

  const handleSave = async () => {
    if (!form.coil_tag.trim()) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  const set = (key: keyof CoilFormData, val: unknown) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l bg-background shadow-2xl"
    >
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">{isEdit ? "Edit Coil" : "New Coil"}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{isEdit ? "Update coil details and location" : "Add a new coil to inventory"}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
      </div>

      <div className="flex gap-1 border-b px-5">
        {(["basics", "specs", "location"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${tab === t ? "border-[#157070] text-[#157070]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t === "basics" ? "Basics" : t === "specs" ? "Specs" : "Location & Tracking"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "basics" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Coil Tag *</label>
              <input value={form.coil_tag} onChange={(e) => set("coil_tag", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. C-2024-001" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Heat Number</label>
                <input value={form.heat_number} onChange={(e) => set("heat_number", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="Mill heat #" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Mill</label>
                <input value={form.mill} onChange={(e) => set("mill", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. Nucor, SDI" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]">
                  {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.mill_cert_on_file} onChange={(e) => set("mill_cert_on_file", e.target.checked)} className="rounded border-gray-300" />
                  <span className="text-muted-foreground">Mill cert on file</span>
                </label>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Grade Description</label>
              <input value={form.grade_description} onChange={(e) => set("grade_description", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. A36, CRS, HRPO" />
            </div>
          </div>
        )}

        {tab === "specs" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Gauge</label>
                <input value={form.gauge} onChange={(e) => set("gauge", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder='e.g. 0.075"' />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Width</label>
                <input value={form.width} onChange={(e) => set("width", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder='e.g. 48"' />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Net Weight (lbs)</label>
                <input value={form.net_weight} onChange={(e) => set("net_weight", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. 22000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Surface Quality</label>
                <input value={form.surface_quality} onChange={(e) => set("surface_quality", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. commercial, exposed" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Edge Condition</label>
                <input value={form.edge_condition} onChange={(e) => set("edge_condition", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. mill edge, slit edge" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Temper</label>
              <input value={form.temper} onChange={(e) => set("temper", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. T3, T4, dead soft" />
            </div>
          </div>
        )}

        {tab === "location" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Yard Location</label>
              <input value={form.yard_location} onChange={(e) => set("yard_location", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. Bay A-3, Rack B-12" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Received Date</label>
              <input type="date" value={form.received_date} onChange={(e) => set("received_date", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" />
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
          <button type="button" onClick={handleSave} disabled={saving || !form.coil_tag.trim()} className="rounded-md bg-[#157070] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#126060] disabled:opacity-50 transition-colors">
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Coil"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  delay,
  suffix,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  delay: number;
  suffix?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}18` }}>
          <Icon className="size-4" style={{ color }} />
        </div>
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: delay + 0.2 }}
        className="mt-2 text-2xl font-semibold tabular-nums tracking-tight"
      >
        {value}
        {suffix && <span className="ml-1 text-sm font-normal text-muted-foreground">{suffix}</span>}
      </motion.p>
    </motion.div>
  );
}

export default function InventoryPage() {
  const [coils, setCoils] = useState<Coil[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  const [editor, setEditor] = useState<{ open: boolean; coil: Coil | null }>({ open: false, coil: null });

  const loadData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ table: "erp_coils", org: ORG_ID });
    if (filter !== "all") params.set("status", filter);
    fetch(`/api/erp?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setCoils(d.data || []);
        setTotal(d.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (data: CoilFormData) => {
    const payload = {
      table: "erp_coils",
      org_id: ORG_ID,
      coil_tag: data.coil_tag,
      heat_number: data.heat_number || null,
      mill: data.mill || null,
      mill_cert_on_file: data.mill_cert_on_file,
      grade_description: data.grade_description || null,
      gauge: data.gauge ? Number(data.gauge) : 0,
      width: data.width ? Number(data.width) : 0,
      net_weight: data.net_weight ? Number(data.net_weight.replace(/,/g, "")) : null,
      status: data.status,
      yard_location: data.yard_location || null,
      surface_quality: data.surface_quality || null,
      edge_condition: data.edge_condition || null,
      temper: data.temper || null,
      received_date: data.received_date || null,
    };
    if (editor.coil) {
      await fetch("/api/erp", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: editor.coil.id }) });
    } else {
      await fetch("/api/erp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setEditor({ open: false, coil: null });
    loadData();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/erp?table=erp_coils&id=${id}&org=${ORG_ID}`, { method: "DELETE" });
    setEditor({ open: false, coil: null });
    loadData();
  };

  const inYard = coils.filter((c) => ["received", "staged", "in_process", "partial"].includes(c.status)).length;
  const totalWeight = coils.reduce((s, c) => s + (Number(c.net_weight) || 0), 0);
  const onHold = coils.filter((c) => c.status === "on_hold").length;

  return (
    <>
      <PageHeader title="Inventory" description="Coil tracking, materials, and yard locations" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Coils in Yard" value={inYard} icon={Container} color="#2563eb" delay={0} />
        <StatCard label="Total Weight" value={totalWeight > 0 ? totalWeight.toLocaleString() : "0"} icon={Weight} color="#059669" delay={0.1} suffix="lbs" />
        <StatCard label="On Hold" value={onHold} icon={AlertCircle} color="#dc2626" delay={0.2} />
        <StatCard label="Total Tracked" value={total} icon={Package} color="#157070" delay={0.3} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="rounded-lg border bg-card"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium">Coil Inventory</h3>
            <div className="flex items-center gap-1">
              {["all", "received", "staged", "in_process", "finished", "on_hold"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilter(s)}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                    filter === s ? "bg-[#157070] text-white" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {s === "all" ? "All" : s === "in_process" ? "Processing" : s === "on_hold" ? "Hold" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setEditor({ open: true, coil: null })} className="flex items-center gap-1.5 rounded-md bg-[#157070] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#126060] transition-colors">
            <Plus className="size-3.5" /> Add Coil
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="size-6 animate-spin rounded-full border-2 border-[#157070] border-t-transparent" />
          </div>
        ) : coils.length === 0 ? (
          <div className="py-20 text-center">
            <Container className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No coils tracked yet</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Coils will appear as material is received</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-2.5">Coil Tag</th>
                  <th className="px-4 py-2.5">Heat #</th>
                  <th className="px-4 py-2.5">Grade</th>
                  <th className="px-4 py-2.5">Gauge</th>
                  <th className="px-4 py-2.5">Width</th>
                  <th className="px-4 py-2.5 text-right">Weight</th>
                  <th className="px-4 py-2.5">Location</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Mill Cert</th>
                  <th className="px-4 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {coils.map((coil, i) => {
                  const sc = STATUS_CONFIG[coil.status] || { label: coil.status, color: "#6b7280", bg: "#f3f4f6" };
                  return (
                    <motion.tr
                      key={coil.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.03 }}
                      className="border-b transition-colors last:border-0 hover:bg-muted/50"
                    >
                      <td className="px-4 py-3 font-medium">{coil.coil_tag}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{coil.heat_number || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{coil.grade_description || "—"}</td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">{coil.gauge}&quot;</td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">{coil.width}&quot;</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {coil.net_weight ? Number(coil.net_weight).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {coil.yard_location ? (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" />
                            {coil.yard_location}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: sc.color, backgroundColor: sc.bg }}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {coil.mill_cert_on_file ? (
                          <span className="text-xs text-emerald-600">On file</span>
                        ) : (
                          <span className="text-xs text-red-500">Missing</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => setEditor({ open: true, coil })} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black" onClick={() => setEditor({ open: false, coil: null })} />
            <CoilEditor
              coil={editor.coil}
              onSave={handleSave}
              onClose={() => setEditor({ open: false, coil: null })}
              onDelete={editor.coil ? () => handleDelete(editor.coil!.id) : undefined}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

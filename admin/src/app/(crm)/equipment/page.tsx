"use client";

import { useCallback, useEffect, useState } from "react";
import { Factory, Wrench, AlertOctagon, CheckCircle2, Plus, Pencil, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/crm/page-header";

const ORG_ID = "da62326b-707d-41bd-bc2d-a61a81926dae";

type Equipment = {
  id: string;
  code: string;
  name: string;
  type: string;
  manufacturer: string | null;
  model: string | null;
  max_gauge: number | null;
  max_width: number | null;
  max_weight: number | null;
  speed_fpm: number | null;
  status: string;
  location: string | null;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  operational: { label: "Operational", color: "#059669", bg: "#ecfdf5" },
  maintenance: { label: "Maintenance", color: "#d97706", bg: "#fffbeb" },
  down: { label: "Down", color: "#dc2626", bg: "#fef2f2" },
  decommissioned: { label: "Decommissioned", color: "#6b7280", bg: "#f3f4f6" },
};

const TYPE_LABELS: Record<string, string> = {
  blanking_line: "Blanking Line",
  slitter: "Slitter",
  leveler: "Leveler",
  shear: "Shear",
  press: "Press",
  crane: "Crane",
  forklift: "Forklift",
  truck: "Truck",
  trailer: "Trailer",
  compressor: "Compressor",
  welder: "Welder",
  grinder: "Grinder",
  scale: "Scale",
  other: "Other",
};

function StatCard({ label, value, icon: Icon, color, delay }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string; delay: number }) {
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

type EquipmentFormData = {
  code: string;
  name: string;
  type: string;
  status: string;
  location: string;
  manufacturer: string;
  model: string;
  max_gauge: string;
  max_width: string;
  max_weight: string;
  speed_fpm: string;
};

const EMPTY_FORM: EquipmentFormData = {
  code: "", name: "", type: "blanking_line", status: "operational",
  location: "", manufacturer: "", model: "",
  max_gauge: "", max_width: "", max_weight: "", speed_fpm: "",
};

function EquipmentEditor({ equipment, onSave, onClose, onDelete }: {
  equipment: Equipment | null;
  onSave: (data: EquipmentFormData) => Promise<void>;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const isEdit = !!equipment;
  const [form, setForm] = useState<EquipmentFormData>(() => {
    if (!equipment) return EMPTY_FORM;
    return {
      code: equipment.code,
      name: equipment.name,
      type: equipment.type,
      status: equipment.status,
      location: equipment.location || "",
      manufacturer: equipment.manufacturer || "",
      model: equipment.model || "",
      max_gauge: equipment.max_gauge?.toString() || "",
      max_width: equipment.max_width?.toString() || "",
      max_weight: equipment.max_weight?.toString() || "",
      speed_fpm: equipment.speed_fpm?.toString() || "",
    };
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"basics" | "specs">("basics");

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  const set = (key: keyof EquipmentFormData, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l bg-background shadow-2xl"
    >
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">{isEdit ? "Edit Equipment" : "New Equipment"}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{isEdit ? "Update equipment details and specs" : "Register a new piece of equipment"}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
      </div>

      <div className="flex gap-1 border-b px-5">
        {(["basics", "specs"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${tab === t ? "border-[#157070] text-[#157070]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t === "basics" ? "Basics" : "Specs"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "basics" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Equipment Code *</label>
                <input value={form.code} onChange={(e) => set("code", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. BL-001" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Name *</label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. Blanking Line #1" />
              </div>
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
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Location</label>
              <input value={form.location} onChange={(e) => set("location", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. Bay 3, Carson Plant" />
            </div>
          </div>
        )}

        {tab === "specs" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Manufacturer</label>
                <input value={form.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. Red Bud Industries" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Model</label>
                <input value={form.model} onChange={(e) => set("model", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. RB-72-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Max Gauge (in)</label>
                <input value={form.max_gauge} onChange={(e) => set("max_gauge", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. 0.5" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Max Width (in)</label>
                <input value={form.max_width} onChange={(e) => set("max_width", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. 72" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Max Weight (lbs)</label>
                <input value={form.max_weight} onChange={(e) => set("max_weight", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. 60000" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Speed (fpm)</label>
                <input value={form.speed_fpm} onChange={(e) => set("speed_fpm", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. 200" />
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
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Equipment"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function EquipmentPage() {
  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  const [editor, setEditor] = useState<{ open: boolean; equipment: Equipment | null }>({ open: false, equipment: null });

  const loadData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ table: "erp_equipment", org: ORG_ID });
    if (filter !== "all") params.set("status", filter);
    fetch(`/api/erp?${params}`)
      .then((r) => r.json())
      .then((d) => { setItems(d.data || []); setTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (data: EquipmentFormData) => {
    const payload = {
      table: "erp_equipment",
      org_id: ORG_ID,
      code: data.code,
      name: data.name,
      type: data.type,
      status: data.status,
      location: data.location || null,
      manufacturer: data.manufacturer || null,
      model: data.model || null,
      max_gauge: data.max_gauge ? Number(data.max_gauge) : null,
      max_width: data.max_width ? Number(data.max_width) : null,
      max_weight: data.max_weight ? Number(data.max_weight.replace(/,/g, "")) : null,
      speed_fpm: data.speed_fpm ? Number(data.speed_fpm) : null,
    };
    if (editor.equipment) {
      await fetch("/api/erp", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: editor.equipment.id }) });
    } else {
      await fetch("/api/erp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setEditor({ open: false, equipment: null });
    loadData();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/erp?table=erp_equipment&id=${id}&org=${ORG_ID}`, { method: "DELETE" });
    setEditor({ open: false, equipment: null });
    loadData();
  };

  const operational = items.filter((e) => e.status === "operational").length;
  const maintenance = items.filter((e) => e.status === "maintenance").length;
  const down = items.filter((e) => e.status === "down").length;

  return (
    <>
      <PageHeader title="Equipment" description="Blanking lines, slitters, levelers, and maintenance" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Operational" value={operational} icon={CheckCircle2} color="#059669" delay={0} />
        <StatCard label="Maintenance" value={maintenance} icon={Wrench} color="#d97706" delay={0.1} />
        <StatCard label="Down" value={down} icon={AlertOctagon} color="#dc2626" delay={0.2} />
        <StatCard label="Total Equipment" value={total} icon={Factory} color="#157070" delay={0.3} />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium">Equipment Registry</h3>
            <div className="flex items-center gap-1">
              {["all", "operational", "maintenance", "down"].map((s) => (
                <button key={s} type="button" onClick={() => setFilter(s)} className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${filter === s ? "bg-[#157070] text-white" : "text-muted-foreground hover:bg-muted"}`}>
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setEditor({ open: true, equipment: null })} className="flex items-center gap-1.5 rounded-md bg-[#157070] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#126060] transition-colors">
            <Plus className="size-3.5" /> Add Equipment
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="size-6 animate-spin rounded-full border-2 border-[#157070] border-t-transparent" /></div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <Factory className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No equipment registered</p>
            <button type="button" onClick={() => setEditor({ open: true, equipment: null })} className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#157070] px-4 py-2 text-xs font-medium text-white hover:bg-[#126060]">
              <Plus className="size-3.5" /> Register Equipment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-2.5">Code</th>
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Manufacturer</th>
                  <th className="px-4 py-2.5 text-right">Max Gauge</th>
                  <th className="px-4 py-2.5 text-right">Max Width</th>
                  <th className="px-4 py-2.5 text-right">Max Weight</th>
                  <th className="px-4 py-2.5 text-right">Speed (fpm)</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((eq, i) => {
                  const sc = STATUS_CONFIG[eq.status] || { label: eq.status, color: "#6b7280", bg: "#f3f4f6" };
                  return (
                    <motion.tr key={eq.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }} className="border-b transition-colors last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono text-xs font-medium">{eq.code}</td>
                      <td className="px-4 py-3 font-medium">{eq.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{TYPE_LABELS[eq.type] || eq.type}</td>
                      <td className="px-4 py-3 text-muted-foreground">{eq.manufacturer || "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{eq.max_gauge ? `${eq.max_gauge}"` : "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{eq.max_width ? `${eq.max_width}"` : "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{eq.max_weight ? `${Number(eq.max_weight).toLocaleString()} lbs` : "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{eq.speed_fpm || "—"}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span></td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => setEditor({ open: true, equipment: eq })} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black" onClick={() => setEditor({ open: false, equipment: null })} />
            <EquipmentEditor
              equipment={editor.equipment}
              onSave={handleSave}
              onClose={() => setEditor({ open: false, equipment: null })}
              onDelete={editor.equipment ? () => handleDelete(editor.equipment!.id) : undefined}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

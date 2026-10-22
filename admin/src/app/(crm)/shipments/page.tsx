"use client";

import { useCallback, useEffect, useState } from "react";
import { Truck, Package, Clock, CheckCircle2, Plus, Pencil, X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/crm/page-header";

const ORG_ID = "da62326b-707d-41bd-bc2d-a61a81926dae";

type Shipment = {
  id: string;
  shipment_number: string;
  direction: string;
  bol_number: string | null;
  pro_number: string | null;
  origin_city: string | null;
  origin_state: string | null;
  destination_city: string | null;
  destination_state: string | null;
  pickup_date: string | null;
  delivery_date: string | null;
  weight: number | null;
  coil_count: number | null;
  total_charge: number | null;
  status: string;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  planned: { label: "Planned", color: "#6b7280", bg: "#f3f4f6" },
  dispatched: { label: "Dispatched", color: "#7c3aed", bg: "#f5f3ff" },
  in_transit: { label: "In Transit", color: "#2563eb", bg: "#eff6ff" },
  at_pickup: { label: "At Pickup", color: "#d97706", bg: "#fffbeb" },
  at_delivery: { label: "At Delivery", color: "#d97706", bg: "#fffbeb" },
  delivered: { label: "Delivered", color: "#059669", bg: "#ecfdf5" },
  pod_received: { label: "POD Received", color: "#157070", bg: "#e6f3f3" },
  invoiced: { label: "Invoiced", color: "#157070", bg: "#e6f3f3" },
  complete: { label: "Complete", color: "#059669", bg: "#ecfdf5" },
  cancelled: { label: "Cancelled", color: "#9ca3af", bg: "#f9fafb" },
};

const DIRECTION_OPTIONS = [
  { value: "inbound", label: "Inbound" },
  { value: "outbound", label: "Outbound" },
  { value: "transfer", label: "Transfer" },
];

const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label }));

type ShipmentFormData = {
  shipment_number: string;
  direction: string;
  status: string;
  bol_number: string;
  pro_number: string;
  origin_city: string;
  origin_state: string;
  destination_city: string;
  destination_state: string;
  pickup_date: string;
  delivery_date: string;
  weight: string;
  coil_count: string;
  total_charge: string;
};

const EMPTY_FORM: ShipmentFormData = {
  shipment_number: "", direction: "outbound", status: "planned",
  bol_number: "", pro_number: "",
  origin_city: "", origin_state: "", destination_city: "", destination_state: "",
  pickup_date: "", delivery_date: "",
  weight: "", coil_count: "", total_charge: "",
};

function ShipmentEditor({ shipment, onSave, onClose, onDelete }: {
  shipment: Shipment | null;
  onSave: (data: ShipmentFormData) => Promise<void>;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const isEdit = !!shipment;
  const [form, setForm] = useState<ShipmentFormData>(() => {
    if (!shipment) return EMPTY_FORM;
    return {
      shipment_number: shipment.shipment_number,
      direction: shipment.direction,
      status: shipment.status,
      bol_number: shipment.bol_number || "",
      pro_number: shipment.pro_number || "",
      origin_city: shipment.origin_city || "",
      origin_state: shipment.origin_state || "",
      destination_city: shipment.destination_city || "",
      destination_state: shipment.destination_state || "",
      pickup_date: shipment.pickup_date || "",
      delivery_date: shipment.delivery_date || "",
      weight: shipment.weight?.toString() || "",
      coil_count: shipment.coil_count?.toString() || "",
      total_charge: shipment.total_charge?.toString() || "",
    };
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"basics" | "logistics" | "details">("basics");

  const handleSave = async () => {
    if (!form.shipment_number.trim()) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  const set = (key: keyof ShipmentFormData, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l bg-background shadow-2xl"
    >
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">{isEdit ? "Edit Shipment" : "New Shipment"}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{isEdit ? "Update shipment details" : "Create a new shipment record"}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
      </div>

      <div className="flex gap-1 border-b px-5">
        {(["basics", "logistics", "details"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${tab === t ? "border-[#157070] text-[#157070]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t === "basics" ? "Basics" : t === "logistics" ? "Logistics" : "Details"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "basics" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Shipment Number *</label>
              <input value={form.shipment_number} onChange={(e) => set("shipment_number", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. SHP-001" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Direction</label>
                <select value={form.direction} onChange={(e) => set("direction", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]">
                  {DIRECTION_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
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
                <label className="mb-1 block text-xs font-medium text-muted-foreground">BOL Number</label>
                <input value={form.bol_number} onChange={(e) => set("bol_number", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="Bill of Lading #" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">PRO Number</label>
                <input value={form.pro_number} onChange={(e) => set("pro_number", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="Carrier PRO #" />
              </div>
            </div>
          </div>
        )}

        {tab === "logistics" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Origin</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-0.5 block text-[10px] text-muted-foreground">City</label>
                  <input value={form.origin_city} onChange={(e) => set("origin_city", e.target.value)} className="w-full rounded border bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#157070]" placeholder="Carson" />
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-muted-foreground">State</label>
                  <input value={form.origin_state} onChange={(e) => set("origin_state", e.target.value)} className="w-full rounded border bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#157070]" placeholder="CA" />
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-dashed p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Destination</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-0.5 block text-[10px] text-muted-foreground">City</label>
                  <input value={form.destination_city} onChange={(e) => set("destination_city", e.target.value)} className="w-full rounded border bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#157070]" placeholder="Phoenix" />
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-muted-foreground">State</label>
                  <input value={form.destination_state} onChange={(e) => set("destination_state", e.target.value)} className="w-full rounded border bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#157070]" placeholder="AZ" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Pickup Date</label>
                <input type="date" value={form.pickup_date} onChange={(e) => set("pickup_date", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Delivery Date</label>
                <input type="date" value={form.delivery_date} onChange={(e) => set("delivery_date", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" />
              </div>
            </div>
          </div>
        )}

        {tab === "details" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Weight (lbs)</label>
                <input value={form.weight} onChange={(e) => set("weight", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. 42000" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Coil Count</label>
                <input value={form.coil_count} onChange={(e) => set("coil_count", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. 4" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Total Charges</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input value={form.total_charge} onChange={(e) => set("total_charge", e.target.value)} className="w-full rounded-md border bg-background py-2 pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="1,200" />
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
          <button type="button" onClick={handleSave} disabled={saving || !form.shipment_number.trim()} className="rounded-md bg-[#157070] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#126060] disabled:opacity-50 transition-colors">
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Shipment"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, icon: Icon, color, delay }: { label: string; value: number; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string; delay: number }) {
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

export default function ShipmentsPage() {
  const [items, setItems] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  const [editor, setEditor] = useState<{ open: boolean; shipment: Shipment | null }>({ open: false, shipment: null });

  const loadData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ table: "erp_shipments", org: ORG_ID });
    if (filter !== "all") params.set("status", filter);
    fetch(`/api/erp?${params}`)
      .then((r) => r.json())
      .then((d) => { setItems(d.data || []); setTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (data: ShipmentFormData) => {
    const payload = {
      table: "erp_shipments",
      org_id: ORG_ID,
      shipment_number: data.shipment_number,
      direction: data.direction,
      status: data.status,
      bol_number: data.bol_number || null,
      pro_number: data.pro_number || null,
      origin_city: data.origin_city || null,
      origin_state: data.origin_state || null,
      destination_city: data.destination_city || null,
      destination_state: data.destination_state || null,
      pickup_date: data.pickup_date || null,
      delivery_date: data.delivery_date || null,
      weight: data.weight ? Number(data.weight.replace(/,/g, "")) : null,
      coil_count: data.coil_count ? Number(data.coil_count) : null,
      total_charge: data.total_charge ? Number(data.total_charge.replace(/,/g, "")) : null,
    };
    if (editor.shipment) {
      await fetch("/api/erp", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: editor.shipment.id }) });
    } else {
      await fetch("/api/erp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setEditor({ open: false, shipment: null });
    loadData();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/erp?table=erp_shipments&id=${id}&org=${ORG_ID}`, { method: "DELETE" });
    setEditor({ open: false, shipment: null });
    loadData();
  };

  const inTransit = items.filter((s) => ["in_transit", "dispatched", "at_pickup", "at_delivery"].includes(s.status)).length;
  const delivered = items.filter((s) => ["delivered", "pod_received", "complete"].includes(s.status)).length;
  const planned = items.filter((s) => s.status === "planned").length;

  return (
    <>
      <PageHeader title="Shipments" description="Inbound and outbound logistics, BOLs, and carriers" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="In Transit" value={inTransit} icon={Truck} color="#2563eb" delay={0} />
        <StatCard label="Delivered" value={delivered} icon={CheckCircle2} color="#059669" delay={0.1} />
        <StatCard label="Planned" value={planned} icon={Clock} color="#7c3aed" delay={0.2} />
        <StatCard label="Total Shipments" value={total} icon={Package} color="#157070" delay={0.3} />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium">Shipment Log</h3>
            <div className="flex items-center gap-1">
              {["all", "planned", "in_transit", "delivered", "complete"].map((s) => (
                <button key={s} type="button" onClick={() => setFilter(s)} className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${filter === s ? "bg-[#157070] text-white" : "text-muted-foreground hover:bg-muted"}`}>
                  {s === "all" ? "All" : s === "in_transit" ? "In Transit" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setEditor({ open: true, shipment: null })} className="flex items-center gap-1.5 rounded-md bg-[#157070] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#126060] transition-colors">
            <Plus className="size-3.5" /> Add Shipment
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="size-6 animate-spin rounded-full border-2 border-[#157070] border-t-transparent" /></div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <Truck className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No shipments yet</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Shipments will appear as loads are scheduled</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-2.5">Shipment #</th>
                  <th className="px-4 py-2.5">Direction</th>
                  <th className="px-4 py-2.5">BOL #</th>
                  <th className="px-4 py-2.5">Origin</th>
                  <th className="px-4 py-2.5">Destination</th>
                  <th className="px-4 py-2.5 text-right">Weight</th>
                  <th className="px-4 py-2.5 text-right">Charges</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((sh, i) => {
                  const sc = STATUS_CONFIG[sh.status] || { label: sh.status, color: "#6b7280", bg: "#f3f4f6" };
                  const dirColor = sh.direction === "inbound" ? { color: "#2563eb", bg: "#eff6ff" } : sh.direction === "outbound" ? { color: "#059669", bg: "#ecfdf5" } : { color: "#7c3aed", bg: "#f5f3ff" };
                  return (
                    <motion.tr key={sh.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }} className="border-b transition-colors last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{sh.shipment_number}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize" style={{ color: dirColor.color, backgroundColor: dirColor.bg }}>{sh.direction}</span></td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{sh.bol_number || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{sh.origin_city && sh.origin_state ? `${sh.origin_city}, ${sh.origin_state}` : "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{sh.destination_city && sh.destination_state ? `${sh.destination_city}, ${sh.destination_state}` : "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{sh.weight ? `${Number(sh.weight).toLocaleString()} lbs` : "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{sh.total_charge ? `$${Number(sh.total_charge).toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span></td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => setEditor({ open: true, shipment: sh })} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black" onClick={() => setEditor({ open: false, shipment: null })} />
            <ShipmentEditor
              shipment={editor.shipment}
              onSave={handleSave}
              onClose={() => setEditor({ open: false, shipment: null })}
              onDelete={editor.shipment ? () => handleDelete(editor.shipment!.id) : undefined}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

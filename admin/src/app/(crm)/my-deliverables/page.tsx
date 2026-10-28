"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Briefcase,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Code,
  Globe,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/crm/page-header";
import { PermissionGate } from "@/components/crm/permission-gate";

const ORG_ID = "da62326b-707d-41bd-bc2d-a61a81926dae";

type Deliverable = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  delivered_date: string | null;
  hours: number | null;
  value: number | null;
  invoice_number: string | null;
  notes: string | null;
  created_at: string;
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Globe; color: string; bg: string }> = {
  website: { label: "Website", icon: Globe, color: "#2563eb", bg: "#eff6ff" },
  crm: { label: "CRM/ERP", icon: Code, color: "#8b5cf6", bg: "#f5f3ff" },
  digital: { label: "Digital Presence", icon: Megaphone, color: "#059669", bg: "#ecfdf5" },
  strategy: { label: "Strategy", icon: Briefcase, color: "#d97706", bg: "#fffbeb" },
  other: { label: "Other", icon: Clock, color: "#71717a", bg: "#f4f4f5" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  delivered: { label: "Delivered", color: "#059669", bg: "#ecfdf5" },
  in_progress: { label: "In Progress", color: "#2563eb", bg: "#eff6ff" },
  planned: { label: "Planned", color: "#d97706", bg: "#fffbeb" },
};

type FormData = {
  title: string;
  description: string;
  category: string;
  status: string;
  delivered_date: string;
  hours: string;
  value: string;
  invoice_number: string;
  notes: string;
};

const emptyForm: FormData = {
  title: "",
  description: "",
  category: "website",
  status: "delivered",
  delivered_date: "",
  hours: "",
  value: "",
  invoice_number: "",
  notes: "",
};

export default function MyDeliverablesPage() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Deliverable | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/erp?table=erp_consultant_deliverables&org=${ORG_ID}&limit=200&order_by=created_at&order_dir=desc`);
      const data = await res.json();
      setDeliverables(data.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = deliverables
    .filter(d => filter === "all" || d.category === filter)
    .filter(d => statusFilter === "all" || d.status === statusFilter);

  const delivered = deliverables.filter(d => d.status === "delivered").length;
  const planned = deliverables.filter(d => d.status === "planned").length;
  const inProgress = deliverables.filter(d => d.status === "in_progress").length;

  const openCreate = () => {
    setForm(emptyForm);
    setCreating(true);
    setEditing(null);
  };

  const openEdit = (d: Deliverable) => {
    setForm({
      title: d.title,
      description: d.description || "",
      category: d.category,
      status: d.status,
      delivered_date: d.delivered_date?.slice(0, 10) || "",
      hours: d.hours ? String(d.hours) : "",
      value: d.value ? String(d.value) : "",
      invoice_number: d.invoice_number || "",
      notes: d.notes || "",
    });
    setEditing(d);
    setCreating(false);
  };

  const closePanel = () => { setEditing(null); setCreating(false); };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        table: "erp_consultant_deliverables",
        org_id: ORG_ID,
        title: form.title,
        description: form.description || null,
        category: form.category,
        status: form.status,
        delivered_date: form.delivered_date || null,
        hours: form.hours ? Number(form.hours) : null,
        value: form.value ? Number(form.value) : null,
        invoice_number: form.invoice_number || null,
        notes: form.notes || null,
        ...(editing ? { id: editing.id } : {}),
      };
      await fetch("/api/erp", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await fetchData();
      closePanel();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    await fetch(`/api/erp?table=erp_consultant_deliverables&id=${id}&org=${ORG_ID}`, { method: "DELETE" });
    await fetchData();
    closePanel();
  };

  const panelOpen = creating || !!editing;

  const groupedByCategory = Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => ({
    key,
    ...cfg,
    items: filtered.filter(d => d.category === key),
  })).filter(g => g.items.length > 0);

  return (
    <PermissionGate module="my-deliverables">
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 48px" }}>
        <PageHeader
          title="My Deliverables"
          description="Everything delivered and planned for this engagement"
        />

        {/* Stats Bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Total", value: String(deliverables.length), color: "#0f172a" },
            { label: "Delivered", value: String(delivered), color: "#059669" },
            { label: "In Progress", value: String(inProgress), color: "#2563eb" },
            { label: "Planned", value: String(planned), color: "#d97706" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ fontSize: 12, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14 }}
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14 }}
          >
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <button
            onClick={openCreate}
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: "#2563eb",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            <Plus size={16} /> Add Deliverable
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 64, color: "#71717a" }}>
            <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {groupedByCategory.map(group => {
              const Icon = group.icon;
              return (
                <div key={group.key}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <Icon size={18} style={{ color: group.color }} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: group.color }}>{group.label}</span>
                    <span style={{ fontSize: 12, color: "#71717a" }}>({group.items.length})</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {group.items.map(d => {
                      const sc = STATUS_CONFIG[d.status] || STATUS_CONFIG.delivered;
                      return (
                        <div
                          key={d.id}
                          onClick={() => openEdit(d)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "12px 16px",
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: 10,
                            cursor: "pointer",
                            transition: "box-shadow 0.15s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)")}
                          onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                        >
                          <div style={{
                            width: 8, height: 8, borderRadius: 99, background: sc.color, flexShrink: 0,
                          }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{d.title}</div>
                            {d.description && <div style={{ fontSize: 12, color: "#71717a", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.description}</div>}
                          </div>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                            background: sc.bg, color: sc.color, textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0,
                          }}>
                            {sc.label}
                          </span>
                          {d.invoice_number && (
                            <span style={{ fontSize: 11, color: "#71717a", flexShrink: 0 }}>
                              {d.invoice_number}
                            </span>
                          )}
                          {d.delivered_date && (
                            <span style={{ fontSize: 11, color: "#a1a1aa", flexShrink: 0 }}>
                              {new Date(d.delivered_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {groupedByCategory.length === 0 && (
              <div style={{ textAlign: "center", padding: 64, color: "#71717a" }}>No deliverables match filters</div>
            )}
          </div>
        )}

        {/* Editor Panel */}
        <AnimatePresence>
          {panelOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }}
                onClick={closePanel}
                style={{ position: "fixed", inset: 0, background: "#000", zIndex: 40, cursor: "pointer" }}
              />
              <motion.div
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 250 }}
                style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 480, maxWidth: "100vw", background: "#fff", zIndex: 50, display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(0,0,0,0.08)" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700 }}>{editing ? "Edit Deliverable" : "New Deliverable"}</h2>
                  <button onClick={closePanel} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                    <X size={20} />
                  </button>
                </div>
                <div style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" }}>Title</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" }}>Description</label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      rows={3}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, resize: "vertical" }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" }}>Category</label>
                      <select
                        value={form.category}
                        onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14 }}
                      >
                        {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" }}>Status</label>
                      <select
                        value={form.status}
                        onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14 }}
                      >
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {[
                    { label: "Delivered Date", key: "delivered_date" as const, type: "date" },
                    { label: "Hours", key: "hours" as const, type: "number" },
                    { label: "Value ($)", key: "value" as const, type: "number" },
                    { label: "Invoice #", key: "invoice_number" as const },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" }}>{f.label}</label>
                      <input
                        type={f.type || "text"}
                        value={form[f.key]}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14 }}
                      />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" }}>Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                      rows={3}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, resize: "vertical" }}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, padding: "16px 20px", borderTop: "1px solid #e5e7eb" }}>
                  {editing && (
                    <button
                      onClick={() => deleteItem(editing.id)}
                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 16px", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontSize: 14, cursor: "pointer" }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  )}
                  <div style={{ flex: 1 }} />
                  <button onClick={closePanel} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", fontSize: 14, cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button
                    onClick={save}
                    disabled={saving}
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 16px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", opacity: saving ? 0.6 : 1 }}
                  >
                    {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={14} />}
                    {editing ? "Update" : "Create"}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </PermissionGate>
  );
}

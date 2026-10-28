"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/crm/page-header";
import { PermissionGate } from "@/components/crm/permission-gate";

const ORG_ID = "da62326b-707d-41bd-bc2d-a61a81926dae";

type Invoice = {
  id: string;
  invoice_number: string;
  client_name: string;
  description: string | null;
  amount: number;
  status: string;
  issue_date: string | null;
  due_date: string | null;
  paid_date: string | null;
  line_items: { description: string; amount: number }[];
  notes: string | null;
  public_url: string | null;
  created_at: string;
};

type Retainer = {
  id: string;
  month: string;
  amount: number;
  status: string;
  scope_items: string[];
  hours_used: number;
  hours_included: number;
  notes: string | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "#71717a", bg: "#f4f4f5" },
  sent: { label: "Sent", color: "#2563eb", bg: "#eff6ff" },
  paid: { label: "Paid", color: "#059669", bg: "#ecfdf5" },
  overdue: { label: "Overdue", color: "#dc2626", bg: "#fef2f2" },
  cancelled: { label: "Cancelled", color: "#71717a", bg: "#f4f4f5" },
};

type FormData = {
  invoice_number: string;
  client_name: string;
  description: string;
  amount: string;
  status: string;
  issue_date: string;
  due_date: string;
  paid_date: string;
  notes: string;
  public_url: string;
  line_items: { description: string; amount: number }[];
};

const emptyForm: FormData = {
  invoice_number: "",
  client_name: "Pacific Toll Processing",
  description: "",
  amount: "",
  status: "draft",
  issue_date: "",
  due_date: "",
  paid_date: "",
  notes: "",
  public_url: "",
  line_items: [],
};

export default function MyInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [retainers, setRetainers] = useState<Retainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [tab, setTab] = useState<"invoices" | "retainer">("invoices");

  const fetchData = useCallback(async () => {
    try {
      const [invRes, retRes] = await Promise.all([
        fetch(`/api/erp?table=erp_consultant_invoices&org=${ORG_ID}&order_by=issue_date&order_dir=desc`),
        fetch(`/api/erp?table=erp_consultant_retainer&org=${ORG_ID}&order_by=month&order_dir=desc`),
      ]);
      const invData = await invRes.json();
      const retData = await retRes.json();
      setInvoices(invData.data || []);
      setRetainers(retData.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalBilled = invoices.reduce((s, i) => s + Number(i.amount), 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0);
  const totalOutstanding = invoices.filter(i => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + Number(i.amount), 0);

  const openCreate = () => {
    setForm(emptyForm);
    setCreating(true);
    setEditing(null);
  };

  const openEdit = (inv: Invoice) => {
    setForm({
      invoice_number: inv.invoice_number,
      client_name: inv.client_name,
      description: inv.description || "",
      amount: String(inv.amount),
      status: inv.status,
      issue_date: inv.issue_date?.slice(0, 10) || "",
      due_date: inv.due_date?.slice(0, 10) || "",
      paid_date: inv.paid_date?.slice(0, 10) || "",
      notes: inv.notes || "",
      public_url: inv.public_url || "",
      line_items: inv.line_items || [],
    });
    setEditing(inv);
    setCreating(false);
  };

  const closePanel = () => { setEditing(null); setCreating(false); };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        table: "erp_consultant_invoices",
        org_id: ORG_ID,
        invoice_number: form.invoice_number,
        client_name: form.client_name,
        description: form.description || null,
        amount: Number(form.amount) || 0,
        status: form.status,
        issue_date: form.issue_date || null,
        due_date: form.due_date || null,
        paid_date: form.paid_date || null,
        notes: form.notes || null,
        public_url: form.public_url || null,
        line_items: JSON.stringify(form.line_items),
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

  const deleteInvoice = async (id: string) => {
    await fetch(`/api/erp?table=erp_consultant_invoices&id=${id}&org=${ORG_ID}`, { method: "DELETE" });
    await fetchData();
    closePanel();
  };

  const panelOpen = creating || !!editing;

  return (
    <PermissionGate module="my-invoices">
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 48px" }}>
        <PageHeader
          title="My Invoices"
          description="Consulting invoices, payments, and retainer tracking"
        />

        {/* Stats Bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Total Billed", value: `$${totalBilled.toLocaleString()}`, color: "#2563eb" },
            { label: "Paid", value: `$${totalPaid.toLocaleString()}`, color: "#059669" },
            { label: "Outstanding", value: `$${totalOutstanding.toLocaleString()}`, color: totalOutstanding > 0 ? "#d97706" : "#71717a" },
            { label: "Invoices", value: String(invoices.length), color: "#71717a" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ fontSize: 12, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tab Bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {(["invoices", "retainer"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                border: "none",
                background: tab === t ? "#0f172a" : "#f4f4f5",
                color: tab === t ? "#fff" : "#71717a",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {t === "invoices" ? "Invoices" : "Retainer Scope"}
            </button>
          ))}
          {tab === "invoices" && (
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
              <Plus size={16} /> New Invoice
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 64, color: "#71717a" }}>
            <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : tab === "invoices" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {invoices.length === 0 ? (
              <div style={{ textAlign: "center", padding: 64, color: "#71717a" }}>No invoices yet</div>
            ) : invoices.map(inv => {
              const expanded = expandedInvoice === inv.id;
              const sc = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
              return (
                <div key={inv.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", padding: "16px 20px", gap: 16, cursor: "pointer" }}
                    onClick={() => setExpandedInvoice(expanded ? null : inv.id)}
                  >
                    <CircleDollarSign size={20} style={{ color: sc.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{inv.invoice_number}</span>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 99,
                          background: sc.bg,
                          color: sc.color,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}>
                          {sc.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: "#71717a", marginTop: 2 }}>{inv.description}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 18 }}>${Number(inv.amount).toLocaleString()}</div>
                      {inv.issue_date && <div style={{ fontSize: 12, color: "#71717a" }}>{new Date(inv.issue_date).toLocaleDateString()}</div>}
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div style={{ padding: "0 20px 16px", borderTop: "1px solid #f4f4f5" }}>
                          {inv.line_items && inv.line_items.length > 0 && (
                            <div style={{ marginTop: 12 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Line Items</div>
                              {inv.line_items.map((li, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f9fafb", fontSize: 13 }}>
                                  <span>{li.description}</span>
                                  <span style={{ fontWeight: 600 }}>${li.amount.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); openEdit(inv); }}
                              style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", fontSize: 13, cursor: "pointer" }}
                            >
                              <Pencil size={14} /> Edit
                            </button>
                            {inv.public_url && (
                              <a
                                href={inv.public_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", fontSize: 13, textDecoration: "none", color: "inherit", cursor: "pointer" }}
                              >
                                <ExternalLink size={14} /> View Public
                              </a>
                            )}
                            {inv.due_date && (
                              <div style={{ marginLeft: "auto", fontSize: 12, color: "#71717a", display: "flex", alignItems: "center", gap: 4 }}>
                                <Clock size={14} />
                                Due {new Date(inv.due_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {retainers.length === 0 ? (
              <div style={{ textAlign: "center", padding: 64, color: "#71717a" }}>No retainer records yet</div>
            ) : retainers.map(ret => (
              <div key={ret.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{ret.month}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, marginLeft: 8,
                      background: ret.status === "paid" ? "#ecfdf5" : ret.status === "active" ? "#eff6ff" : "#f4f4f5",
                      color: ret.status === "paid" ? "#059669" : ret.status === "active" ? "#2563eb" : "#71717a",
                      textTransform: "uppercase", letterSpacing: "0.05em",
                    }}>
                      {ret.status}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>${Number(ret.amount).toLocaleString()}/mo</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1, height: 6, background: "#f4f4f5", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, (Number(ret.hours_used) / Number(ret.hours_included)) * 100)}%`, background: Number(ret.hours_used) > Number(ret.hours_included) ? "#dc2626" : "#2563eb", borderRadius: 99, transition: "width 0.3s" }} />
                  </div>
                  <span style={{ fontSize: 12, color: "#71717a", whiteSpace: "nowrap" }}>
                    {ret.hours_used}/{ret.hours_included}h
                  </span>
                </div>
                {ret.scope_items && ret.scope_items.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {ret.scope_items.map((item, i) => (
                      <div key={i} style={{ fontSize: 13, color: "#52525b", padding: "2px 0", display: "flex", alignItems: "center", gap: 6 }}>
                        <Check size={12} style={{ color: "#059669" }} /> {item}
                      </div>
                    ))}
                  </div>
                )}
                {ret.notes && <div style={{ fontSize: 12, color: "#71717a", marginTop: 8 }}>{ret.notes}</div>}
              </div>
            ))}
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
                  <h2 style={{ fontSize: 16, fontWeight: 700 }}>{editing ? "Edit Invoice" : "New Invoice"}</h2>
                  <button onClick={closePanel} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                    <X size={20} />
                  </button>
                </div>
                <div style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    { label: "Invoice Number", key: "invoice_number" as const, placeholder: "JJP-2026-002" },
                    { label: "Client", key: "client_name" as const },
                    { label: "Description", key: "description" as const },
                    { label: "Amount", key: "amount" as const, type: "number" },
                    { label: "Issue Date", key: "issue_date" as const, type: "date" },
                    { label: "Due Date", key: "due_date" as const, type: "date" },
                    { label: "Paid Date", key: "paid_date" as const, type: "date" },
                    { label: "Public URL", key: "public_url" as const, placeholder: "https://pactoll.stjack.com/invoice-002.html" },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" }}>{f.label}</label>
                      <input
                        type={f.type || "text"}
                        value={form[f.key] as string}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14 }}
                      />
                    </div>
                  ))}
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
                      onClick={() => deleteInvoice(editing.id)}
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

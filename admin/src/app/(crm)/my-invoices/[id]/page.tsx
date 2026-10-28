"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  GripVertical,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { PermissionGate } from "@/components/crm/permission-gate";

const ORG_ID = "da62326b-707d-41bd-bc2d-a61a81926dae";

type LineItem = { description: string; amount: number };

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
  line_items: LineItem[];
};

const STATUS_OPTIONS: { value: string; label: string; color: string; bg: string }[] = [
  { value: "draft", label: "Draft", color: "#71717a", bg: "#f4f4f5" },
  { value: "sent", label: "Sent", color: "#2563eb", bg: "#eff6ff" },
  { value: "paid", label: "Paid", color: "#059669", bg: "#ecfdf5" },
  { value: "overdue", label: "Overdue", color: "#dc2626", bg: "#fef2f2" },
  { value: "cancelled", label: "Cancelled", color: "#71717a", bg: "#f4f4f5" },
];

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

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 6,
  display: "block",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  fontSize: 14,
  background: "#fff",
  transition: "border-color 0.15s",
  outline: "none",
};

export default function InvoiceEditPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  const isNew = invoiceId === "new";

  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [originalId, setOriginalId] = useState<string | null>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const fetchInvoice = useCallback(async () => {
    if (isNew) return;
    try {
      const res = await fetch(`/api/erp?table=erp_consultant_invoices&org=${ORG_ID}`);
      const data = await res.json();
      const inv = (data.data || []).find((i: { id: string }) => i.id === invoiceId);
      if (!inv) { router.push("/my-invoices"); return; }
      setOriginalId(inv.id);
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
    } catch {} finally { setLoading(false); }
  }, [invoiceId, isNew, router]);

  useEffect(() => { fetchInvoice(); }, [fetchInvoice]);

  const total = form.line_items.reduce((s, x) => s + Number(x.amount), 0);

  const updateLineItem = (i: number, field: keyof LineItem, value: string | number) => {
    const items = [...form.line_items];
    items[i] = { ...items[i], [field]: field === "amount" ? (Number(value) || 0) : value };
    const t = items.reduce((s, x) => s + Number(x.amount), 0);
    setForm(p => ({ ...p, line_items: items, amount: String(t) }));
  };

  const addLineItem = () => {
    setForm(p => ({ ...p, line_items: [...p.line_items, { description: "", amount: 0 }] }));
  };

  const removeLineItem = (i: number) => {
    const items = form.line_items.filter((_, j) => j !== i);
    const t = items.reduce((s, x) => s + Number(x.amount), 0);
    setForm(p => ({ ...p, line_items: items, amount: String(t) }));
  };

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
        ...(originalId ? { id: originalId } : {}),
      };
      const res = await fetch("/api/erp", {
        method: originalId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        if (previewRef.current && form.invoice_number) {
          previewRef.current.src = `/invoice/${form.invoice_number}?t=${Date.now()}`;
        }
        if (isNew) {
          const data = await res.json();
          if (data?.id) {
            setOriginalId(data.id);
            router.replace(`/my-invoices/${data.id}`);
          }
        }
      }
    } catch {} finally { setSaving(false); }
  };

  const deleteInvoice = async () => {
    if (!originalId) return;
    await fetch(`/api/erp?table=erp_consultant_invoices&id=${originalId}&org=${ORG_ID}`, { method: "DELETE" });
    router.push("/my-invoices");
  };

  if (loading) {
    return (
      <PermissionGate module="my-invoices">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
          <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "#94a3b8" }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </PermissionGate>
    );
  }

  const statusOpt = STATUS_OPTIONS.find(s => s.value === form.status) || STATUS_OPTIONS[0];

  return (
    <PermissionGate module="my-invoices">
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px 48px" }}>
        {/* Top Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32, paddingTop: 8 }}>
          <button
            onClick={() => router.push("/my-invoices")}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13, cursor: "pointer", color: "#64748b", fontWeight: 500 }}
          >
            <ArrowLeft size={16} /> Invoices
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0 }}>
              {isNew ? "New Invoice" : `Invoice ${form.invoice_number}`}
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {form.invoice_number && !isNew && (
              <a
                href={`/invoice/${form.invoice_number}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13, textDecoration: "none", color: "#64748b", cursor: "pointer", fontWeight: 500 }}
              >
                <ExternalLink size={14} /> View Public
              </a>
            )}
            {originalId && (
              <button
                onClick={deleteInvoice}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 14px", borderRadius: 8, border: "1px solid #fecaca", background: "#fff", color: "#dc2626", fontSize: 13, cursor: "pointer", fontWeight: 500 }}
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
            <button
              onClick={save}
              disabled={saving}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 8, border: "none",
                background: saved ? "#059669" : "#2563eb", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
                opacity: saving ? 0.6 : 1, transition: "background 0.2s",
              }}
            >
              {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : saved ? <Check size={14} /> : null}
              {saved ? "Saved" : saving ? "Saving..." : isNew ? "Create Invoice" : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Two Column Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>

          {/* Left: Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Header Fields Card */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>Invoice Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Invoice Number</label>
                  <input
                    value={form.invoice_number}
                    onChange={e => setForm(p => ({ ...p, invoice_number: e.target.value }))}
                    placeholder="JJP-2026-002"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Client</label>
                  <input
                    value={form.client_name}
                    onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Description / Reference</label>
                  <input
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Phase 1 — Setup"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Dates Card */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>Dates</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Issue Date</label>
                  <input type="date" value={form.issue_date} onChange={e => setForm(p => ({ ...p, issue_date: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Paid Date</label>
                  <input type="date" value={form.paid_date} onChange={e => setForm(p => ({ ...p, paid_date: e.target.value }))} style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Line Items Card */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Line Items</div>
                <button
                  onClick={addLineItem}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, cursor: "pointer", color: "#2563eb", fontWeight: 600 }}
                >
                  <Plus size={12} /> Add Item
                </button>
              </div>

              {/* Table Header */}
              {form.line_items.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 36px", gap: 8, marginBottom: 8, padding: "0 0 8px", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Description</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "right" }}>Amount</div>
                  <div />
                </div>
              )}

              {form.line_items.map((li, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px 36px", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <input
                    type="text"
                    value={li.description}
                    onChange={e => updateLineItem(i, "description", e.target.value)}
                    placeholder="Service description"
                    style={{ ...inputStyle, padding: "8px 12px", fontSize: 13 }}
                  />
                  <input
                    type="number"
                    value={li.amount || ""}
                    onChange={e => updateLineItem(i, "amount", e.target.value)}
                    placeholder="0"
                    style={{ ...inputStyle, padding: "8px 12px", fontSize: 13, textAlign: "right", fontVariantNumeric: "tabular-nums" }}
                  />
                  <button
                    onClick={() => removeLineItem(i)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, border: "none", background: "none", cursor: "pointer", color: "#dc2626", borderRadius: 6, opacity: 0.5, transition: "opacity 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "0.5")}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              {form.line_items.length === 0 && (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8", fontSize: 13 }}>
                  No line items yet — click "Add Item" to start
                </div>
              )}

              {form.line_items.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 36px", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "2px solid #0f172a" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", textAlign: "right" }}>Total</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    ${total.toLocaleString()}
                  </div>
                  <div />
                </div>
              )}
            </div>

            {/* Notes Card */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Bill-To Address</div>
              <textarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                rows={4}
                placeholder={"Attn: Mark Proner\n24724 Wilmington Ave\nCarson, CA 90745"}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              />
            </div>
          </div>

          {/* Right: Live Preview */}
          <div style={{ position: "sticky", top: 24 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Invoice Preview</span>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4,
                  background: statusOpt.bg, color: statusOpt.color,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                }}>
                  {statusOpt.label}
                </span>
              </div>
              {form.invoice_number && !isNew ? (
                <iframe
                  ref={previewRef}
                  src={`/invoice/${form.invoice_number}`}
                  style={{ width: "100%", height: 700, border: "none" }}
                  title="Invoice preview"
                />
              ) : (
                <div style={{ padding: "80px 24px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                  {isNew ? "Save the invoice to see a preview" : "Loading preview..."}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </PermissionGate>
  );
}

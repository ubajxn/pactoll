"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Eye,
  ExternalLink,
  FileText,
  Globe,
  Link2,
  MapPin,
  Pencil,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Target,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/crm/page-header";

const ORG_ID = "da62326b-707d-41bd-bc2d-a61a81926dae";

type CompetitorRecord = {
  id: string;
  name: string;
  slug: string | null;
  location: string | null;
  type: string;
  threat_level: string;
  website: string | null;
  linkedin: string | null;
  revenue: string | null;
  employees: string | null;
  founded: string | null;
  description: string | null;
  strengths: string | null;
  weaknesses: string | null;
  services: string[] | null;
  key_differentiator: string | null;
  overlap_accounts: string[] | null;
  digital_presence: { websiteQuality?: string; socialActivity?: string; contentOutput?: string; seoStrength?: string } | null;
  contacts: { name: string; title: string }[] | null;
  news: { title: string; date: string; source: string }[] | null;
  competitive_advantage: string | null;
  market_position: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
};

const THREAT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  high: { label: "HIGH THREAT", color: "#dc2626", bg: "#fef2f2", icon: AlertTriangle },
  medium: { label: "MEDIUM THREAT", color: "#d97706", bg: "#fffbeb", icon: ShieldAlert },
  low: { label: "LOW THREAT", color: "#059669", bg: "#ecfdf5", icon: ShieldCheck },
};

const TYPE_LABELS: Record<string, string> = {
  service_center: "Service Center",
  toll_processor: "Toll Processor",
  steel_mill: "Steel Mill",
  steel_distribution: "Steel Distribution",
  full_service: "Full Service",
  other: "Other",
};

function StatCard({ label, value, icon: Icon, color, delay }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }} className="rounded-lg border bg-card p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}18` }}>
          <Icon className="size-4" style={{ color }} />
        </div>
      </div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: delay + 0.2 }} className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</motion.p>
    </motion.div>
  );
}

function DossierSection({ icon: Icon, title, children, defaultOpen = false }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-dashed border-muted-foreground/20">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
        <Icon className="size-3.5" />
        {title}
        {open ? <ChevronDown className="ml-auto size-3.5" /> : <ChevronRight className="ml-auto size-3.5" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-5 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CompetitorDossier({ c, onEdit }: { c: CompetitorRecord; onEdit: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const threat = THREAT_CONFIG[c.threat_level] || THREAT_CONFIG.medium;
  const ThreatIcon = threat.icon;
  const dp = c.digital_presence || {};
  const services = typeof c.services === "string" ? JSON.parse(c.services) : c.services || [];
  const overlaps = typeof c.overlap_accounts === "string" ? JSON.parse(c.overlap_accounts) : c.overlap_accounts || [];
  const contactList = typeof c.contacts === "string" ? JSON.parse(c.contacts) : c.contacts || [];
  const newsList = typeof c.news === "string" ? JSON.parse(c.news) : c.news || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border bg-card overflow-hidden"
      style={{ borderLeft: `3px solid ${threat.color}` }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpanded(!expanded); }}
        className="flex w-full items-start gap-4 p-4 text-left hover:bg-muted/30 transition-colors cursor-pointer"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{c.name}</h3>
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: threat.color, backgroundColor: threat.bg }}>
              <ThreatIcon className="size-3" /> {threat.label}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {TYPE_LABELS[c.type] || c.type}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {c.location && <span className="flex items-center gap-1"><MapPin className="size-3" />{c.location}</span>}
            {c.revenue && <span className="flex items-center gap-1"><span className="font-medium">{c.revenue}</span> revenue</span>}
            {c.employees && <span className="flex items-center gap-1"><Users className="size-3" />{c.employees}</span>}
            {c.founded && <span>Est. {c.founded}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(); }} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Pencil className="size-3.5" />
          </button>
          {expanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
            {c.key_differentiator && (
              <div className="mx-5 mb-3 rounded-md bg-muted/50 px-3 py-2 text-xs">
                <span className="font-semibold text-[#157070]">KEY DIFFERENTIATOR:</span>{" "}
                <span className="text-foreground">{c.key_differentiator}</span>
              </div>
            )}

            <DossierSection icon={FileText} title="Overview" defaultOpen>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {c.website && (
                  <a href={c.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                    <Globe className="size-3" /> Website <ExternalLink className="size-2.5" />
                  </a>
                )}
                {c.linkedin && (
                  <a href={c.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                    <Link2 className="size-3" /> LinkedIn <ExternalLink className="size-2.5" />
                  </a>
                )}
              </div>
            </DossierSection>

            <DossierSection icon={Shield} title="Threat Assessment">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">Strengths</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.strengths || "—"}</p>
                </div>
                <div>
                  <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Weaknesses</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.weaknesses || "—"}</p>
                </div>
              </div>
              {c.competitive_advantage && (
                <div className="mt-3">
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">PTP Competitive Advantage</h4>
                  <p className="text-sm text-muted-foreground">{c.competitive_advantage}</p>
                </div>
              )}
            </DossierSection>

            <DossierSection icon={Target} title="Services & Capabilities">
              {services.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {services.map((s: string) => (
                    <span key={s} className="rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{s}</span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No services listed</p>
              )}
            </DossierSection>

            <DossierSection icon={Users} title="Key Personnel">
              {contactList.length > 0 ? (
                <div className="space-y-2">
                  {contactList.map((ct: { name: string; title: string }, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {ct.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{ct.name}</p>
                        <p className="text-xs text-muted-foreground">{ct.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No personnel intelligence available</p>
              )}
            </DossierSection>

            <DossierSection icon={Eye} title="Recent Intelligence">
              {newsList.length > 0 ? (
                <div className="space-y-2">
                  {newsList.map((n: { title: string; date: string; source: string }, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="mt-0.5 size-1.5 shrink-0 rounded-full bg-[#157070]" />
                      <div>
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground">{n.date} · {n.source}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No recent intelligence gathered</p>
              )}
            </DossierSection>

            <DossierSection icon={Globe} title="Digital Footprint">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  { label: "Website", value: dp.websiteQuality },
                  { label: "Social Activity", value: dp.socialActivity },
                  { label: "Content Output", value: dp.contentOutput },
                  { label: "SEO Strength", value: dp.seoStrength },
                ].map((item) => (
                  <div key={item.label} className="rounded-md border p-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                    <p className="mt-0.5 text-sm font-medium">{item.value || "—"}</p>
                  </div>
                ))}
              </div>
            </DossierSection>

            {overlaps.length > 0 && (
              <DossierSection icon={Target} title="Account Overlap">
                <div className="flex flex-wrap gap-1.5">
                  {overlaps.map((a: string) => (
                    <span key={a} className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">{a}</span>
                  ))}
                </div>
              </DossierSection>
            )}

            {c.notes && (
              <div className="border-t border-dashed border-muted-foreground/20 px-5 py-3">
                <p className="text-xs text-muted-foreground italic">{c.notes}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

type CompetitorFormData = {
  name: string;
  slug: string;
  location: string;
  type: string;
  threat_level: string;
  website: string;
  linkedin: string;
  revenue: string;
  employees: string;
  founded: string;
  description: string;
  strengths: string;
  weaknesses: string;
  key_differentiator: string;
  competitive_advantage: string;
  market_position: string;
  notes: string;
  dp_websiteQuality: string;
  dp_socialActivity: string;
  dp_contentOutput: string;
  dp_seoStrength: string;
  services_text: string;
  overlap_text: string;
  contacts_json: string;
  news_json: string;
};

const EMPTY_FORM: CompetitorFormData = {
  name: "", slug: "", location: "", type: "service_center", threat_level: "medium",
  website: "", linkedin: "", revenue: "", employees: "", founded: "",
  description: "", strengths: "", weaknesses: "", key_differentiator: "", competitive_advantage: "",
  market_position: "", notes: "",
  dp_websiteQuality: "", dp_socialActivity: "", dp_contentOutput: "", dp_seoStrength: "",
  services_text: "", overlap_text: "", contacts_json: "[]", news_json: "[]",
};

function CompetitorEditor({ competitor, onSave, onClose, onDelete }: {
  competitor: CompetitorRecord | null;
  onSave: (data: CompetitorFormData) => Promise<void>;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const isEdit = !!competitor;
  const [form, setForm] = useState<CompetitorFormData>(() => {
    if (!competitor) return EMPTY_FORM;
    const dp = (typeof competitor.digital_presence === "string" ? JSON.parse(competitor.digital_presence) : competitor.digital_presence) || {};
    const svc = typeof competitor.services === "string" ? JSON.parse(competitor.services) : competitor.services || [];
    const ovl = typeof competitor.overlap_accounts === "string" ? JSON.parse(competitor.overlap_accounts) : competitor.overlap_accounts || [];
    const cts = typeof competitor.contacts === "string" ? JSON.parse(competitor.contacts) : competitor.contacts || [];
    const nws = typeof competitor.news === "string" ? JSON.parse(competitor.news) : competitor.news || [];
    return {
      name: competitor.name,
      slug: competitor.slug || "",
      location: competitor.location || "",
      type: competitor.type || "service_center",
      threat_level: competitor.threat_level || "medium",
      website: competitor.website || "",
      linkedin: competitor.linkedin || "",
      revenue: competitor.revenue || "",
      employees: competitor.employees || "",
      founded: competitor.founded || "",
      description: competitor.description || "",
      strengths: competitor.strengths || "",
      weaknesses: competitor.weaknesses || "",
      key_differentiator: competitor.key_differentiator || "",
      competitive_advantage: competitor.competitive_advantage || "",
      market_position: competitor.market_position || "",
      notes: competitor.notes || "",
      dp_websiteQuality: dp.websiteQuality || "",
      dp_socialActivity: dp.socialActivity || "",
      dp_contentOutput: dp.contentOutput || "",
      dp_seoStrength: dp.seoStrength || "",
      services_text: svc.join(", "),
      overlap_text: ovl.join(", "),
      contacts_json: JSON.stringify(cts, null, 2),
      news_json: JSON.stringify(nws, null, 2),
    };
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"profile" | "threat" | "digital" | "intel">("profile");

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  const set = (key: keyof CompetitorFormData, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const inputClass = "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]";
  const labelClass = "mb-1 block text-xs font-medium text-muted-foreground";
  const textareaClass = "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070] resize-none";

  const tabs = [
    { key: "profile" as const, label: "Profile" },
    { key: "threat" as const, label: "Threat Assessment" },
    { key: "digital" as const, label: "Digital & Market" },
    { key: "intel" as const, label: "Intelligence" },
  ];

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l bg-background shadow-2xl"
    >
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">{isEdit ? "Edit Dossier" : "New Competitor Dossier"}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{isEdit ? "Update competitive intelligence" : "Add a new competitor to the intelligence database"}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
      </div>

      <div className="flex gap-1 border-b px-5 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${tab === t.key ? "border-[#157070] text-[#157070]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "profile" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Name *</label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} placeholder="e.g. Alliance Steel" />
              </div>
              <div>
                <label className={labelClass}>Slug</label>
                <input value={form.slug} onChange={(e) => set("slug", e.target.value)} className={inputClass} placeholder="e.g. alliance-steel" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input value={form.location} onChange={(e) => set("location", e.target.value)} className={inputClass} placeholder="e.g. South Gate, CA" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Type</label>
                <select value={form.type} onChange={(e) => set("type", e.target.value)} className={inputClass}>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Threat Level</label>
                <select value={form.threat_level} onChange={(e) => set("threat_level", e.target.value)} className={inputClass}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Website</label>
                <input value={form.website} onChange={(e) => set("website", e.target.value)} className={inputClass} placeholder="https://" />
              </div>
              <div>
                <label className={labelClass}>LinkedIn</label>
                <input value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} className={inputClass} placeholder="https://linkedin.com/company/..." />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Revenue</label>
                <input value={form.revenue} onChange={(e) => set("revenue", e.target.value)} className={inputClass} placeholder="e.g. $35M" />
              </div>
              <div>
                <label className={labelClass}>Employees</label>
                <input value={form.employees} onChange={(e) => set("employees", e.target.value)} className={inputClass} placeholder="e.g. 80+" />
              </div>
              <div>
                <label className={labelClass}>Founded</label>
                <input value={form.founded} onChange={(e) => set("founded", e.target.value)} className={inputClass} placeholder="e.g. 1998" />
              </div>
            </div>
          </div>
        )}

        {tab === "threat" && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Description</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className={textareaClass} placeholder="Overview of the competitor..." />
            </div>
            <div>
              <label className={labelClass}>Strengths</label>
              <textarea value={form.strengths} onChange={(e) => set("strengths", e.target.value)} rows={3} className={textareaClass} placeholder="What they do well..." />
            </div>
            <div>
              <label className={labelClass}>Weaknesses</label>
              <textarea value={form.weaknesses} onChange={(e) => set("weaknesses", e.target.value)} rows={3} className={textareaClass} placeholder="Where they fall short..." />
            </div>
            <div>
              <label className={labelClass}>Key Differentiator</label>
              <textarea value={form.key_differentiator} onChange={(e) => set("key_differentiator", e.target.value)} rows={2} className={textareaClass} placeholder="Their primary competitive edge..." />
            </div>
            <div>
              <label className={labelClass}>PTP Competitive Advantage</label>
              <textarea value={form.competitive_advantage} onChange={(e) => set("competitive_advantage", e.target.value)} rows={2} className={textareaClass} placeholder="How PTP wins against them..." />
            </div>
          </div>
        )}

        {tab === "digital" && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Digital Presence</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Website Quality</label>
                <input value={form.dp_websiteQuality} onChange={(e) => set("dp_websiteQuality", e.target.value)} className={inputClass} placeholder="e.g. Professional/Modern" />
              </div>
              <div>
                <label className={labelClass}>Social Activity</label>
                <input value={form.dp_socialActivity} onChange={(e) => set("dp_socialActivity", e.target.value)} className={inputClass} placeholder="e.g. Active" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Content Output</label>
                <input value={form.dp_contentOutput} onChange={(e) => set("dp_contentOutput", e.target.value)} className={inputClass} placeholder="e.g. Monthly blog" />
              </div>
              <div>
                <label className={labelClass}>SEO Strength</label>
                <input value={form.dp_seoStrength} onChange={(e) => set("dp_seoStrength", e.target.value)} className={inputClass} placeholder="e.g. Strong" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Market Position</h3>
              <div>
                <label className={labelClass}>Market Position</label>
                <textarea value={form.market_position} onChange={(e) => set("market_position", e.target.value)} rows={3} className={textareaClass} placeholder="Their position in the market..." />
              </div>
            </div>
            <div>
              <label className={labelClass}>Internal Notes</label>
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className={textareaClass} placeholder="Internal notes and observations..." />
            </div>
          </div>
        )}

        {tab === "intel" && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Services (comma-separated)</label>
              <textarea value={form.services_text} onChange={(e) => set("services_text", e.target.value)} rows={2} className={textareaClass} placeholder="Toll Slitting, Toll Leveling, Steel Sales..." />
            </div>
            <div>
              <label className={labelClass}>Overlap Accounts (comma-separated)</label>
              <textarea value={form.overlap_text} onChange={(e) => set("overlap_text", e.target.value)} rows={2} className={textareaClass} placeholder="CIE Manufacturing, DBM Vircon..." />
            </div>
            <div>
              <label className={labelClass}>Contacts (JSON)</label>
              <textarea value={form.contacts_json} onChange={(e) => set("contacts_json", e.target.value)} rows={4} className={`${textareaClass} font-mono text-xs`} placeholder='[{"name": "...", "title": "..."}]' />
            </div>
            <div>
              <label className={labelClass}>News / Intelligence (JSON)</label>
              <textarea value={form.news_json} onChange={(e) => set("news_json", e.target.value)} rows={4} className={`${textareaClass} font-mono text-xs`} placeholder='[{"title": "...", "date": "...", "source": "..."}]' />
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
            {saving ? "Saving..." : isEdit ? "Update Dossier" : "Create Dossier"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function CompetitorsPage() {
  const [items, setItems] = useState<CompetitorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  const [editor, setEditor] = useState<{ open: boolean; competitor: CompetitorRecord | null }>({ open: false, competitor: null });

  const loadData = useCallback(() => {
    setLoading(true);
    fetch(`/api/erp?table=erp_competitors&org=${ORG_ID}`)
      .then((r) => r.json())
      .then((d) => { setItems(d.data || []); setTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (data: CompetitorFormData) => {
    const svcArr = data.services_text.split(",").map((s) => s.trim()).filter(Boolean);
    const ovlArr = data.overlap_text.split(",").map((s) => s.trim()).filter(Boolean);
    let contactsParsed: unknown[] = [];
    let newsParsed: unknown[] = [];
    try { contactsParsed = JSON.parse(data.contacts_json); } catch { /* ignore */ }
    try { newsParsed = JSON.parse(data.news_json); } catch { /* ignore */ }

    const payload: Record<string, unknown> = {
      table: "erp_competitors",
      org_id: ORG_ID,
      name: data.name,
      slug: data.slug || null,
      location: data.location || null,
      type: data.type,
      threat_level: data.threat_level,
      website: data.website || null,
      linkedin: data.linkedin || null,
      revenue: data.revenue || null,
      employees: data.employees || null,
      founded: data.founded || null,
      description: data.description || null,
      strengths: data.strengths || null,
      weaknesses: data.weaknesses || null,
      key_differentiator: data.key_differentiator || null,
      competitive_advantage: data.competitive_advantage || null,
      market_position: data.market_position || null,
      notes: data.notes || null,
      services: svcArr.length > 0 ? JSON.stringify(svcArr) : null,
      overlap_accounts: ovlArr.length > 0 ? JSON.stringify(ovlArr) : null,
      digital_presence: JSON.stringify({
        websiteQuality: data.dp_websiteQuality || undefined,
        socialActivity: data.dp_socialActivity || undefined,
        contentOutput: data.dp_contentOutput || undefined,
        seoStrength: data.dp_seoStrength || undefined,
      }),
      contacts: contactsParsed.length > 0 ? JSON.stringify(contactsParsed) : null,
      news: newsParsed.length > 0 ? JSON.stringify(newsParsed) : null,
    };

    if (editor.competitor) {
      await fetch("/api/erp", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: editor.competitor.id }) });
    } else {
      await fetch("/api/erp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setEditor({ open: false, competitor: null });
    loadData();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/erp?table=erp_competitors&id=${id}&org=${ORG_ID}`, { method: "DELETE" });
    setEditor({ open: false, competitor: null });
    loadData();
  };

  const highCount = items.filter((c) => c.threat_level === "high").length;
  const medCount = items.filter((c) => c.threat_level === "medium").length;
  const lowCount = items.filter((c) => c.threat_level === "low").length;

  const filtered = filter === "all" ? items : items.filter((c) => c.threat_level === filter);

  return (
    <>
      <PageHeader title="Competitive Intelligence" description="Threat assessments, market positioning, and competitor dossiers" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Subjects" value={total} icon={Eye} color="#157070" delay={0} />
        <StatCard label="High Threat" value={highCount} icon={AlertTriangle} color="#dc2626" delay={0.1} />
        <StatCard label="Medium Threat" value={medCount} icon={ShieldAlert} color="#d97706" delay={0.2} />
        <StatCard label="Low Threat" value={lowCount} icon={ShieldCheck} color="#059669" delay={0.3} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Intelligence Files</h3>
            <div className="flex items-center gap-1">
              {[
                { key: "all", label: "All" },
                { key: "high", label: "High" },
                { key: "medium", label: "Medium" },
                { key: "low", label: "Low" },
              ].map((s) => (
                <button key={s.key} type="button" onClick={() => setFilter(s.key)} className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${filter === s.key ? "bg-[#157070] text-white" : "text-muted-foreground hover:bg-muted"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setEditor({ open: true, competitor: null })} className="flex items-center gap-1.5 rounded-md bg-[#157070] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#126060] transition-colors">
            <Plus className="size-3.5" /> New Dossier
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="size-6 animate-spin rounded-full border-2 border-[#157070] border-t-transparent" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border bg-card py-20 text-center">
            <Shield className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No competitors in the intelligence database</p>
            <button type="button" onClick={() => setEditor({ open: true, competitor: null })} className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#157070] px-4 py-2 text-xs font-medium text-white hover:bg-[#126060]">
              <Plus className="size-3.5" /> Create First Dossier
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered
              .sort((a, b) => {
                const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
                return (order[a.threat_level] ?? 1) - (order[b.threat_level] ?? 1);
              })
              .map((c) => (
                <CompetitorDossier key={c.id} c={c} onEdit={() => setEditor({ open: true, competitor: c })} />
              ))}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {editor.open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black" onClick={() => setEditor({ open: false, competitor: null })} />
            <CompetitorEditor
              competitor={editor.competitor}
              onSave={handleSave}
              onClose={() => setEditor({ open: false, competitor: null })}
              onDelete={editor.competitor ? () => handleDelete(editor.competitor!.id) : undefined}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

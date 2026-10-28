"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  ExternalLink,
  Globe,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  Search,
  Share2,
  Star,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/crm/page-header";
import { PermissionGate } from "@/components/crm/permission-gate";

const ORG_ID = "da62326b-707d-41bd-bc2d-a61a81926dae";

type Profile = {
  id: string;
  platform: string;
  category: string;
  status: string;
  priority: string;
  url: string | null;
  username: string | null;
  notes: string | null;
  setup_date: string | null;
  last_checked: string | null;
  created_at: string;
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Globe; color: string; bg: string }> = {
  business_listing: { label: "Business Listings", icon: Building2, color: "#2563eb", bg: "#eff6ff" },
  social_media: { label: "Social Media", icon: Share2, color: "#8b5cf6", bg: "#f5f3ff" },
  industry_directory: { label: "Industry Directories", icon: Search, color: "#059669", bg: "#ecfdf5" },
  seo_analytics: { label: "SEO & Analytics", icon: TrendingUp, color: "#d97706", bg: "#fffbeb" },
  review_trust: { label: "Reviews & Trust", icon: Star, color: "#dc2626", bg: "#fef2f2" },
  content_outreach: { label: "Content & Outreach", icon: Megaphone, color: "#157070", bg: "#f0fdfa" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Check }> = {
  not_started: { label: "Not started", color: "#71717a", bg: "#f4f4f5", icon: Circle },
  in_progress: { label: "In progress", color: "#2563eb", bg: "#eff6ff", icon: Clock },
  live: { label: "Live", color: "#059669", bg: "#ecfdf5", icon: Check },
  needs_update: { label: "Needs update", color: "#d97706", bg: "#fffbeb", icon: Loader2 },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  high: { label: "High", color: "#dc2626", bg: "#fef2f2" },
  med: { label: "Med", color: "#d97706", bg: "#fffbeb" },
  low: { label: "Low", color: "#71717a", bg: "#f4f4f5" },
};

const BRAND_PROFILE = {
  name: "Pacific Toll Processing, Inc.",
  tagline: "Automotive-grade steel processing since 1994",
  category: "Steel Service Center / Toll Processing",
  phone: "(310) 830-0629",
  website: "pactoll.com",
  address: "22241 S. Wilmington Ave, Carson, CA 90810",
  hours: "Mon–Fri 6:00 AM – 4:30 PM",
  bio: "Pacific Toll Processing is a full-service steel processing facility in Carson, CA with 100,000+ sq ft, 8 overhead cranes, and Braner automotive-class equipment. We provide precision coil slitting, multi-blanking, leveling, cut-to-length, warehousing, custom packaging, and nationwide transport — serving automotive, construction, appliance, and industrial markets since 1994. BNSF rail spur on-site. ISO quality. Green steel with on-site solar.",
  hashtags: "#SteelProcessing #TollProcessing #CoilSlitting #FlatRolledSteel #AutomotiveSteel #SteelServiceCenter #CarsonCA #MadeInAmerica #GreenSteel",
};

type FormData = {
  platform: string;
  category: string;
  status: string;
  priority: string;
  url: string;
  username: string;
  notes: string;
  setup_date: string;
};

const EMPTY_FORM: FormData = {
  platform: "", category: "business_listing", status: "not_started", priority: "med",
  url: "", username: "", notes: "", setup_date: "",
};

function Editor({ profile, onSave, onClose, onDelete }: {
  profile: Profile | null;
  onSave: (data: FormData) => Promise<void>;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const isEdit = !!profile;
  const [form, setForm] = useState<FormData>(() => {
    if (!profile) return EMPTY_FORM;
    return {
      platform: profile.platform,
      category: profile.category,
      status: profile.status,
      priority: profile.priority,
      url: profile.url || "",
      username: profile.username || "",
      notes: profile.notes || "",
      setup_date: profile.setup_date || "",
    };
  });
  const [saving, setSaving] = useState(false);
  const set = (key: keyof FormData, val: string) => setForm((f) => ({ ...f, [key]: val }));
  const inputClass = "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]";

  const handleSave = async () => {
    if (!form.platform.trim()) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l bg-background shadow-2xl"
    >
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">{isEdit ? "Edit Profile" : "Add Profile"}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{isEdit ? "Update platform profile details" : "Add a new platform or listing"}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Platform *</label>
          <input value={form.platform} onChange={(e) => set("platform", e.target.value)} className={inputClass} placeholder="e.g. Google Business Profile" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Category</label>
            <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputClass}>
              {Object.entries(CATEGORY_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputClass}>
              {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Priority</label>
          <select value={form.priority} onChange={(e) => set("priority", e.target.value)} className={inputClass}>
            {Object.entries(PRIORITY_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Profile URL</label>
          <input value={form.url} onChange={(e) => set("url", e.target.value)} className={inputClass} placeholder="https://..." />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Username / Handle</label>
          <input value={form.username} onChange={(e) => set("username", e.target.value)} className={inputClass} placeholder="@pacifictollprocessing" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Setup Date</label>
          <input type="date" value={form.setup_date} onChange={(e) => set("setup_date", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes</label>
          <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className={inputClass} placeholder="Setup instructions, credentials location, etc." />
        </div>
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
          <button type="button" onClick={handleSave} disabled={saving || !form.platform.trim()} className="rounded-md bg-[#157070] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#126060] disabled:opacity-50 transition-colors">
            {saving ? "Saving..." : isEdit ? "Save" : "Add Profile"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      <Icon className="size-3" />
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.med;
  return (
    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

export default function DigitalPresencePage() {
  const [items, setItems] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ open: boolean; profile: Profile | null }>({ open: false, profile: null });
  const [brandOpen, setBrandOpen] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    fetch(`/api/erp?table=erp_digital_presence&org=${ORG_ID}`)
      .then((r) => r.json())
      .then((d) => setItems(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (data: FormData) => {
    const payload: Record<string, unknown> = {
      table: "erp_digital_presence",
      org_id: ORG_ID,
      platform: data.platform,
      category: data.category,
      status: data.status,
      priority: data.priority,
      url: data.url || null,
      username: data.username || null,
      notes: data.notes || null,
      setup_date: data.setup_date || null,
    };
    if (editor.profile) {
      await fetch("/api/erp", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: editor.profile.id }) });
    } else {
      await fetch("/api/erp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setEditor({ open: false, profile: null });
    loadData();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/erp?table=erp_digital_presence&id=${id}&org=${ORG_ID}`, { method: "DELETE" });
    setEditor({ open: false, profile: null });
    loadData();
  };

  const handleStatusToggle = async (profile: Profile) => {
    const order = ["not_started", "in_progress", "live", "needs_update"];
    const next = order[(order.indexOf(profile.status) + 1) % order.length];
    await fetch("/api/erp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "erp_digital_presence",
        org_id: ORG_ID,
        id: profile.id,
        status: next,
        ...(next === "live" && !profile.setup_date ? { setup_date: new Date().toISOString().slice(0, 10) } : {}),
      }),
    });
    loadData();
  };

  const grouped = Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => ({
    key,
    ...cfg,
    items: items.filter((i) => i.category === key),
  })).filter((g) => g.items.length > 0);

  const filtered = items.filter((i) => {
    if (filter !== "all" && i.category !== filter) return false;
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    return true;
  });

  const total = items.length;
  const live = items.filter((i) => i.status === "live").length;
  const inProgress = items.filter((i) => i.status === "in_progress").length;
  const notStarted = items.filter((i) => i.status === "not_started").length;
  const highPriority = items.filter((i) => i.priority === "high" && i.status !== "live").length;

  return (
    <PermissionGate module="digital-presence">
      <PageHeader title="Digital Presence" description="Unified brand profile and platform tracker" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: "Total profiles", value: total, color: "#157070" },
          { label: "Live", value: live, color: "#059669" },
          { label: "In progress", value: inProgress, color: "#2563eb" },
          { label: "Not started", value: notStarted, color: "#71717a" },
          { label: "High priority remaining", value: highPriority, color: "#dc2626" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05 }} className="rounded-lg border bg-card p-4">
            <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
            <p className="mt-2 text-2xl font-semibold tabular-nums" style={{ color: s.color }}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Setup progress</span>
          <span className="text-sm font-medium tabular-nums text-muted-foreground">{total > 0 ? Math.round((live / total) * 100) : 0}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: "#059669" }}
            initial={{ width: 0 }}
            animate={{ width: total > 0 ? `${(live / total) * 100}%` : "0%" }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
        </div>
        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-emerald-500" /> {live} live</span>
          <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-blue-500" /> {inProgress} in progress</span>
          <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-zinc-400" /> {notStarted} not started</span>
        </div>
      </div>

      {/* Brand Profile Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="rounded-lg border bg-card">
        <button type="button" onClick={() => setBrandOpen(!brandOpen)} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <Globe className="size-4 text-[#157070]" />
            <h3 className="text-sm font-medium">Unified Brand Profile</h3>
            <span className="text-xs text-muted-foreground">— copy this to every platform</span>
          </div>
          {brandOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </button>
        <AnimatePresence>
          {brandOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="border-t px-4 py-4 space-y-3">
                <div>
                  <p className="text-lg font-semibold">{BRAND_PROFILE.name}</p>
                  <p className="text-sm text-muted-foreground italic">{BRAND_PROFILE.tagline}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div><span className="text-xs text-muted-foreground">Category</span><p>{BRAND_PROFILE.category}</p></div>
                  <div><span className="text-xs text-muted-foreground">Phone</span><p>{BRAND_PROFILE.phone}</p></div>
                  <div><span className="text-xs text-muted-foreground">Website</span><p>{BRAND_PROFILE.website}</p></div>
                  <div><span className="text-xs text-muted-foreground">Hours</span><p>{BRAND_PROFILE.hours}</p></div>
                  <div className="col-span-2"><span className="text-xs text-muted-foreground">Address</span><p>{BRAND_PROFILE.address}</p></div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Bio / description</span>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{BRAND_PROFILE.bio}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Keywords / hashtags</span>
                  <p className="mt-1 text-sm text-muted-foreground">{BRAND_PROFILE.hashtags}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Filters + Add */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            {[{ key: "all", label: "All" }, ...Object.entries(CATEGORY_CONFIG).map(([k, v]) => ({ key: k, label: v.label }))].map((f) => (
              <button key={f.key} type="button" onClick={() => setFilter(f.key)} className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${filter === f.key ? "bg-[#157070] text-white" : "text-muted-foreground hover:bg-muted"}`}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1">
            {[{ key: "all", label: "Any status" }, ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ key: k, label: v.label }))].map((f) => (
              <button key={f.key} type="button" onClick={() => setStatusFilter(f.key)} className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${statusFilter === f.key ? "bg-[#157070] text-white" : "text-muted-foreground hover:bg-muted"}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <button type="button" onClick={() => setEditor({ open: true, profile: null })} className="flex items-center gap-1.5 rounded-md bg-[#157070] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#126060] transition-colors">
          <Plus className="size-3.5" /> Add Profile
        </button>
      </div>

      {/* Profile List */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="size-6 animate-spin rounded-full border-2 border-[#157070] border-t-transparent" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border bg-card py-20 text-center">
          <Globe className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No profiles found</p>
          <button type="button" onClick={() => setEditor({ open: true, profile: null })} className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#157070] px-4 py-2 text-xs font-medium text-white hover:bg-[#126060]">
            <Plus className="size-3.5" /> Add Profile
          </button>
        </div>
      ) : (
        Object.entries(CATEGORY_CONFIG).map(([catKey, catCfg]) => {
          const catItems = filtered.filter((i) => i.category === catKey);
          if (catItems.length === 0) return null;
          const CatIcon = catCfg.icon;
          const catLive = catItems.filter((i) => i.status === "live").length;
          return (
            <motion.div key={catKey} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border bg-card">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg" style={{ backgroundColor: catCfg.bg }}>
                    <CatIcon className="size-3.5" style={{ color: catCfg.color }} />
                  </div>
                  <h3 className="text-sm font-medium">{catCfg.label}</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{catLive}/{catItems.length} live</span>
                </div>
              </div>
              <div className="divide-y">
                {catItems.map((p, i) => {
                  const isOpen = expanded === p.id;
                  return (
                    <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.02 }}>
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                        <button
                          type="button"
                          onClick={() => handleStatusToggle(p)}
                          className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                          style={{
                            borderColor: STATUS_CONFIG[p.status]?.color || "#71717a",
                            backgroundColor: p.status === "live" ? STATUS_CONFIG.live.color : "transparent",
                          }}
                          title={`Status: ${STATUS_CONFIG[p.status]?.label}. Click to advance.`}
                        >
                          {p.status === "live" && <Check className="size-3.5 text-white" />}
                          {p.status === "in_progress" && <Clock className="size-3 text-blue-500" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${p.status === "live" ? "line-through text-muted-foreground" : ""}`}>{p.platform}</span>
                            <PriorityBadge priority={p.priority} />
                            {p.url && (
                              <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                                <ExternalLink className="size-3.5" />
                              </a>
                            )}
                          </div>
                          {p.notes && <p className="mt-0.5 truncate text-xs text-muted-foreground">{p.notes}</p>}
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => setExpanded(isOpen ? null : p.id)} className="rounded p-1 text-muted-foreground hover:bg-muted">
                            {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                          </button>
                          <button type="button" onClick={() => setEditor({ open: true, profile: p })} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            <Pencil className="size-3.5" />
                          </button>
                        </div>
                      </div>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="bg-muted/30 px-12 py-3 text-sm space-y-2">
                              <div className="flex gap-6">
                                <div><span className="text-xs text-muted-foreground">Status</span><p><StatusBadge status={p.status} /></p></div>
                                <div><span className="text-xs text-muted-foreground">Priority</span><p><PriorityBadge priority={p.priority} /></p></div>
                                {p.setup_date && <div><span className="text-xs text-muted-foreground">Setup date</span><p>{new Date(p.setup_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p></div>}
                                {p.username && <div><span className="text-xs text-muted-foreground">Username</span><p>{p.username}</p></div>}
                              </div>
                              {p.url && <div><span className="text-xs text-muted-foreground">URL</span><p><a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[#157070] hover:underline">{p.url}</a></p></div>}
                              {p.notes && <div><span className="text-xs text-muted-foreground">Notes</span><p className="text-muted-foreground leading-relaxed">{p.notes}</p></div>}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })
      )}

      <AnimatePresence>
        {editor.open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black" onClick={() => setEditor({ open: false, profile: null })} />
            <Editor
              profile={editor.profile}
              onSave={handleSave}
              onClose={() => setEditor({ open: false, profile: null })}
              onDelete={editor.profile ? () => handleDelete(editor.profile!.id) : undefined}
            />
          </>
        )}
      </AnimatePresence>
    </PermissionGate>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MapPin,
  Target,
  TrendingUp,
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronRight,
  Users,
  Building2,
  Globe,
  Lightbulb,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/crm/page-header";

const ORG_ID = "da62326b-707d-41bd-bc2d-a61a81926dae";

type Territory = {
  id: string;
  name: string;
  region: string | null;
  states: unknown;
  state_codes: unknown;
  market_focus: unknown;
  territory_type: string | null;
  assigned_rep: string | null;
  secondary_rep: string | null;
  target_revenue: number | null;
  current_revenue: number | null;
  quota: number | null;
  quota_period: string | null;
  quota_attainment_pct: number | null;
  current_customers: number | null;
  target_customers: number | null;
  total_prospects: number | null;
  population: number | null;
  num_businesses: number | null;
  num_manufacturing_businesses: number | null;
  zip_codes: unknown;
  counties: unknown;
  cities: unknown;
  msas: unknown;
  center_lat: number | null;
  center_lng: number | null;
  radius_miles: number | null;
  color: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
};

type TargetMarket = {
  id: string;
  name: string;
  vertical: string | null;
  description: string | null;
  territory_id: string | null;
  estimated_market_size: number | null;
  estimated_addressable: number | null;
  current_penetration_pct: number | null;
  growth_rate_pct: number | null;
  volume_potential_tons_yr: number | null;
  avg_price_per_lb: number | null;
  key_players: string[] | null;
  material_requirements: Record<string, string> | null;
  typical_gauges: string | null;
  typical_widths: string | null;
  typical_grades: string | null;
  competitive_landscape: string | null;
  barriers_to_entry: string | null;
  is_active: boolean;
  notes: string | null;
};

type Opportunity = {
  id: string;
  name: string;
  stage: string;
  territory_id: string | null;
  estimated_value: number | null;
  probability: number | null;
  expected_close: string | null;
  notes: string | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#059669", bg: "#ecfdf5" },
  developing: { label: "Developing", color: "#2563eb", bg: "#eff6ff" },
  planned: { label: "Planned", color: "#7c3aed", bg: "#f5f3ff" },
  inactive: { label: "Inactive", color: "#6b7280", bg: "#f3f4f6" },
};

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  prospecting: { label: "Prospecting", color: "#6b7280", bg: "#f3f4f6" },
  qualification: { label: "Qualification", color: "#2563eb", bg: "#eff6ff" },
  proposal: { label: "Proposal", color: "#7c3aed", bg: "#f5f3ff" },
  negotiation: { label: "Negotiation", color: "#d97706", bg: "#fffbeb" },
  closed_won: { label: "Won", color: "#059669", bg: "#ecfdf5" },
  closed_lost: { label: "Lost", color: "#dc2626", bg: "#fef2f2" },
};

const TERRITORY_TYPES = [
  { value: "exclusive", label: "Exclusive" },
  { value: "shared", label: "Shared" },
  { value: "overlay", label: "Overlay" },
  { value: "house", label: "House" },
];

const QUOTA_PERIODS = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
];

const VERTICALS = [
  { value: "datacenter", label: "Datacenter" },
  { value: "solar", label: "Solar" },
  { value: "hvac", label: "HVAC" },
  { value: "automotive", label: "Automotive" },
  { value: "construction", label: "Construction" },
  { value: "agricultural", label: "Agricultural" },
  { value: "industrial", label: "Industrial" },
  { value: "other", label: "Other" },
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

function StatCard({ label, value, icon: Icon, color, delay, prefix }: {
  label: string; value: string | number; icon: React.ComponentType<{ className?: string }>;
  color: string; delay: number; prefix?: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }} className="rounded-lg border bg-card p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}18` }}><Icon className="size-4" style={{ color }} /></div>
      </div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: delay + 0.2 }} className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{prefix}{value}</motion.p>
    </motion.div>
  );
}

function TagInput({ values, onChange, placeholder }: {
  values: string[]; onChange: (v: string[]) => void; placeholder: string;
}) {
  const [input, setInput] = useState("");
  return (
    <div className="flex flex-wrap gap-1.5 rounded-md border bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-[#157070]">
      {values.map((v) => (
        <span key={v} className="inline-flex items-center gap-1 rounded bg-[#157070]/10 px-2 py-0.5 text-xs font-medium text-[#157070]">
          {v}
          <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} className="hover:text-red-500"><X className="size-3" /></button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === ",") && input.trim()) {
            e.preventDefault();
            if (!values.includes(input.trim())) {
              onChange([...values, input.trim()]);
            }
            setInput("");
          }
          if (e.key === "Backspace" && !input && values.length > 0) {
            onChange(values.slice(0, -1));
          }
        }}
        placeholder={values.length === 0 ? placeholder : ""}
        className="min-w-[80px] flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground/50"
      />
    </div>
  );
}

function StateMultiSelect({ values, onChange }: {
  values: string[]; onChange: (v: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {US_STATES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(values.includes(s) ? values.filter((x) => x !== s) : [...values, s])}
          className={`rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${
            values.includes(s) ? "bg-[#157070] text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

type TerritoryFormData = {
  name: string;
  region: string;
  territory_type: string;
  state_codes: string[];
  zip_codes: string[];
  counties: string[];
  cities: string[];
  msas: string[];
  target_revenue: string;
  quota: string;
  quota_period: string;
  target_customers: string;
  population: string;
  num_businesses: string;
  num_manufacturing_businesses: string;
  center_lat: string;
  center_lng: string;
  radius_miles: string;
  color: string;
  notes: string;
  is_active: boolean;
};

const EMPTY_FORM: TerritoryFormData = {
  name: "", region: "", territory_type: "exclusive",
  state_codes: [], zip_codes: [], counties: [], cities: [], msas: [],
  target_revenue: "", quota: "", quota_period: "annual",
  target_customers: "", population: "", num_businesses: "",
  num_manufacturing_businesses: "",
  center_lat: "", center_lng: "", radius_miles: "",
  color: "#157070", notes: "", is_active: true,
};

type MarketFormData = {
  name: string;
  vertical: string;
  territory_id: string;
  description: string;
  estimated_market_size: string;
  estimated_addressable: string;
  current_penetration_pct: string;
  growth_rate_pct: string;
  volume_potential_tons_yr: string;
  avg_price_per_lb: string;
  typical_grades: string;
  typical_gauges: string;
  typical_widths: string;
  material_requirements: Record<string, string>;
  key_players: string[];
  competitive_landscape: string;
  barriers_to_entry: string;
  notes: string;
  is_active: boolean;
};

const EMPTY_MARKET_FORM: MarketFormData = {
  name: "", vertical: "datacenter", territory_id: "", description: "",
  estimated_market_size: "", estimated_addressable: "",
  current_penetration_pct: "", growth_rate_pct: "",
  volume_potential_tons_yr: "", avg_price_per_lb: "",
  typical_grades: "", typical_gauges: "", typical_widths: "",
  material_requirements: {}, key_players: [],
  competitive_landscape: "", barriers_to_entry: "",
  notes: "", is_active: true,
};

function KeyValueEditor({ values, onChange }: {
  values: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");
  return (
    <div className="space-y-2">
      {Object.entries(values).map(([key, desc]) => (
        <div key={key} className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium capitalize">{key.replace(/_/g, " ")}</span>
            <input
              value={desc}
              onChange={(e) => onChange({ ...values, [key]: e.target.value })}
              className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-[#157070]"
            />
          </div>
          <button type="button" onClick={() => {
            const next = { ...values };
            delete next[key];
            onChange(next);
          }} className="mt-4 rounded p-1 text-muted-foreground hover:text-red-500">
            <X className="size-3" />
          </button>
        </div>
      ))}
      <div className="flex items-end gap-2 rounded border border-dashed p-2">
        <div className="flex-1">
          <label className="block text-[10px] text-muted-foreground mb-0.5">Key</label>
          <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="e.g. cable_tray" className="w-full rounded border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-[#157070]" />
        </div>
        <div className="flex-[2]">
          <label className="block text-[10px] text-muted-foreground mb-0.5">Description</label>
          <input value={newVal} onChange={(e) => setNewVal(e.target.value)} placeholder="e.g. CRS blanks for cable management" className="w-full rounded border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-[#157070]" />
        </div>
        <button type="button" onClick={() => {
          if (newKey.trim()) {
            onChange({ ...values, [newKey.trim().toLowerCase().replace(/\s+/g, "_")]: newVal.trim() });
            setNewKey("");
            setNewVal("");
          }
        }} className="rounded bg-[#157070] px-2 py-1 text-xs text-white hover:bg-[#126060]">
          Add
        </button>
      </div>
    </div>
  );
}

function MarketEditor({ market, territories, onSave, onClose, onDelete }: {
  market: TargetMarket | null;
  territories: Territory[];
  onSave: (data: MarketFormData) => Promise<void>;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const isEdit = !!market;
  const [form, setForm] = useState<MarketFormData>(() => {
    if (!market) return EMPTY_MARKET_FORM;
    return {
      name: market.name,
      vertical: market.vertical || "datacenter",
      territory_id: market.territory_id || "",
      description: market.description || "",
      estimated_market_size: market.estimated_market_size?.toString() || "",
      estimated_addressable: market.estimated_addressable?.toString() || "",
      current_penetration_pct: market.current_penetration_pct?.toString() || "",
      growth_rate_pct: market.growth_rate_pct?.toString() || "",
      volume_potential_tons_yr: market.volume_potential_tons_yr?.toString() || "",
      avg_price_per_lb: market.avg_price_per_lb?.toString() || "",
      typical_grades: market.typical_grades || "",
      typical_gauges: market.typical_gauges || "",
      typical_widths: market.typical_widths || "",
      material_requirements: market.material_requirements && typeof market.material_requirements === "object" ? { ...market.material_requirements } : {},
      key_players: Array.isArray(market.key_players) ? [...market.key_players] : [],
      competitive_landscape: market.competitive_landscape || "",
      barriers_to_entry: market.barriers_to_entry || "",
      notes: market.notes || "",
      is_active: market.is_active,
    };
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"basics" | "sizing" | "materials" | "intel">("basics");

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof MarketFormData, val: unknown) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l bg-background shadow-2xl"
    >
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">{isEdit ? "Edit Target Market" : "New Target Market"}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isEdit ? "Update market intelligence and sizing" : "Define a new target market vertical"}
          </p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
          <X className="size-4" />
        </button>
      </div>

      <div className="flex gap-1 border-b px-5">
        {(["basics", "sizing", "materials", "intel"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              tab === t ? "border-[#157070] text-[#157070]" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "basics" ? "Basics" : t === "sizing" ? "Market Sizing" : t === "materials" ? "Materials" : "Intelligence"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "basics" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Market Name *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. Datacenter Construction" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Vertical</label>
                <select value={form.vertical} onChange={(e) => set("vertical", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]">
                  {VERTICALS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Territory</label>
                <select value={form.territory_id} onChange={(e) => set("territory_id", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]">
                  <option value="">Unassigned</option>
                  {territories.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="Brief description of this market segment..." />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} className="rounded border-gray-300" />
                <span className="text-muted-foreground">Active</span>
              </label>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes</label>
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="Market intelligence, upcoming projects, key relationships..." />
            </div>
          </div>
        )}

        {tab === "sizing" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-[#157070]/5 p-3">
              <div className="flex items-start gap-2">
                <DollarSign className="mt-0.5 size-4 text-[#157070]" />
                <p className="text-xs text-[#157070]">
                  Market sizing drives opportunity gap calculations. Use industry reports, trade data, and local intel to size each vertical accurately.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Total Market Size</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input value={form.estimated_market_size} onChange={(e) => set("estimated_market_size", e.target.value)} className="w-full rounded-md border bg-background py-2 pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="500000000" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Addressable Market</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input value={form.estimated_addressable} onChange={(e) => set("estimated_addressable", e.target.value)} className="w-full rounded-md border bg-background py-2 pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="18500000" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Current Penetration %</label>
                <input value={form.current_penetration_pct} onChange={(e) => set("current_penetration_pct", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="1.8" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Growth Rate %</label>
                <input value={form.growth_rate_pct} onChange={(e) => set("growth_rate_pct", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="42" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Volume Potential (tons/yr)</label>
                <input value={form.volume_potential_tons_yr} onChange={(e) => set("volume_potential_tons_yr", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="8500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Avg Price per lb</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input value={form.avg_price_per_lb} onChange={(e) => set("avg_price_per_lb", e.target.value)} className="w-full rounded-md border bg-background py-2 pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="0.085" />
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "materials" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Typical Grades</label>
              <input value={form.typical_grades} onChange={(e) => set("typical_grades", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="A36, A572-50, A500, A1011" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Typical Gauges</label>
                <input value={form.typical_gauges} onChange={(e) => set("typical_gauges", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder='14ga - 3/8"' />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Typical Widths</label>
                <input value={form.typical_widths} onChange={(e) => set("typical_widths", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder='48" - 72"' />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Material Requirements</label>
              <p className="mb-2 text-[10px] text-muted-foreground/70">Define specific material needs for this vertical — what your team processes and why.</p>
              <KeyValueEditor values={form.material_requirements} onChange={(v) => set("material_requirements", v)} />
            </div>
          </div>
        )}

        {tab === "intel" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-[#157070]/5 p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 size-4 text-[#157070]" />
                <p className="text-xs text-[#157070]">
                  Competitive intel gives your reps the edge. Track the players, know the landscape, understand the barriers — then find the gap.
                </p>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Key Players</label>
              <TagInput values={form.key_players} onChange={(v) => set("key_players", v)} placeholder="e.g. QTS Realty Trust, CyrusOne, Microsoft Azure" />
              <p className="mt-1 text-[10px] text-muted-foreground/70">Companies driving demand in this vertical. Press Enter or comma to add.</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Competitive Landscape</label>
              <textarea value={form.competitive_landscape} onChange={(e) => set("competitive_landscape", e.target.value)} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="Who else is serving this vertical? Where do we win? Where are we vulnerable?" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Barriers to Entry</label>
              <textarea value={form.barriers_to_entry} onChange={(e) => set("barriers_to_entry", e.target.value)} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="What makes this market hard to crack? Tolerances, relationships, inventory requirements..." />
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
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Market"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function TerritoryEditor({ territory, onSave, onClose, onDelete }: {
  territory: Territory | null;
  onSave: (data: TerritoryFormData) => Promise<void>;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const isEdit = !!territory;
  const [form, setForm] = useState<TerritoryFormData>(() => {
    if (!territory) return EMPTY_FORM;
    return {
      name: territory.name,
      region: territory.region || "",
      territory_type: territory.territory_type || "exclusive",
      state_codes: Array.isArray(territory.state_codes) ? territory.state_codes as string[] : [],
      zip_codes: Array.isArray(territory.zip_codes) ? territory.zip_codes as string[] : [],
      counties: Array.isArray(territory.counties) ? territory.counties as string[] : [],
      cities: Array.isArray(territory.cities) ? territory.cities as string[] : [],
      msas: Array.isArray(territory.msas) ? territory.msas as string[] : [],
      target_revenue: territory.target_revenue?.toString() || "",
      quota: territory.quota?.toString() || "",
      quota_period: territory.quota_period || "annual",
      target_customers: territory.target_customers?.toString() || "",
      population: territory.population?.toString() || "",
      num_businesses: territory.num_businesses?.toString() || "",
      num_manufacturing_businesses: territory.num_manufacturing_businesses?.toString() || "",
      center_lat: territory.center_lat?.toString() || "",
      center_lng: territory.center_lng?.toString() || "",
      radius_miles: territory.radius_miles?.toString() || "",
      color: territory.color || "#157070",
      notes: territory.notes || "",
      is_active: territory.is_active,
    };
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"basics" | "geography" | "targets" | "demographics">("basics");

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof TerritoryFormData, val: unknown) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l bg-background shadow-2xl"
    >
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">{isEdit ? "Edit Territory" : "New Territory"}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isEdit ? "Update territory definition and targets" : "Define a new sales territory"}
          </p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
          <X className="size-4" />
        </button>
      </div>

      <div className="flex gap-1 border-b px-5">
        {(["basics", "geography", "targets", "demographics"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              tab === t ? "border-[#157070] text-[#157070]" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "basics" ? "Basics" : t === "geography" ? "Geography" : t === "targets" ? "Targets & Quota" : "Demographics"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "basics" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Territory Name *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. Southern California" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Region</label>
                <input value={form.region} onChange={(e) => set("region", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. Southwest" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
                <select value={form.territory_type} onChange={(e) => set("territory_type", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]">
                  {TERRITORY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.color} onChange={(e) => set("color", e.target.value)} className="size-8 cursor-pointer rounded border" />
                  <span className="text-xs text-muted-foreground">{form.color}</span>
                </div>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} className="rounded border-gray-300" />
                  <span className="text-muted-foreground">Active</span>
                </label>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes</label>
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="Strategic notes, focus areas, key relationships..." />
            </div>
          </div>
        )}

        {tab === "geography" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">States</label>
              <StateMultiSelect values={form.state_codes} onChange={(v) => set("state_codes", v)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">MSAs (Metropolitan Statistical Areas)</label>
              <TagInput values={form.msas} onChange={(v) => set("msas", v)} placeholder="e.g. Phoenix-Mesa-Chandler" />
              <p className="mt-1 text-xs text-muted-foreground/70">Press Enter or comma to add. Key for datacenter market targeting.</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Counties</label>
              <TagInput values={form.counties} onChange={(v) => set("counties", v)} placeholder="e.g. Maricopa County" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Cities</label>
              <TagInput values={form.cities} onChange={(v) => set("cities", v)} placeholder="e.g. Phoenix, Chandler, Mesa" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">ZIP Codes</label>
              <TagInput values={form.zip_codes} onChange={(v) => set("zip_codes", v)} placeholder="e.g. 85001, 85002, 85003" />
            </div>
            <div className="rounded-lg border border-dashed p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Radius Targeting</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-0.5 block text-[10px] text-muted-foreground">Latitude</label>
                  <input value={form.center_lat} onChange={(e) => set("center_lat", e.target.value)} className="w-full rounded border bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#157070]" placeholder="33.4484" />
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-muted-foreground">Longitude</label>
                  <input value={form.center_lng} onChange={(e) => set("center_lng", e.target.value)} className="w-full rounded border bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#157070]" placeholder="-112.0740" />
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-muted-foreground">Radius (mi)</label>
                  <input value={form.radius_miles} onChange={(e) => set("radius_miles", e.target.value)} className="w-full rounded border bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#157070]" placeholder="50" />
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "targets" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-[#157070]/5 p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 size-4 text-[#157070]" />
                <p className="text-xs text-[#157070]">
                  Set targets that feel achievable. The system will track progress and surface opportunities — your reps stay focused on what they can control.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Target Revenue</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input value={form.target_revenue} onChange={(e) => set("target_revenue", e.target.value)} className="w-full rounded-md border bg-background py-2 pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="500,000" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Quota</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input value={form.quota} onChange={(e) => set("quota", e.target.value)} className="w-full rounded-md border bg-background py-2 pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="400,000" />
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Quota Period</label>
              <select value={form.quota_period} onChange={(e) => set("quota_period", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]">
                {QUOTA_PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Target Customers</label>
              <input value={form.target_customers} onChange={(e) => set("target_customers", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="Number of customers to acquire" />
            </div>
          </div>
        )}

        {tab === "demographics" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-[#157070]/5 p-3">
              <div className="flex items-start gap-2">
                <Building2 className="mt-0.5 size-4 text-[#157070]" />
                <p className="text-xs text-[#157070]">
                  Market intelligence helps your team prioritize the right prospects. These numbers guide — they don&apos;t dictate.
                </p>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Total Population</label>
              <input value={form.population} onChange={(e) => set("population", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. 4,800,000" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Total Businesses</label>
                <input value={form.num_businesses} onChange={(e) => set("num_businesses", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. 12,000" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Manufacturing Businesses</label>
                <input value={form.num_manufacturing_businesses} onChange={(e) => set("num_manufacturing_businesses", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#157070]" placeholder="e.g. 800" />
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
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Territory"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function TerritoriesPage() {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [markets, setMarkets] = useState<TargetMarket[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"territories" | "markets" | "pipeline">("territories");
  const [editor, setEditor] = useState<{ open: boolean; territory: Territory | null }>({ open: false, territory: null });
  const [marketEditor, setMarketEditor] = useState<{ open: boolean; market: TargetMarket | null }>({ open: false, market: null });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedMarketId, setExpandedMarketId] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/erp?table=erp_territories&org=${ORG_ID}`).then((r) => r.json()),
      fetch(`/api/erp?table=erp_target_markets&org=${ORG_ID}`).then((r) => r.json()),
      fetch(`/api/erp?table=erp_opportunities&org=${ORG_ID}`).then((r) => r.json()),
    ])
      .then(([t, m, o]) => {
        setTerritories(t.data || []);
        setMarkets(m.data || []);
        setOpportunities(o.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (data: TerritoryFormData) => {
    const payload = {
      table: "erp_territories",
      org_id: ORG_ID,
      name: data.name,
      region: data.region || null,
      territory_type: data.territory_type,
      state_codes: data.state_codes,
      zip_codes: data.zip_codes,
      counties: data.counties,
      cities: data.cities,
      msas: data.msas,
      target_revenue: data.target_revenue ? Number(data.target_revenue.replace(/,/g, "")) : null,
      quota: data.quota ? Number(data.quota.replace(/,/g, "")) : null,
      quota_period: data.quota_period,
      target_customers: data.target_customers ? Number(data.target_customers.replace(/,/g, "")) : null,
      population: data.population ? Number(data.population.replace(/,/g, "")) : null,
      num_businesses: data.num_businesses ? Number(data.num_businesses.replace(/,/g, "")) : null,
      num_manufacturing_businesses: data.num_manufacturing_businesses ? Number(data.num_manufacturing_businesses.replace(/,/g, "")) : null,
      center_lat: data.center_lat ? Number(data.center_lat) : null,
      center_lng: data.center_lng ? Number(data.center_lng) : null,
      radius_miles: data.radius_miles ? Number(data.radius_miles) : null,
      color: data.color,
      notes: data.notes || null,
      is_active: data.is_active,
    };

    if (editor.territory) {
      await fetch("/api/erp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, id: editor.territory.id }),
      });
    } else {
      await fetch("/api/erp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setEditor({ open: false, territory: null });
    loadData();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/erp?table=erp_territories&id=${id}&org=${ORG_ID}`, { method: "DELETE" });
    setEditor({ open: false, territory: null });
    loadData();
  };

  const handleMarketSave = async (data: MarketFormData) => {
    const payload = {
      table: "erp_target_markets",
      org_id: ORG_ID,
      name: data.name,
      vertical: data.vertical,
      territory_id: data.territory_id || null,
      description: data.description || null,
      estimated_market_size: data.estimated_market_size ? Number(data.estimated_market_size.replace(/,/g, "")) : null,
      estimated_addressable: data.estimated_addressable ? Number(data.estimated_addressable.replace(/,/g, "")) : null,
      current_penetration_pct: data.current_penetration_pct ? Number(data.current_penetration_pct) : null,
      growth_rate_pct: data.growth_rate_pct ? Number(data.growth_rate_pct) : null,
      volume_potential_tons_yr: data.volume_potential_tons_yr ? Number(data.volume_potential_tons_yr) : null,
      avg_price_per_lb: data.avg_price_per_lb ? Number(data.avg_price_per_lb) : null,
      typical_grades: data.typical_grades || null,
      typical_gauges: data.typical_gauges || null,
      typical_widths: data.typical_widths || null,
      material_requirements: Object.keys(data.material_requirements).length > 0 ? JSON.stringify(data.material_requirements) : null,
      key_players: data.key_players.length > 0 ? JSON.stringify(data.key_players) : null,
      competitive_landscape: data.competitive_landscape || null,
      barriers_to_entry: data.barriers_to_entry || null,
      notes: data.notes || null,
      is_active: data.is_active,
    };

    if (marketEditor.market) {
      await fetch("/api/erp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, id: marketEditor.market.id }),
      });
    } else {
      await fetch("/api/erp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setMarketEditor({ open: false, market: null });
    loadData();
  };

  const handleMarketDelete = async (id: string) => {
    await fetch(`/api/erp?table=erp_target_markets&id=${id}&org=${ORG_ID}`, { method: "DELETE" });
    setMarketEditor({ open: false, market: null });
    loadData();
  };

  const pipelineValue = opportunities
    .filter((o) => !["closed_won", "closed_lost"].includes(o.stage))
    .reduce((s, o) => s + (Number(o.estimated_value) || 0) * ((Number(o.probability) || 0) / 100), 0);
  const wonValue = opportunities
    .filter((o) => o.stage === "closed_won")
    .reduce((s, o) => s + (Number(o.estimated_value) || 0), 0);
  const activeMarkets = markets.filter((m) => m.is_active).length;
  const totalCustomers = territories.reduce((s, t) => s + (t.current_customers || 0), 0);

  const getStates = (t: Territory) => {
    if (Array.isArray(t.state_codes) && (t.state_codes as string[]).length > 0) return (t.state_codes as string[]).join(", ");
    if (Array.isArray(t.states)) return (t.states as string[]).join(", ");
    return "—";
  };

  return (
    <>
      <PageHeader title="Territories & Growth" description="Sales territories, target markets, and pipeline — your team's command center" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Territories" value={territories.length} icon={MapPin} color="#2563eb" delay={0} />
        <StatCard label="Active Markets" value={activeMarkets} icon={Target} color="#7c3aed" delay={0.1} />
        <StatCard label="Weighted Pipeline" value={pipelineValue > 0 ? Math.round(pipelineValue).toLocaleString() : "0"} icon={TrendingUp} color="#d97706" delay={0.2} prefix="$" />
        <StatCard label="Customers" value={totalCustomers || wonValue > 0 ? `${totalCustomers}` : "0"} icon={Users} color="#059669" delay={0.3} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium">Sales Intelligence</h3>
            <div className="flex items-center gap-1">
              {(["territories", "markets", "pipeline"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setView(v)} className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${view === v ? "bg-[#157070] text-white" : "text-muted-foreground hover:bg-muted"}`}>
                  {v === "territories" ? "Territories" : v === "markets" ? "Target Markets" : "Pipeline"}
                </button>
              ))}
            </div>
          </div>
          {view === "territories" && (
            <button
              type="button"
              onClick={() => setEditor({ open: true, territory: null })}
              className="flex items-center gap-1.5 rounded-md bg-[#157070] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#126060] transition-colors"
            >
              <Plus className="size-3.5" /> Add Territory
            </button>
          )}
          {view === "markets" && (
            <button
              type="button"
              onClick={() => setMarketEditor({ open: true, market: null })}
              className="flex items-center gap-1.5 rounded-md bg-[#157070] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#126060] transition-colors"
            >
              <Plus className="size-3.5" /> Add Market
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="size-6 animate-spin rounded-full border-2 border-[#157070] border-t-transparent" /></div>
        ) : view === "territories" ? (
          territories.length === 0 ? (
            <div className="py-20 text-center">
              <MapPin className="mx-auto mb-3 size-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No territories defined yet</p>
              <p className="mt-1 text-xs text-muted-foreground/70">Create your first territory to start tracking coverage</p>
              <button type="button" onClick={() => setEditor({ open: true, territory: null })} className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#157070] px-4 py-2 text-xs font-medium text-white hover:bg-[#126060]">
                <Plus className="size-3.5" /> Create Territory
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {territories.map((t, i) => {
                const isExpanded = expandedId === t.id;
                const attainment = t.target_revenue && t.current_revenue ? Math.round((Number(t.current_revenue) / Number(t.target_revenue)) * 100) : null;
                const territoryMarkets = markets.filter((m) => m.territory_id === t.id);
                const territoryOpps = opportunities.filter((o) => o.territory_id === t.id);

                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                  >
                    <div
                      className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                      onClick={() => setExpandedId(isExpanded ? null : t.id)}
                    >
                      <div className="size-3 rounded-full" style={{ backgroundColor: t.color || "#157070" }} />
                      <ChevronRight className={`size-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{t.name}</span>
                          <span className="text-xs text-muted-foreground">{t.region}</span>
                          {t.territory_type && t.territory_type !== "exclusive" && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">{t.territory_type}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-0.5 text-xs text-muted-foreground">
                          <span>{getStates(t)}</span>
                          {t.current_customers ? <span>{t.current_customers} customers</span> : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        {attainment !== null && (
                          <div className="w-24">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Quota</span>
                              <span className={`font-medium ${attainment >= 100 ? "text-emerald-600" : attainment >= 75 ? "text-amber-600" : "text-red-500"}`}>{attainment}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(attainment, 100)}%` }}
                                transition={{ duration: 0.8, delay: i * 0.05 }}
                                className={`h-full rounded-full ${attainment >= 100 ? "bg-emerald-500" : attainment >= 75 ? "bg-amber-500" : "bg-red-500"}`}
                              />
                            </div>
                          </div>
                        )}
                        <div className="tabular-nums text-sm">
                          {t.target_revenue ? `$${Number(t.target_revenue).toLocaleString()}` : "—"}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setEditor({ open: true, territory: t }); }}
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-muted/30 px-12 py-4">
                            <div className="grid grid-cols-3 gap-6 text-xs">
                              <div>
                                <h4 className="font-medium mb-2 flex items-center gap-1.5"><Globe className="size-3.5 text-[#157070]" /> Coverage</h4>
                                <div className="space-y-1 text-muted-foreground">
                                  {Array.isArray(t.msas) && (t.msas as string[]).length > 0 && <p><span className="font-medium text-foreground">MSAs:</span> {(t.msas as string[]).join(", ")}</p>}
                                  {Array.isArray(t.counties) && (t.counties as string[]).length > 0 && <p><span className="font-medium text-foreground">Counties:</span> {(t.counties as string[]).join(", ")}</p>}
                                  {Array.isArray(t.cities) && (t.cities as string[]).length > 0 && <p><span className="font-medium text-foreground">Cities:</span> {(t.cities as string[]).join(", ")}</p>}
                                  {Array.isArray(t.zip_codes) && (t.zip_codes as string[]).length > 0 && <p><span className="font-medium text-foreground">ZIP Codes:</span> {(t.zip_codes as string[]).length} zones</p>}
                                  {t.radius_miles && <p><span className="font-medium text-foreground">Radius:</span> {t.radius_miles} miles</p>}
                                  {t.population && <p><span className="font-medium text-foreground">Population:</span> {Number(t.population).toLocaleString()}</p>}
                                  {t.num_manufacturing_businesses && <p><span className="font-medium text-foreground">Mfg Businesses:</span> {Number(t.num_manufacturing_businesses).toLocaleString()}</p>}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2 flex items-center gap-1.5"><Target className="size-3.5 text-[#157070]" /> Markets ({territoryMarkets.length})</h4>
                                {territoryMarkets.length > 0 ? (
                                  <div className="space-y-1">
                                    {territoryMarkets.map((m) => (
                                      <div key={m.id} className="flex items-center justify-between text-muted-foreground">
                                        <span>{m.name}</span>
                                        {m.growth_rate_pct && <span className="font-medium text-emerald-600">+{m.growth_rate_pct}%</span>}
                                      </div>
                                    ))}
                                  </div>
                                ) : <p className="text-muted-foreground">No markets assigned</p>}
                              </div>
                              <div>
                                <h4 className="font-medium mb-2 flex items-center gap-1.5"><TrendingUp className="size-3.5 text-[#157070]" /> Pipeline ({territoryOpps.length})</h4>
                                {territoryOpps.length > 0 ? (
                                  <div className="space-y-1">
                                    {territoryOpps.slice(0, 5).map((o) => {
                                      const sg = STAGE_CONFIG[o.stage] || { label: o.stage, color: "#6b7280" };
                                      return (
                                        <div key={o.id} className="flex items-center justify-between text-muted-foreground">
                                          <span className="truncate mr-2">{o.name}</span>
                                          <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: sg.color }}>{sg.label}</span>
                                        </div>
                                      );
                                    })}
                                    {territoryOpps.length > 5 && <p className="text-muted-foreground/60">+{territoryOpps.length - 5} more</p>}
                                  </div>
                                ) : <p className="text-muted-foreground">No opportunities yet</p>}
                              </div>
                            </div>
                            {t.notes && (
                              <p className="mt-3 text-xs text-muted-foreground border-t pt-3">{t.notes}</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )
        ) : view === "markets" ? (
          markets.length === 0 ? (
            <div className="py-20 text-center">
              <Target className="mx-auto mb-3 size-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No target markets defined</p>
            </div>
          ) : (
            <div className="divide-y">
              {[...markets].sort((a, b) => (b.growth_rate_pct || 0) - (a.growth_rate_pct || 0)).map((m, i) => {
                const isExpanded = expandedMarketId === m.id;
                const territory = territories.find((t) => t.id === m.territory_id);
                const annualRevPotential = (m.volume_potential_tons_yr || 0) * 2000 * (m.avg_price_per_lb || 0);
                const players = Array.isArray(m.key_players) ? m.key_players : [];
                const reqs = m.material_requirements && typeof m.material_requirements === "object" ? m.material_requirements : {};

                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                  >
                    <div
                      className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                      onClick={() => setExpandedMarketId(isExpanded ? null : m.id)}
                    >
                      <ChevronRight className={`size-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{m.name}</span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">{m.vertical?.replace(/_/g, " ")}</span>
                          {territory && <span className="text-[10px] text-muted-foreground">• {territory.name}</span>}
                        </div>
                        <div className="flex items-center gap-4 mt-0.5 text-xs text-muted-foreground">
                          {m.typical_grades && <span>{m.typical_grades}</span>}
                          {m.typical_gauges && <span>{m.typical_gauges}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-5 text-right">
                        {m.growth_rate_pct && (
                          <div className="text-right">
                            <span className={`text-sm font-semibold ${m.growth_rate_pct >= 20 ? "text-emerald-600" : m.growth_rate_pct >= 10 ? "text-emerald-500" : "text-muted-foreground"}`}>
                              +{m.growth_rate_pct}%
                            </span>
                            <p className="text-[10px] text-muted-foreground">growth</p>
                          </div>
                        )}
                        {m.volume_potential_tons_yr && (
                          <div className="text-right">
                            <span className="text-sm font-medium tabular-nums">{Number(m.volume_potential_tons_yr).toLocaleString()}</span>
                            <p className="text-[10px] text-muted-foreground">tons/yr</p>
                          </div>
                        )}
                        {m.estimated_addressable && (
                          <div className="text-right">
                            <span className="text-sm tabular-nums">${Number(m.estimated_addressable).toLocaleString()}</span>
                            <p className="text-[10px] text-muted-foreground">addressable</p>
                          </div>
                        )}
                        {m.current_penetration_pct != null && (
                          <div className="w-16">
                            <div className="flex items-center justify-between text-[10px] mb-0.5">
                              <span className="text-muted-foreground">Share</span>
                              <span className="font-medium">{m.current_penetration_pct}%</span>
                            </div>
                            <div className="h-1 rounded-full bg-muted overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(Number(m.current_penetration_pct) * 5, 100)}%` }}
                                transition={{ duration: 0.8, delay: i * 0.05 }}
                                className="h-full rounded-full bg-[#157070]"
                              />
                            </div>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setMarketEditor({ open: true, market: m }); }}
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-muted/30 px-6 py-4">
                            <div className="grid grid-cols-4 gap-3 mb-4">
                              <div className="rounded-lg border bg-card p-3">
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Total Market</p>
                                <p className="text-lg font-semibold tabular-nums mt-1">${m.estimated_market_size ? (Number(m.estimated_market_size) / 1000000).toFixed(0) : "—"}M</p>
                              </div>
                              <div className="rounded-lg border bg-card p-3">
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Addressable</p>
                                <p className="text-lg font-semibold tabular-nums mt-1">${m.estimated_addressable ? (Number(m.estimated_addressable) / 1000000).toFixed(1) : "—"}M</p>
                              </div>
                              <div className="rounded-lg border bg-card p-3">
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Rev Potential</p>
                                <p className="text-lg font-semibold tabular-nums mt-1">${annualRevPotential > 0 ? (annualRevPotential / 1000000).toFixed(1) : "—"}M</p>
                                <p className="text-[10px] text-muted-foreground">at ${Number(m.avg_price_per_lb).toFixed(3)}/lb</p>
                              </div>
                              <div className="rounded-lg border bg-card p-3">
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Opportunity Gap</p>
                                <p className="text-lg font-semibold tabular-nums mt-1 text-[#157070]">
                                  {m.estimated_addressable && m.current_penetration_pct
                                    ? `$${((Number(m.estimated_addressable) * (1 - Number(m.current_penetration_pct) / 100)) / 1000000).toFixed(1)}M`
                                    : "—"}
                                </p>
                                <p className="text-[10px] text-muted-foreground">uncaptured</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6 text-xs">
                              <div>
                                <h4 className="font-medium mb-2">Material Specs</h4>
                                <div className="space-y-1.5 text-muted-foreground">
                                  {m.typical_grades && <p><span className="font-medium text-foreground">Grades:</span> {m.typical_grades}</p>}
                                  {m.typical_gauges && <p><span className="font-medium text-foreground">Gauges:</span> {m.typical_gauges}</p>}
                                  {m.typical_widths && <p><span className="font-medium text-foreground">Widths:</span> {m.typical_widths}</p>}
                                </div>
                                {Object.keys(reqs).length > 0 && (
                                  <div className="mt-3">
                                    <h4 className="font-medium mb-1.5">Material Requirements</h4>
                                    <div className="space-y-1.5">
                                      {Object.entries(reqs).map(([key, desc]) => (
                                        <div key={key} className="text-muted-foreground">
                                          <span className="font-medium text-foreground capitalize">{key.replace(/_/g, " ")}:</span> {desc as string}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Key Players ({players.length})</h4>
                                {players.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {players.map((p) => (
                                      <span key={p} className="rounded bg-background border px-2 py-0.5 text-muted-foreground">{p}</span>
                                    ))}
                                  </div>
                                ) : <p className="text-muted-foreground">None tracked</p>}
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Competitive Intel</h4>
                                {m.competitive_landscape && (
                                  <p className="text-muted-foreground mb-2">{m.competitive_landscape}</p>
                                )}
                                {m.barriers_to_entry && (
                                  <>
                                    <h4 className="font-medium mb-1 mt-3">Barriers to Entry</h4>
                                    <p className="text-muted-foreground">{m.barriers_to_entry}</p>
                                  </>
                                )}
                              </div>
                            </div>
                            {m.notes && (
                              <div className="mt-3 rounded-lg bg-[#157070]/5 p-3 border-t">
                                <div className="flex items-start gap-2">
                                  <Lightbulb className="mt-0.5 size-3.5 text-[#157070] shrink-0" />
                                  <p className="text-xs text-[#157070]">{m.notes}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )
        ) : (
          opportunities.length === 0 ? (
            <div className="py-20 text-center">
              <TrendingUp className="mx-auto mb-3 size-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No opportunities in pipeline</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                    <th className="px-4 py-2.5">Opportunity</th>
                    <th className="px-4 py-2.5">Stage</th>
                    <th className="px-4 py-2.5 text-right">Value</th>
                    <th className="px-4 py-2.5 text-right">Probability</th>
                    <th className="px-4 py-2.5 text-right">Weighted</th>
                    <th className="px-4 py-2.5">Expected Close</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((opp, i) => {
                    const sg = STAGE_CONFIG[opp.stage] || { label: opp.stage, color: "#6b7280", bg: "#f3f4f6" };
                    const weighted = (Number(opp.estimated_value) || 0) * ((Number(opp.probability) || 0) / 100);
                    return (
                      <motion.tr key={opp.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }} className="border-b transition-colors last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">{opp.name}</td>
                        <td className="px-4 py-3"><span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: sg.color, backgroundColor: sg.bg }}>{sg.label}</span></td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{opp.estimated_value ? `$${Number(opp.estimated_value).toLocaleString()}` : "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{opp.probability ? `${opp.probability}%` : "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">{weighted > 0 ? `$${Math.round(weighted).toLocaleString()}` : "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{opp.expected_close || "—"}</td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </motion.div>

      <AnimatePresence>
        {editor.open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black"
              onClick={() => setEditor({ open: false, territory: null })}
            />
            <TerritoryEditor
              territory={editor.territory}
              onSave={handleSave}
              onClose={() => setEditor({ open: false, territory: null })}
              onDelete={editor.territory ? () => handleDelete(editor.territory!.id) : undefined}
            />
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {marketEditor.open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black"
              onClick={() => setMarketEditor({ open: false, market: null })}
            />
            <MarketEditor
              market={marketEditor.market}
              territories={territories}
              onSave={handleMarketSave}
              onClose={() => setMarketEditor({ open: false, market: null })}
              onDelete={marketEditor.market ? () => handleMarketDelete(marketEditor.market!.id) : undefined}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

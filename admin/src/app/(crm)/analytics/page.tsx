"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  DollarSign,
  Mail,
  Megaphone,
  MousePointerClick,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { PageHeader } from "@/components/crm/page-header";
import {
  EMAIL_METRICS,
  PAID_MEDIA_DETAIL,
  POSTCARD_METRICS,
  SOCIAL_ENGAGEMENT,
  TRAFFIC_SOURCES,
} from "@/data/analytics";

const ORG_ID = "da62326b-707d-41bd-bc2d-a61a81926dae";

type Tab = "overview" | "campaigns" | "postcards" | "paid" | "social";

type Campaign = {
  id: string;
  name: string;
  type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  actual_spend: number | null;
  target_accounts: number | null;
  accounts_contacted: number | null;
  leads_generated: number | null;
  opportunities_created: number | null;
  deals_closed: number | null;
  revenue_generated: number | null;
  description: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  planned: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  paused: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  completed: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-400",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const TYPE_LABELS: Record<string, string> = {
  outbound: "Outbound",
  trade_show: "Trade Show",
  referral: "Referral",
  digital: "Digital",
  direct_mail: "Direct Mail",
  cold_call: "Cold Call",
  partnership: "Partnership",
  other: "Other",
};

function fmt(n: number | null | undefined): string {
  return (Number(n) || 0).toLocaleString();
}

function fmtMoney(n: number | null | undefined): string {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toLocaleString()}`;
}

function fmtMoneyFull(n: number | null | undefined): string {
  return `$${(Number(n) || 0).toLocaleString()}`;
}

function StatCard({ label, value, icon: Icon, color, delay }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; color: string; delay: number }) {
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

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status] ?? STATUS_STYLES.planned}`}>
      {status}
    </span>
  );
}

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "campaigns", label: "Campaigns" },
  { key: "postcards", label: "Post Cards" },
  { key: "paid", label: "Paid Media" },
  { key: "social", label: "Social & Email" },
];

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch(`/api/erp?table=erp_campaigns&org=${ORG_ID}`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.data || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const totalSpend = campaigns.reduce((s, c) => s + (Number(c.actual_spend) || 0), 0);
  const totalBudget = campaigns.reduce((s, c) => s + (Number(c.budget) || 0), 0);
  const totalLeads = campaigns.reduce((s, c) => s + (Number(c.leads_generated) || 0), 0);
  const totalOpps = campaigns.reduce((s, c) => s + (Number(c.opportunities_created) || 0), 0);
  const activeCampaigns = campaigns.filter(c => c.status === "active").length;
  const totalDeals = campaigns.reduce((s, c) => s + (Number(c.deals_closed) || 0), 0);
  const totalRevenue = campaigns.reduce((s, c) => s + (Number(c.revenue_generated) || 0), 0);
  const avgCostPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;
  const budgetUtilization = totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0;

  const campaignsByType = campaigns.reduce<Record<string, Campaign[]>>((acc, c) => {
    const t = c.type || "other";
    if (!acc[t]) acc[t] = [];
    acc[t].push(c);
    return acc;
  }, {});

  return (
    <>
      <PageHeader title="Analytics" />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="size-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Spend" value={fmtMoney(totalSpend)} icon={DollarSign} color="#157070" delay={0} />
            <StatCard label="Total Leads" value={fmt(totalLeads)} icon={Users} color="#059669" delay={0.05} />
            <StatCard label="Opportunities Created" value={fmt(totalOpps)} icon={Target} color="#2563eb" delay={0.1} />
            <StatCard label="Active Campaigns" value={String(activeCampaigns)} icon={Megaphone} color="#d97706" delay={0.15} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Budget" value={fmtMoney(totalBudget)} icon={BarChart3} color="#6b7280" delay={0.2} />
            <StatCard label="Budget Utilization" value={`${budgetUtilization.toFixed(0)}%`} icon={TrendingUp} color="#8b5cf6" delay={0.25} />
            <StatCard label="Cost per Lead" value={fmtMoneyFull(avgCostPerLead)} icon={ArrowUpRight} color="#dc2626" delay={0.3} />
            <StatCard label="Lead → Opp Rate" value={totalLeads > 0 ? `${((totalOpps / totalLeads) * 100).toFixed(1)}%` : "—"} icon={MousePointerClick} color="#157070" delay={0.35} />
          </div>

          <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? "text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={tab === t.key ? { backgroundColor: "#157070" } : undefined}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="space-y-6">
              <div className="rounded-lg border bg-card">
                <div className="border-b px-4 py-3">
                  <h3 className="text-sm font-medium">Campaign Performance</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="px-4 py-2 font-medium">Campaign</th>
                        <th className="px-4 py-2 font-medium">Type</th>
                        <th className="px-4 py-2 font-medium">Status</th>
                        <th className="px-4 py-2 text-right font-medium">Budget</th>
                        <th className="px-4 py-2 text-right font-medium">Spend</th>
                        <th className="px-4 py-2 text-right font-medium">Leads</th>
                        <th className="px-4 py-2 text-right font-medium">Opps</th>
                        <th className="px-4 py-2 text-right font-medium">CPL</th>
                        <th className="px-4 py-2 text-right font-medium">Conv %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((c) => {
                        const spend = Number(c.actual_spend) || 0;
                        const leads = Number(c.leads_generated) || 0;
                        const opps = Number(c.opportunities_created) || 0;
                        const cpl = leads > 0 ? spend / leads : 0;
                        const conv = leads > 0 ? (opps / leads) * 100 : 0;
                        return (
                          <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="max-w-[220px] truncate px-4 py-2.5 font-medium">{c.name}</td>
                            <td className="px-4 py-2.5 text-xs text-muted-foreground">{TYPE_LABELS[c.type] || c.type}</td>
                            <td className="px-4 py-2.5"><StatusBadge status={c.status} /></td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{fmtMoneyFull(c.budget)}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{fmtMoneyFull(c.actual_spend)}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{fmt(leads)}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{fmt(opps)}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{cpl > 0 ? fmtMoneyFull(cpl) : "—"}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{conv > 0 ? `${conv.toFixed(1)}%` : "—"}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-muted/50 font-medium">
                        <td className="px-4 py-2.5">Total ({campaigns.length})</td>
                        <td className="px-4 py-2.5" />
                        <td className="px-4 py-2.5" />
                        <td className="px-4 py-2.5 text-right tabular-nums">{fmtMoneyFull(totalBudget)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{fmtMoneyFull(totalSpend)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{fmt(totalLeads)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{fmt(totalOpps)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{avgCostPerLead > 0 ? fmtMoneyFull(avgCostPerLead) : "—"}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{totalLeads > 0 ? `${((totalOpps / totalLeads) * 100).toFixed(1)}%` : "—"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-lg border bg-card">
                <div className="border-b px-4 py-3">
                  <h3 className="text-sm font-medium">Traffic Sources</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="px-4 py-2 font-medium">Source</th>
                        <th className="px-4 py-2 text-right font-medium">Sessions</th>
                        <th className="px-4 py-2 text-right font-medium">Share</th>
                        <th className="px-4 py-2 text-right font-medium">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TRAFFIC_SOURCES.map((row) => (
                        <tr key={row.source} className="border-b last:border-0">
                          <td className="px-4 py-2.5 font-medium">{row.source}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{row.sessions.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{row.pct}%</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className={row.trend === "new" ? "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary" : "text-emerald-600 dark:text-emerald-400"}>
                              {row.trend}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === "campaigns" && (
            <div className="space-y-6">
              {Object.entries(campaignsByType).sort((a, b) => b[1].length - a[1].length).map(([type, items]) => {
                const typeSpend = items.reduce((s, c) => s + (Number(c.actual_spend) || 0), 0);
                const typeBudget = items.reduce((s, c) => s + (Number(c.budget) || 0), 0);
                const typeLeads = items.reduce((s, c) => s + (Number(c.leads_generated) || 0), 0);
                const typeOpps = items.reduce((s, c) => s + (Number(c.opportunities_created) || 0), 0);
                return (
                  <div key={type} className="rounded-lg border bg-card">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium">{TYPE_LABELS[type] || type}</h3>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{items.length}</span>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Budget: {fmtMoneyFull(typeBudget)}</span>
                        <span>Spend: {fmtMoneyFull(typeSpend)}</span>
                        <span>Leads: {fmt(typeLeads)}</span>
                        <span>Opps: {fmt(typeOpps)}</span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-xs text-muted-foreground">
                            <th className="px-4 py-2 font-medium">Campaign</th>
                            <th className="px-4 py-2 font-medium">Status</th>
                            <th className="px-4 py-2 text-right font-medium">Budget</th>
                            <th className="px-4 py-2 text-right font-medium">Spend</th>
                            <th className="px-4 py-2 text-right font-medium">Leads</th>
                            <th className="px-4 py-2 text-right font-medium">Opps</th>
                            <th className="px-4 py-2 text-right font-medium">CPL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((c) => {
                            const spend = Number(c.actual_spend) || 0;
                            const leads = Number(c.leads_generated) || 0;
                            const cpl = leads > 0 ? spend / leads : 0;
                            return (
                              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                                <td className="max-w-[220px] truncate px-4 py-2.5 font-medium">{c.name}</td>
                                <td className="px-4 py-2.5"><StatusBadge status={c.status} /></td>
                                <td className="px-4 py-2.5 text-right tabular-nums">{fmtMoneyFull(c.budget)}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums">{fmtMoneyFull(c.actual_spend)}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums">{fmt(leads)}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums">{fmt(Number(c.opportunities_created) || 0)}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums">{cpl > 0 ? fmtMoneyFull(cpl) : "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "postcards" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {POSTCARD_METRICS.waves.map((wave) => (
                  <div key={wave.name} className="rounded-lg border bg-card p-4">
                    <h4 className="text-sm font-medium">{wave.name}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">{wave.timeline}</p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground">Sent</span>
                        <p className="font-medium tabular-nums">{wave.sent.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Delivered</span>
                        <p className="font-medium tabular-nums">{wave.delivered.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Responses</span>
                        <p className="font-medium tabular-nums">{wave.responses}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Qualified</span>
                        <p className="font-medium tabular-nums">{wave.qualified}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                      <span>Response rate: {wave.responseRate}</span>
                      <span>{wave.cost}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border bg-card">
                <div className="border-b px-4 py-3">
                  <h3 className="text-sm font-medium">QR Code Tracking</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="px-4 py-2 font-medium">Code</th>
                        <th className="px-4 py-2 font-medium">Landing URL</th>
                        <th className="px-4 py-2 text-right font-medium">Scans</th>
                        <th className="px-4 py-2 text-right font-medium">Web Visits</th>
                        <th className="px-4 py-2 text-right font-medium">Conv.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {POSTCARD_METRICS.trackingCodes.map((row) => (
                        <tr key={row.code} className="border-b last:border-0">
                          <td className="px-4 py-2.5 font-mono text-xs font-medium">{row.code}</td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground">{row.url}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{row.scans}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{row.webVisits}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{row.conversions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === "paid" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {PAID_MEDIA_DETAIL.map((p) => (
                  <div key={p.platform} className="rounded-lg border bg-card p-4">
                    <h4 className="text-sm font-medium">{p.platform}</h4>
                    <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{p.roas}</p>
                    <p className="text-xs text-muted-foreground">ROAS</p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground">Spend</span>
                        <p className="font-medium tabular-nums">{p.spend}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">CPC</span>
                        <p className="font-medium tabular-nums">{p.cpc}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Clicks</span>
                        <p className="font-medium tabular-nums">{p.clicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Conv.</span>
                        <p className="font-medium tabular-nums">{p.conversions}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "social" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {([
                  { key: "linkedin", name: "LinkedIn", data: SOCIAL_ENGAGEMENT.linkedin },
                  { key: "facebook", name: "Facebook", data: SOCIAL_ENGAGEMENT.facebook },
                  { key: "instagram", name: "Instagram", data: SOCIAL_ENGAGEMENT.instagram },
                ] as const).map((p) => (
                  <div key={p.key} className="rounded-lg border bg-card p-4">
                    <h4 className="text-sm font-medium">{p.name}</h4>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground">Followers</span>
                        <p className="font-medium tabular-nums">{p.data.followers}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Engagement</span>
                        <p className="font-medium tabular-nums">{p.data.engagement}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Impressions</span>
                        <p className="font-medium tabular-nums">{p.data.impressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Clicks</span>
                        <p className="font-medium tabular-nums">{p.data.clicks.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border bg-card">
                <div className="border-b px-4 py-3">
                  <h3 className="text-sm font-medium">Email Campaign Performance</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="px-4 py-2 font-medium">Campaign</th>
                        <th className="px-4 py-2 text-right font-medium">Sent</th>
                        <th className="px-4 py-2 text-right font-medium">Opened</th>
                        <th className="px-4 py-2 text-right font-medium">Open Rate</th>
                        <th className="px-4 py-2 text-right font-medium">Clicked</th>
                        <th className="px-4 py-2 text-right font-medium">Click Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {EMAIL_METRICS.campaigns.map((row) => (
                        <tr key={row.name} className="border-b last:border-0">
                          <td className="px-4 py-2.5 font-medium">{row.name}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{row.sent}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{row.opened}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{row.openRate}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{row.clicked}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{row.clickRate}</td>
                        </tr>
                      ))}
                      <tr className="bg-muted/50 font-medium">
                        <td className="px-4 py-2.5">Total</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{EMAIL_METRICS.totals.sent.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{EMAIL_METRICS.totals.opened.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{EMAIL_METRICS.totals.openRate}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{EMAIL_METRICS.totals.clicked}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{EMAIL_METRICS.totals.clickRate}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

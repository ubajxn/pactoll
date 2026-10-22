"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  DollarSign,
  Eye,
  Globe,
  Mail,
  MousePointerClick,
  Send,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/crm/page-header";
import {
  CAMPAIGN_PERFORMANCE,
  CHANNEL_LABELS,
  EMAIL_METRICS,
  KPI_SUMMARY,
  PAID_MEDIA_DETAIL,
  POSTCARD_METRICS,
  SOCIAL_ENGAGEMENT,
  TRAFFIC_SOURCES,
} from "@/data/analytics";

type Tab = "overview" | "campaigns" | "postcards" | "paid" | "social";

function KpiCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
    </div>
  );
}

function TrafficTable() {
  return (
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
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {row.sessions.toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {row.pct}%
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span
                    className={
                      row.trend === "new"
                        ? "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                        : "text-emerald-600 dark:text-emerald-400"
                    }
                  >
                    {row.trend}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CampaignTable() {
  return (
    <div className="rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-medium">Campaign Performance</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-2 font-medium">Campaign</th>
              <th className="px-4 py-2 font-medium">Channel</th>
              <th className="px-4 py-2 text-right font-medium">Impressions</th>
              <th className="px-4 py-2 text-right font-medium">Clicks</th>
              <th className="px-4 py-2 text-right font-medium">CTR</th>
              <th className="px-4 py-2 text-right font-medium">Conv.</th>
              <th className="px-4 py-2 text-right font-medium">Cost</th>
              <th className="px-4 py-2 text-right font-medium">CPA</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {CAMPAIGN_PERFORMANCE.map((row) => (
              <tr key={row.name} className="border-b last:border-0">
                <td className="max-w-[200px] truncate px-4 py-2.5 font-medium">
                  {row.name}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`text-xs font-medium ${CHANNEL_LABELS[row.channel]?.color ?? ""}`}
                  >
                    {CHANNEL_LABELS[row.channel]?.label ?? row.channel}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {row.impressions.toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {row.clicks.toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {row.ctr}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {row.conversions}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {row.cost}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {row.cpa}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    planned:
      "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    complete:
      "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[status] ?? styles.planned}`}
    >
      {status}
    </span>
  );
}

function PostcardSection() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {POSTCARD_METRICS.waves.map((wave) => (
          <div key={wave.name} className="rounded-lg border bg-card p-4">
            <h4 className="text-sm font-medium">{wave.name}</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              {wave.timeline}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Sent</span>
                <p className="font-medium tabular-nums">
                  {wave.sent.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Delivered</span>
                <p className="font-medium tabular-nums">
                  {wave.delivered.toLocaleString()}
                </p>
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
                <th className="px-4 py-2 text-right font-medium">
                  Web Visits
                </th>
                <th className="px-4 py-2 text-right font-medium">Conv.</th>
              </tr>
            </thead>
            <tbody>
              {POSTCARD_METRICS.trackingCodes.map((row) => (
                <tr key={row.code} className="border-b last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs font-medium">
                    {row.code}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {row.url}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {row.scans}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {row.webVisits}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {row.conversions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PaidMediaSection() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {PAID_MEDIA_DETAIL.map((p) => (
          <div key={p.platform} className="rounded-lg border bg-card p-4">
            <h4 className="text-sm font-medium">{p.platform}</h4>
            <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
              {p.roas}
            </p>
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
                <p className="font-medium tabular-nums">
                  {p.clicks.toLocaleString()}
                </p>
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
  );
}

function SocialEmailSection() {
  const platforms = [
    { key: "linkedin" as const, name: "LinkedIn", data: SOCIAL_ENGAGEMENT.linkedin },
    { key: "facebook" as const, name: "Facebook", data: SOCIAL_ENGAGEMENT.facebook },
    { key: "instagram" as const, name: "Instagram", data: SOCIAL_ENGAGEMENT.instagram },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {platforms.map((p) => (
          <div key={p.key} className="rounded-lg border bg-card p-4">
            <h4 className="text-sm font-medium">{p.name}</h4>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Followers</span>
                <p className="font-medium tabular-nums">{p.data.followers}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  Engagement
                </span>
                <p className="font-medium tabular-nums">{p.data.engagement}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  Impressions
                </span>
                <p className="font-medium tabular-nums">
                  {p.data.impressions.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Clicks</span>
                <p className="font-medium tabular-nums">
                  {p.data.clicks.toLocaleString()}
                </p>
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
                <th className="px-4 py-2 text-right font-medium">
                  Click Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {EMAIL_METRICS.campaigns.map((row) => (
                <tr key={row.name} className="border-b last:border-0">
                  <td className="px-4 py-2.5 font-medium">{row.name}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {row.sent}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {row.opened}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {row.openRate}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {row.clicked}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {row.clickRate}
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/50 font-medium">
                <td className="px-4 py-2.5">Total</td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {EMAIL_METRICS.totals.sent.toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {EMAIL_METRICS.totals.opened.toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {EMAIL_METRICS.totals.openRate}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {EMAIL_METRICS.totals.clicked}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {EMAIL_METRICS.totals.clickRate}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
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

  return (
    <>
      <PageHeader title="Analytics" />
      <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Total Sessions"
              value={KPI_SUMMARY.totalSessions.toLocaleString()}
              icon={Eye}
            />
            <KpiCard
              label="Conversions"
              value={KPI_SUMMARY.totalConversions}
              icon={MousePointerClick}
            />
            <KpiCard
              label="Conversion Rate"
              value={KPI_SUMMARY.conversionRate}
              icon={TrendingUp}
            />
            <KpiCard
              label="Pipeline Influenced"
              value={KPI_SUMMARY.pipelineInfluenced}
              icon={DollarSign}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Unique Visitors"
              value={KPI_SUMMARY.uniqueVisitors.toLocaleString()}
              icon={Users}
            />
            <KpiCard
              label="Avg Duration"
              value={KPI_SUMMARY.avgSessionDuration}
              icon={BarChart3}
            />
            <KpiCard
              label="Total Spend"
              value={KPI_SUMMARY.totalSpend}
              icon={DollarSign}
            />
            <KpiCard
              label="Cost / Conversion"
              value={KPI_SUMMARY.costPerConversion}
              icon={ArrowUpRight}
            />
          </div>
          <TrafficTable />
        </div>
      )}

      {tab === "campaigns" && <CampaignTable />}
      {tab === "postcards" && <PostcardSection />}
      {tab === "paid" && <PaidMediaSection />}
      {tab === "social" && <SocialEmailSection />}
    </>
  );
}

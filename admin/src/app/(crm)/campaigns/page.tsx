"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PageHeader } from "@/components/crm/page-header";
import {
  CAMPAIGNS,
  CAMPAIGN_CATEGORIES,
  CAMPAIGN_STATUSES,
  getCategoryCounts,
  getStatusCounts,
  type Campaign,
} from "@/data/campaigns";

function StatusBadge({ status }: { status: string }) {
  const cfg = CAMPAIGN_STATUSES[status];
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${cfg?.color ?? "bg-muted text-muted-foreground"}`}
    >
      {cfg?.label ?? status}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const cfg = CAMPAIGN_CATEGORIES[category];
  return (
    <span className={`text-xs font-medium ${cfg?.color ?? "text-muted-foreground"}`}>
      {cfg?.label ?? category}
    </span>
  );
}

function CampaignRow({ campaign }: { campaign: Campaign }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-muted/50"
      >
        <span className="w-6 shrink-0 text-xs tabular-nums text-muted-foreground">
          #{campaign.number}
        </span>
        <span className="min-w-0 flex-1 truncate font-medium">
          {campaign.name}
        </span>
        <CategoryBadge category={campaign.category} />
        <span className="hidden w-28 shrink-0 text-right text-xs text-muted-foreground sm:block">
          {campaign.timeline}
        </span>
        <span className="hidden w-20 shrink-0 text-right text-xs tabular-nums text-muted-foreground sm:block">
          {campaign.budget}
        </span>
        <StatusBadge status={campaign.status} />
        {open ? (
          <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="space-y-4 bg-muted/30 px-4 py-4 pb-5 pl-14 text-sm">
          <div>
            <h4 className="text-xs font-medium text-muted-foreground">
              Deliverables
            </h4>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {campaign.deliverables.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">
                KPIs
              </h4>
              <p className="mt-1">{campaign.kpis}</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">
                Next Actions
              </h4>
              <p className="mt-1">{campaign.actions}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CampaignsPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const statusCounts = getStatusCounts();
  const categoryCounts = getCategoryCounts();

  const filtered = CAMPAIGNS.filter((c) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterCategory !== "all" && c.category !== filterCategory) return false;
    return true;
  });

  return (
    <>
      <PageHeader title="Campaigns" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <button
          type="button"
          onClick={() => setFilterStatus("all")}
          className={`rounded-lg border p-3 text-left transition-colors ${
            filterStatus === "all"
              ? "border-primary bg-primary/5"
              : "hover:bg-muted/50"
          }`}
        >
          <span className="text-2xl font-semibold tabular-nums">
            {CAMPAIGNS.length}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Total Campaigns
          </span>
        </button>
        {Object.entries(CAMPAIGN_STATUSES).map(([key, cfg]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilterStatus(filterStatus === key ? "all" : key)}
            className={`rounded-lg border p-3 text-left transition-colors ${
              filterStatus === key
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
          >
            <span className="text-2xl font-semibold tabular-nums">
              {statusCounts[key] ?? 0}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {cfg.label}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setFilterCategory("all")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            filterCategory === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
        {Object.entries(CAMPAIGN_CATEGORIES).map(([key, cfg]) => (
          <button
            key={key}
            type="button"
            onClick={() =>
              setFilterCategory(filterCategory === key ? "all" : key)
            }
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filterCategory === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {cfg.label} ({categoryCounts[key] ?? 0})
          </button>
        ))}
      </div>

      <div className="rounded-lg border bg-card">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No campaigns match these filters.
          </p>
        ) : (
          filtered.map((c) => <CampaignRow key={c.slug} campaign={c} />)
        )}
      </div>
    </>
  );
}

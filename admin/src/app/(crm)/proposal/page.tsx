"use client";

import { useState } from "react";
import {
  Calendar,
  Rocket,
  Target,
} from "lucide-react";
import { PageHeader } from "@/components/crm/page-header";

type Priority = "all" | "now" | "next" | "later";

const PRIORITY_STYLES = {
  now: "bg-primary/10 text-primary",
  next: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  later: "bg-muted text-muted-foreground",
};

interface Deliverable {
  name: string;
  priority: "now" | "next" | "later";
  estCost: string;
}

const DELIVERABLES: Deliverable[] = [
  { name: "Website Redesign + Launch", priority: "now", estCost: "$3,000" },
  { name: "Google Business Profile", priority: "now", estCost: "$0" },
  { name: "LinkedIn Company Page + First 10 Posts", priority: "now", estCost: "$500" },
  { name: "IQS Directory Listing", priority: "now", estCost: "$0" },
  { name: "Photography Library (phone start)", priority: "now", estCost: "$200" },
  { name: "Instagram Business Profile", priority: "now", estCost: "$200" },
  { name: "ASMR Steel Content (first batch)", priority: "now", estCost: "$300" },
  { name: "RFQ Form + Lead Capture", priority: "now", estCost: "$0" },
  { name: "SEO Foundation + Local Optimization", priority: "next", estCost: "$400" },
  { name: "Drone + Ground Video Shoot", priority: "next", estCost: "$800" },
  { name: "LinkedIn Posting Cadence (3x/week)", priority: "next", estCost: "$300" },
  { name: "Constant Contact Setup + Welcome Sequence", priority: "next", estCost: "$200" },
  { name: "SteelOrbis + MCN Buyer's Guide Listings", priority: "next", estCost: "$300" },
  { name: "Customer Spotlight Video (first)", priority: "next", estCost: "$500" },
  { name: "Post Card Mailer — Wave 1", priority: "next", estCost: "$375" },
  { name: "Google Ads Campaign Setup", priority: "next", estCost: "$500" },
  { name: "LinkedIn Ads — Automotive Vertical", priority: "later", estCost: "$500" },
  { name: "LinkedIn Ads — Data Centers Vertical", priority: "later", estCost: "$500" },
  { name: "ThomasNet Premium Listing", priority: "later", estCost: "$400" },
  { name: "Toll Client Cross-Sell Email Campaign", priority: "later", estCost: "$300" },
  { name: "MSCI Steel Conference Presence", priority: "later", estCost: "$2,000" },
  { name: "PTP Open House Event", priority: "later", estCost: "$1,500" },
  { name: "Grand Tour Video Series (first episode)", priority: "later", estCost: "$800" },
];

const RESULTS = [
  { metric: "Website Traffic", target: "2,000+ monthly visitors", timeline: "Q1 2027" },
  { metric: "Qualified Leads", target: "15-25 per month", timeline: "Q1 2027" },
  { metric: "Pipeline Influenced", target: "$2.5M in 6 months", timeline: "Q2 2027" },
  { metric: "LinkedIn Followers", target: "500+", timeline: "Jan 2027" },
  { metric: "Google Ranking", target: "Page 1 for 3 target keywords", timeline: "Q1 2027" },
  { metric: "Email List", target: "500+ contacts", timeline: "Q1 2027" },
];

export default function ProposalPage() {
  const [filterPriority, setFilterPriority] = useState<Priority>("all");

  const filtered =
    filterPriority === "all"
      ? DELIVERABLES
      : DELIVERABLES.filter((d) => d.priority === filterPriority);

  const nowCount = DELIVERABLES.filter((d) => d.priority === "now").length;
  const nextCount = DELIVERABLES.filter((d) => d.priority === "next").length;
  const laterCount = DELIVERABLES.filter((d) => d.priority === "later").length;

  return (
    <>
      <PageHeader title="Marketing Proposal" />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Rocket className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums tracking-tight">
                $8,000
              </p>
              <p className="text-xs text-muted-foreground">Launch Package</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Calendar className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums tracking-tight">
                $3,000<span className="text-base font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="text-xs text-muted-foreground">Monthly Retainer</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Target className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums tracking-tight">
                $2.5M
              </p>
              <p className="text-xs text-muted-foreground">Pipeline Target</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5">
        <h3 className="font-medium">The Situation</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Pacific Toll Processing has zero digital marketing presence — no website, no social media, no
          directory listings, no email marketing. Every competitor has at least some of these channels
          active. The $8K launch package gets PTP from invisible to visible in 4-6 weeks. The $3K/mo
          retainer keeps the engine running and expands into paid media, events, and content as results
          come in.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${PRIORITY_STYLES.now}`}>
            Now — $8K Launch ({nowCount} items)
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${PRIORITY_STYLES.next}`}>
            Next — $3K/mo Retainer ({nextCount} items)
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${PRIORITY_STYLES.later}`}>
            Later — Unlocked as results come in ({laterCount} items)
          </span>
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {(["all", "now", "next", "later"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setFilterPriority(p)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                filterPriority === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "all" ? `All (${DELIVERABLES.length})` : `${p} (${p === "now" ? nowCount : p === "next" ? nextCount : laterCount})`}
            </button>
          ))}
        </div>
        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Deliverable</th>
                  <th className="px-4 py-2 font-medium">Priority</th>
                  <th className="px-4 py-2 text-right font-medium">Est. Cost</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.name} className="border-b last:border-0">
                    <td className="px-4 py-2.5 font-medium">{d.name}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PRIORITY_STYLES[d.priority]}`}
                      >
                        {d.priority}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {d.estCost}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5">
        <h3 className="font-medium">6-Month Investment</h3>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Launch Package</span>
            <span className="font-medium tabular-nums">$8,000</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Monthly Retainer (5 months)</span>
            <span className="font-medium tabular-nums">$15,000</span>
          </div>
          <div className="flex items-center justify-between border-t pt-2 text-base font-semibold">
            <span>Total 6-Month Investment</span>
            <span className="tabular-nums">$23,000</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-medium">Projected Results</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-medium">Metric</th>
                <th className="px-4 py-2 font-medium">Target</th>
                <th className="px-4 py-2 font-medium">Timeline</th>
              </tr>
            </thead>
            <tbody>
              {RESULTS.map((r) => (
                <tr key={r.metric} className="border-b last:border-0">
                  <td className="px-4 py-2.5 font-medium">{r.metric}</td>
                  <td className="px-4 py-2.5 tabular-nums">{r.target}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {r.timeline}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Proposal #PTP-2026-001 — Valid through November 15, 2026
      </p>
    </>
  );
}

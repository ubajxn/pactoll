"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ExternalLink,
  Globe,
  Link2,
  MapPin,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/crm/page-header";
import { COMPETITORS, DIGITAL_AUDIT, type Competitor } from "@/data/competitors";

const THREAT_STYLES = {
  high: "bg-red-500/10 text-red-700 dark:text-red-400",
  medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  low: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

function CompetitorCard({
  competitor,
  expanded,
  onToggle,
}: {
  competitor: Competitor;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-lg border bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-4 p-4 text-left hover:bg-muted/30"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{competitor.name}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${THREAT_STYLES[competitor.threat]}`}
            >
              {competitor.threat}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {competitor.loc}
            </span>
            <span>{competitor.type}</span>
            <span>{competitor.revenue} rev</span>
            <span>
              <Users className="mr-0.5 inline size-3" />
              {competitor.employees}
            </span>
          </div>
        </div>
      </button>
      {expanded && (
        <div className="space-y-4 border-t px-4 py-4 text-sm">
          <p className="text-muted-foreground">{competitor.description}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">
                Strengths
              </h4>
              <p className="mt-1">{competitor.strengths}</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">
                Weaknesses
              </h4>
              <p className="mt-1">{competitor.weaknesses}</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-medium text-muted-foreground">
              Key Differentiator
            </h4>
            <p className="mt-1 font-medium">{competitor.keyDifferentiator}</p>
          </div>

          <div>
            <h4 className="text-xs font-medium text-muted-foreground">
              Services
            </h4>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {competitor.services.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-muted px-2 py-0.5 text-xs"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {competitor.overlapAccounts.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">
                Overlap Accounts
              </h4>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {competitor.overlapAccounts.map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-xs font-medium text-muted-foreground">
              Digital Presence
            </h4>
            <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.entries(competitor.digitalPresence).map(
                ([key, value]) => (
                  <div key={key} className="rounded-md bg-muted/50 p-2">
                    <span className="block text-xs text-muted-foreground">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <span className="text-xs font-medium">{value}</span>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="flex gap-3">
            {competitor.website && (
              <a
                href={competitor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Globe className="size-3" />
                Website
                <ExternalLink className="size-3" />
              </a>
            )}
            {competitor.linkedin && (
              <a
                href={competitor.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Link2 className="size-3" />
                LinkedIn
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>

          {competitor.news.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">
                Recent News
              </h4>
              <ul className="mt-1 space-y-1">
                {competitor.news.map((n) => (
                  <li
                    key={n.title}
                    className="flex items-start gap-2 text-xs"
                  >
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {n.date}
                    </span>
                    <span>
                      {n.title}{" "}
                      <span className="text-muted-foreground">— {n.source}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CompetitorsPage() {
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [filterThreat, setFilterThreat] = useState<string>("all");

  const filtered =
    filterThreat === "all"
      ? COMPETITORS
      : COMPETITORS.filter((c) => c.threat === filterThreat);

  const threatCounts = { high: 0, medium: 0, low: 0 };
  for (const c of COMPETITORS) threatCounts[c.threat]++;

  return (
    <>
      <PageHeader title="Competitors" />

      <div className="flex flex-wrap gap-1.5">
        {(["all", "high", "medium", "low"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilterThreat(t)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
              filterThreat === t
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "all"
              ? `All (${COMPETITORS.length})`
              : `${t} (${threatCounts[t]})`}
          </button>
        ))}
      </div>

      <div className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-medium">
            PTP Digital Gap Analysis — 0/8 Channels Active
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-medium">Channel</th>
                <th className="px-4 py-2 text-center font-medium">PTP</th>
                <th className="px-4 py-2 text-center font-medium">
                  Competitor Avg
                </th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {DIGITAL_AUDIT.map((row) => (
                <tr key={row.metric} className="border-b last:border-0">
                  <td className="px-4 py-2.5 font-medium">{row.metric}</td>
                  <td className="px-4 py-2.5 text-center">
                    {row.ptp ? (
                      <span className="text-emerald-600">Yes</span>
                    ) : (
                      <span className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="size-3" />
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center tabular-nums text-muted-foreground">
                    {row.avg}
                  </td>
                  <td className="max-w-[250px] truncate px-4 py-2.5 text-xs text-muted-foreground">
                    {row.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((c) => (
          <CompetitorCard
            key={c.slug}
            competitor={c}
            expanded={expandedSlug === c.slug}
            onToggle={() =>
              setExpandedSlug(expandedSlug === c.slug ? null : c.slug)
            }
          />
        ))}
      </div>
    </>
  );
}

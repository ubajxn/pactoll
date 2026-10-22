import type { Activity } from "@/lib/data/contracts";

/** Return a copy ordered for CRM timelines without mutating adapter data. */
export function latestActivityFirst(activity: Activity[]) {
  return [...activity].sort(
    (a, b) =>
      b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
  );
}

"use client";

import { useRouter } from "next/navigation";
import { RecordDetailPanel } from "@/components/crm/detail-overlay";
import type { RecordKind } from "@/lib/data/contracts";

/**
 * Detail slot used by intercepted collection routes. Slots intercept the named
 * collection one level up, keeping already-rewritten URLs out of the ID matcher.
 */
export function CollectionDetailPanel({
  kind,
  id,
}: {
  kind: RecordKind;
  id: string;
}) {
  const router = useRouter();
  return (
    <RecordDetailPanel kind={kind} id={id} onClose={() => router.back()} />
  );
}

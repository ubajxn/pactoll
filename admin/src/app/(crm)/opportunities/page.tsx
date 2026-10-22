import type { Metadata } from "next";
import { Suspense } from "react";
import { OpportunityCollection } from "@/components/crm/opportunity-collection";

export const metadata: Metadata = { title: "Opportunities" };
export default function Page() {
  return (
    <Suspense>
      <OpportunityCollection />
    </Suspense>
  );
}

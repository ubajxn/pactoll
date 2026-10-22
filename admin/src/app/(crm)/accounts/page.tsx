import type { Metadata } from "next";
import { RecordCollection } from "@/components/crm/record-collection";

export const metadata: Metadata = { title: "Accounts" };

export default function Page() {
  return <RecordCollection kind="accounts" title="Accounts" />;
}

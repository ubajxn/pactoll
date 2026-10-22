import type { Metadata } from "next";
import { RecordCollection } from "@/components/crm/record-collection";

export const metadata: Metadata = { title: "Contacts" };

export default function ContactsPage() {
  return <RecordCollection kind="contacts" title="Contacts" />;
}

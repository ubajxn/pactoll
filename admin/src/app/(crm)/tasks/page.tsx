import type { Metadata } from "next";
import { RecordCollection } from "@/components/crm/record-collection";

export const metadata: Metadata = { title: "Tasks" };

export default function TasksPage() {
  return <RecordCollection kind="tasks" title="Tasks" />;
}

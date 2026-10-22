import type { Metadata } from "next";
import { TeamSettings } from "@/components/crm/team-settings";

export const metadata: Metadata = { title: "Team" };

export default function Page() {
  return <TeamSettings />;
}

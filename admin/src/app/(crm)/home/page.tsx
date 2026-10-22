import type { Metadata } from "next";
import { HomeDashboard } from "@/components/crm/home-dashboard";

export const metadata: Metadata = { title: "Up next" };

export default function Page() {
  return <HomeDashboard />;
}

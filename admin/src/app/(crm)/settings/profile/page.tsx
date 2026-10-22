import type { Metadata } from "next";
import { AccountSettings } from "@/components/auth/account-settings";

export const metadata: Metadata = { title: "Profile" };

export default function Page() {
  return <AccountSettings />;
}

import type { Metadata } from "next";
import { AccountSettings } from "@/components/auth/account-settings";
import { TwoFactorSetup } from "@/components/auth/two-factor-setup";

export const metadata: Metadata = { title: "Profile" };

export default function Page() {
  return (
    <div className="space-y-10">
      <AccountSettings />
      <hr className="border-border" />
      <TwoFactorSetup />
    </div>
  );
}

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Onboarding } from "@/components/auth/onboarding";
import { safeReturnTo } from "@/lib/auth/redirect";
import { workspaceSession } from "@/lib/auth/server";
export const metadata = { title: "Company access" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeReturnTo((await searchParams).next);
  const account = await workspaceSession(await headers());
  if (account === "unauthorized")
    redirect(`/login?next=${encodeURIComponent(next)}`);
  if (next.startsWith("/invite/") || account !== "workspace_required")
    redirect(next);
  return <Onboarding />;
}

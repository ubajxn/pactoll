import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { safeReturnTo } from "@/lib/auth/redirect";
import { registrationStatus } from "@/lib/auth/server";
export const metadata = { title: "Sign in" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { signupAllowed } = await registrationStatus();
  const invitationId = /^\/invite\/([^/?]+)$/.exec(
    safeReturnTo(params.next),
  )?.[1];
  return (
    <AuthCard
      title={signupAllowed ? "Set up your company" : "Welcome back"}
      description={
        signupAllowed
          ? "Create the first account to get started. You can invite your team once you’re signed in."
          : "Sign in with a link sent to your email. New accounts require an invitation from your company."
      }
    >
      <LoginForm
        next={params.next}
        invalidLink={Boolean(params.error)}
        signupAllowed={signupAllowed}
        invitationId={invitationId}
      />
    </AuthCard>
  );
}

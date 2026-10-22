"use client";
import { useEffect, useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export function Invitation({ id }: { id: string }) {
  const {
    data: session,
    isPending,
    error: sessionError,
  } = authClient.useSession();
  const [invitation, setInvitation] = useState<{
    organizationName: string;
    email: string;
    status: string;
    expiresAt: Date | string;
  } | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (!session) return;
    let active = true;
    authClient.organization
      .getInvitation({ query: { id } })
      .then((result) => {
        if (!active) return;
        if (result.error)
          setError(
            result.error.message ||
              "This invitation is unavailable. Sign in with the invited email or ask for a new invitation.",
          );
        else setInvitation(result.data);
      })
      .catch(() => {
        if (active)
          setError("Could not load this invitation. Refresh to retry.");
      });
    return () => {
      active = false;
    };
  }, [id, session]);
  async function accept() {
    setPending(true);
    setError("");
    try {
      const result = await authClient.organization.acceptInvitation({
        invitationId: id,
      });
      if (result.error || !result.data) {
        setError(result.error?.message || "Could not accept invitation");
        return;
      }
      window.location.assign("/home");
    } catch {
      setError("Could not accept your invitation. Try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <AuthCard
      title={
        invitation ? `Join ${invitation.organizationName}` : "Join your team"
      }
      description="Sign in with the invited email to accept your invitation."
    >
      {isPending ? (
        <output>Checking your account…</output>
      ) : sessionError ? (
        <p role="alert">Could not check your session. Refresh to retry.</p>
      ) : !session ? (
        <LoginForm
          next={`/invite/${encodeURIComponent(id)}`}
          invitationId={id}
        />
      ) : (
        <div className="space-y-4">
          <p className="text-sm">Signed in as {session.user.email}</p>
          {invitation &&
            (invitation.status !== "pending" ||
            new Date(invitation.expiresAt) <= new Date() ? (
              <output className="text-sm">
                This invitation has expired or has already been used.
              </output>
            ) : (
              <Button onClick={() => void accept()} disabled={pending}>
                {pending ? "Joining…" : "Accept invitation"}
              </Button>
            ))}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {!invitation && !error && (
            <output className="text-sm">Loading invitation…</output>
          )}
          <Button
            variant="outline"
            disabled={pending}
            onClick={async () => {
              const result = await authClient.signOut();
              if (result.error)
                setError(result.error.message || "Could not sign out");
              else window.location.reload();
            }}
          >
            Use a different account
          </Button>
        </div>
      )}
    </AuthCard>
  );
}

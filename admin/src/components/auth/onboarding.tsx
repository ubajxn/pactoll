"use client";
import { useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export function Onboarding() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <AuthCard
      title="Invitation required"
      description="Open the invitation link in your email to join your company. If your access was removed, ask a company admin for a new invitation."
    >
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button
        variant="outline"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError("");
          try {
            const result = await authClient.signOut();
            if (result.error)
              setError(result.error.message || "Could not sign out");
            else window.location.assign("/login");
          } catch {
            setError("Could not sign out. Try again.");
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Signing out…" : "Sign out"}
      </Button>
    </AuthCard>
  );
}

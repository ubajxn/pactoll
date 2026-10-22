"use client";

import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <AuthCard
      title="Could not load CRM"
      description="The service may be temporarily unavailable. Try again, or contact your administrator if the problem continues."
    >
      <Button className="w-full" onClick={retry}>
        Try again
      </Button>
    </AuthCard>
  );
}

import type { ReactNode } from "react";
import { PlatformLogo } from "@/components/crm/platform-identity";
export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <section className="w-full max-w-sm space-y-6">
        <div className="space-y-3">
          <PlatformLogo className="size-7" />
          <h1 className="text-2xl font-medium tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </section>
    </main>
  );
}

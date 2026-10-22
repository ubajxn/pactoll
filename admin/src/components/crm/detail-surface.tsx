import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared inset surface for record pages and contextual detail panels. */
export function DetailSurface({
  toolbar,
  children,
  className,
}: {
  toolbar: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-border bg-background shadow-[0_8px_24px_#0000000f]",
        className,
      )}
    >
      <div className="flex h-11 shrink-0 items-center justify-between gap-5 p-2.5">
        {toolbar}
      </div>
      <div
        data-detail-scroll
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-6 sm:px-8"
      >
        {children}
      </div>
    </section>
  );
}

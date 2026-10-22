import { cn } from "cn";
import { ChevronDown } from "lucide-react";
import type * as React from "react";

function NativeSelect({
  className,
  wrapperClassName,
  ...props
}: React.ComponentProps<"select"> & { wrapperClassName?: string }) {
  return (
    <div
      className={cn(
        "relative inline-grid has-disabled:opacity-50",
        wrapperClassName,
      )}
    >
      <select
        data-slot="native-select"
        className={cn(
          "h-8 w-full min-w-0 appearance-none rounded-control border bg-background py-1 pr-8 pl-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          className,
        )}
        {...props}
      />
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

export { NativeSelect };

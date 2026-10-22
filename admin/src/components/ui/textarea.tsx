import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";

const textareaVariants = cva(
  "flex field-sizing-content w-full resize-none rounded-control border px-2.5 text-base transition-[background-color,border-color,color,box-shadow] duration-200 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 motion-reduce:transition-none",
  {
    variants: {
      variant: {
        default: "min-h-16 border-input bg-background py-2",
        inline:
          "min-h-8 border-transparent bg-transparent py-1.5 hover:bg-muted focus:border-ring focus:bg-muted focus:ring-3 focus:ring-ring/30",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Textarea({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Textarea };

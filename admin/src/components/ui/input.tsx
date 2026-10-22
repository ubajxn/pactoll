import { Input as InputPrimitive } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";

const inputVariants = cva(
  "h-8 w-full min-w-0 rounded-control border px-2.5 py-1 text-base transition-[background-color,border-color,color,box-shadow] duration-200 outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 motion-reduce:transition-none",
  {
    variants: {
      variant: {
        default: "border-input bg-background",
        inline:
          "border-transparent bg-transparent hover:bg-muted focus:border-ring focus:bg-muted focus:ring-3 focus:ring-ring/30",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Input({
  className,
  type,
  variant = "default",
  ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Input };

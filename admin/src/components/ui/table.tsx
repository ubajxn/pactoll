"use client";

import { cn } from "cn";
import type * as React from "react";

function Table({
  className,
  stickyFirstColumn = false,
  ...props
}: React.ComponentProps<"table"> & { stickyFirstColumn?: boolean }) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full scroll-fade-x overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn(
          "w-full min-w-max caption-bottom text-sm [&_tr>:not(:last-child)]:after:pointer-events-none [&_tr>:not(:last-child)]:after:absolute [&_tr>:not(:last-child)]:after:inset-y-0 [&_tr>:not(:last-child)]:after:right-0 [&_tr>:not(:last-child)]:after:w-px [&_tr>:not(:last-child)]:after:bg-border",
          stickyFirstColumn &&
            "[&_tr>:first-child]:sticky [&_tr>:first-child]:left-0 [&_tr>:first-child]:z-10 [&_tr>:first-child]:bg-inherit",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b bg-background transition-colors hover:bg-[color-mix(in_srgb,var(--muted)_50%,var(--background))] has-aria-expanded:bg-[color-mix(in_srgb,var(--muted)_50%,var(--background))] data-[state=selected]:bg-muted motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "relative h-9 px-4 text-left align-middle text-xs font-medium whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "relative h-11 px-4 py-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableHead, TableRow, TableCell };

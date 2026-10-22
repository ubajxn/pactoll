"use client";

import { Filter, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface CollectionFilter {
  key: string;
  label: string;
  icon: LucideIcon;
  options: { value: string; label: string; icon?: ReactNode }[];
}

export function CollectionFilterMenu({
  label,
  filters,
  values,
  onChange,
}: {
  label: string;
  filters: CollectionFilter[];
  values: Pick<URLSearchParams, "get">;
  onChange: (key: string, value: string) => void;
}) {
  const filterCount = filters.filter(({ key }) => values.get(key)).length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <Filter />
        Filter
        {filterCount > 0 && (
          <span className="rounded bg-muted px-1">{filterCount}</span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56 rounded-lg"
        aria-label={`Filter ${label}`}
      >
        {filters.map(({ key, label, icon: Icon, options }) => (
          <DropdownMenuSub key={key}>
            <DropdownMenuSubTrigger className="rounded-control">
              <Icon />
              {label}
              {values.get(key) && (
                <span className="size-1.5 rounded-full bg-primary">
                  <span className="sr-only">Filter active</span>
                </span>
              )}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56 rounded-lg" sideOffset={4}>
              <DropdownMenuRadioGroup
                aria-label={`Filter by ${key}`}
                value={values.get(key) ?? ""}
                onValueChange={(value: string) => onChange(key, value)}
              >
                {options.map((option) => (
                  <DropdownMenuRadioItem
                    key={option.value}
                    value={option.value}
                    className="rounded-control"
                    closeOnClick
                  >
                    {option.icon}
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";
import { Search, X } from "lucide-react";
import { useRef, useState } from "react";
import {
  type CollectionFilter,
  CollectionFilterMenu,
} from "@/components/crm/collection-filter-menu";
import {
  ColumnDisplay,
  type ColumnDisplayState,
} from "@/components/crm/column-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CollectionControls({
  title,
  filters,
  params,
  updateFilters,
  onClear,
  display,
}: {
  display: ColumnDisplayState;
  title: string;
  filters: CollectionFilter[];
  params: Pick<URLSearchParams, "get">;
  updateFilters: (values: Record<string, string>, replace?: boolean) => void;
  onClear: () => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const query = params.get("q") ?? "";
  const activeFilters = filters.filter(({ key }) => params.get(key));
  function clearFilters() {
    onClear();
    setSearchOpen(false);
  }
  return (
    <>
      <div
        data-collection-controls
        className="-mx-6 flex min-h-11 flex-wrap items-center gap-2 border-b px-6 py-2 sm:-mx-8 lg:-mx-10"
      >
        <CollectionFilterMenu
          label={title.toLowerCase()}
          filters={filters}
          values={params}
          onChange={(key, value) => updateFilters({ [key]: value })}
        />
        {searchOpen || query ? (
          <Input
            ref={searchRef}
            aria-label={`Find ${title.toLowerCase()}`}
            placeholder={`Find ${title.toLowerCase()}…`}
            value={query}
            className="h-7 w-40 sm:w-52"
            onChange={(event) => updateFilters({ q: event.target.value }, true)}
            onBlur={(event) => {
              if (!event.currentTarget.value) setSearchOpen(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                updateFilters({ q: "" });
                setSearchOpen(false);
              }
            }}
          />
        ) : (
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Find ${title.toLowerCase()}`}
            onClick={() => {
              setSearchOpen(true);
              requestAnimationFrame(() => searchRef.current?.focus());
            }}
          >
            <Search />
          </Button>
        )}
        <ColumnDisplay display={display} />
      </div>
      {(activeFilters.length > 0 || query) && (
        <div className="-mx-6 flex flex-wrap items-center gap-2 border-b px-6 py-2 sm:-mx-8 lg:-mx-10">
          {activeFilters.map(({ key, label, options }) => (
            <Button
              key={key}
              size="sm"
              variant="secondary"
              className="font-normal"
              aria-label={`Remove ${key} filter`}
              onClick={() => updateFilters({ [key]: "" })}
            >
              {label}:{" "}
              {options.find((option) => option.value === params.get(key))
                ?.label ?? params.get(key)}
              <X />
            </Button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            className="font-normal text-muted-foreground"
            onClick={clearFilters}
          >
            Clear all
          </Button>
        </div>
      )}
    </>
  );
}

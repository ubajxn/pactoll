"use client";

import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function dateFromKey(value: string | null): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : undefined;
}

function dateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function DatePicker({
  id,
  name,
  label,
  value,
  defaultValue = null,
  onValueChange,
  disabled = false,
  variant = "default",
  placeholder,
  error,
  pending = false,
}: {
  id: string;
  name?: string;
  label: string;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  disabled?: boolean;
  variant?: "default" | "inline";
  placeholder?: string;
  error?: string;
  pending?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string | null>(
    defaultValue,
  );
  const currentValue = value === undefined ? internalValue : value;
  const selected = dateFromKey(currentValue);
  const display = selected?.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  function select(next: string | null) {
    if (value === undefined) setInternalValue(next);
    onValueChange?.(next);
    setOpen(false);
  }

  return (
    <>
      {name && <input type="hidden" name={name} value={currentValue ?? ""} />}
      <Popover open={open && !disabled} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button variant={variant === "inline" ? "inline" : "outline"} />
          }
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            "w-full min-w-0 justify-start font-normal",
            variant === "inline" && "disabled:opacity-100",
          )}
          aria-label={`${label}: ${display ?? "No date"}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-busy={pending}
        >
          <CalendarDays
            aria-hidden="true"
            className="size-4 text-muted-foreground"
          />
          <span
            className={cn(
              "min-w-0 truncate",
              !display && "text-muted-foreground",
            )}
          >
            {display ?? placeholder ?? `Select ${label.toLowerCase()}…`}
          </span>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto gap-0 rounded-control p-0"
        >
          <PopoverTitle className="sr-only">
            Choose {label.toLowerCase()}
          </PopoverTitle>
          <Calendar
            key={currentValue ?? "empty"}
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={(date) => {
              if (date) select(dateKey(date));
            }}
            captionLayout="dropdown"
            startMonth={new Date(1900, 0)}
            endMonth={new Date(2100, 11)}
          />
          <div className="border-t p-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="w-full"
              disabled={!currentValue}
              onClick={() => select(null)}
            >
              Clear date
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}

"use client";

import { Select } from "@base-ui/react/select";
import { Check, ChevronsUpDown, X } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type FieldChoice = {
  id: string;
  name: string;
  icon?: ReactNode;
  typeLabel?: string;
  href?: string;
  description?: string;
  keywords?: string[];
};

type ChoiceFieldProps = {
  id: string;
  name: string;
  label: string;
  choices: FieldChoice[];
  disabled?: boolean;
  error?: string;
  variant?: "default" | "inline";
  showLabel?: boolean;
};

export function RecordPicker({
  id,
  name,
  label,
  choices,
  multiple = false,
  selectedFirst = false,
  linkedSelection = false,
  defaultValue = [],
  emptyLabel = "None",
  searchLabel = `Search ${label.toLowerCase()}`,
  disabled,
  error,
  value,
  onValueChange,
  variant = "default",
  showLabel = true,
}: ChoiceFieldProps & {
  multiple?: boolean;
  selectedFirst?: boolean;
  linkedSelection?: boolean;
  defaultValue?: string[];
  emptyLabel?: string;
  searchLabel?: string;
  value?: string[];
  onValueChange?: (value: string[]) => void;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selected = value ?? internalValue;
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const current = choices.find((choice) => choice.id === selected[0]);
  const orderedChoices = selectedFirst
    ? [
        ...choices.filter((choice) => selected.includes(choice.id)),
        ...choices.filter((choice) => !selected.includes(choice.id)),
      ]
    : choices;
  function select(optionValue: string) {
    const next = multiple
      ? selected.includes(optionValue)
        ? selected.filter((id) => id !== optionValue)
        : [...selected, optionValue]
      : optionValue
        ? [optionValue]
        : [];
    if (value === undefined) setInternalValue(next);
    onValueChange?.(next);
    if (!multiple) setOpen(false);
  }
  return (
    <div className={showLabel ? "grid gap-1.5" : "min-w-0"}>
      <label
        id={`${id}-label`}
        htmlFor={id}
        className={showLabel ? "text-sm font-medium" : "sr-only"}
      >
        {label}
      </label>
      {selected.map((value) => (
        <input
          key={value}
          type="hidden"
          name={name}
          value={value}
          disabled={disabled}
        />
      ))}
      <Popover open={open && !disabled} onOpenChange={setOpen}>
        {linkedSelection && variant === "inline" ? (
          <div className="relative flex min-h-8 w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-control py-1 pr-8 pl-2.5 text-sm hover:bg-muted">
            {selected.length ? (
              selected.map((value) => {
                const choice = choices.find((item) => item.id === value);
                if (!choice)
                  return (
                    <span key={value} className="relative z-10 wrap-anywhere">
                      {value}
                    </span>
                  );
                const content = (
                  <>
                    {choice.icon}
                    <span className="min-w-0 wrap-anywhere">{choice.name}</span>
                    {choice.typeLabel && (
                      <span className="sr-only"> {choice.typeLabel}</span>
                    )}
                  </>
                );
                return choice.href ? (
                  <Link
                    key={value}
                    href={choice.href}
                    className="relative z-10 inline-flex max-w-full items-center gap-1 rounded-control text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {content}
                  </Link>
                ) : (
                  <span
                    key={value}
                    className="relative z-10 inline-flex max-w-full items-center gap-1"
                  >
                    {content}
                  </span>
                );
              })
            ) : (
              <span className="pointer-events-none relative z-10 text-muted-foreground">
                Set {label.toLowerCase()}…
              </span>
            )}
            <ChevronsUpDown
              aria-hidden="true"
              className="pointer-events-none absolute top-2.5 right-2.5 z-10 size-3.5 text-muted-foreground"
            />
            {/* Keep the full surface clickable while record links remain separate interactive elements. */}
            <PopoverTrigger
              ref={triggerRef}
              render={<Button variant="inline" />}
              id={id}
              type="button"
              disabled={disabled}
              className="absolute inset-0 h-full w-full p-0"
              aria-label={`Edit ${label.toLowerCase()}`}
              aria-invalid={!!error}
              aria-describedby={error ? `${id}-error` : undefined}
            />
          </div>
        ) : (
          <PopoverTrigger
            ref={triggerRef}
            render={
              <Button variant={variant === "inline" ? "inline" : "outline"} />
            }
            id={id}
            type="button"
            disabled={disabled}
            className="w-full min-w-0 justify-start font-normal"
            aria-labelledby={`${id}-label ${id}-value`}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
          >
            {!multiple && current?.icon}
            <span
              id={`${id}-value`}
              className="min-w-0 flex-1 truncate text-left"
            >
              {multiple
                ? selected.length
                  ? variant === "inline"
                    ? selected
                        .map(
                          (value) =>
                            choices.find((choice) => choice.id === value)
                              ?.name ?? value,
                        )
                        .join(", ")
                    : `${selected.length} selected`
                  : variant === "inline"
                    ? `Set ${label.toLowerCase()}…`
                    : `Select ${label.toLowerCase()}…`
                : (current?.name ?? emptyLabel)}
            </span>
            <ChevronsUpDown
              aria-hidden="true"
              className="ml-auto size-3.5 text-muted-foreground"
            />
          </PopoverTrigger>
        )}
        <PopoverContent
          align="start"
          className="w-(--anchor-width) max-w-(--available-width) overflow-hidden rounded-control p-0"
        >
          <Command
            className="rounded-control"
            filter={(_value, search, keywords) => {
              const terms = search.trim().toLocaleLowerCase().split(/\s+/);
              const text = (keywords ?? []).join(" ").toLocaleLowerCase();
              return terms.every((term) => text.includes(term)) ? 1 : 0;
            }}
          >
            <CommandInput
              placeholder={`${searchLabel}…`}
              aria-label={searchLabel}
            />
            <CommandList className="max-h-[min(18rem,calc(var(--available-height)-3rem))]">
              <CommandEmpty>No matches found.</CommandEmpty>
              {!multiple && (
                <CommandItem
                  value="__none__"
                  keywords={[emptyLabel]}
                  data-checked={!selected.length}
                  onSelect={() => select("")}
                >
                  {emptyLabel}
                </CommandItem>
              )}
              {orderedChoices.map((choice) => (
                <CommandItem
                  key={choice.id}
                  value={choice.id}
                  keywords={[
                    choice.name,
                    choice.description ?? "",
                    ...(choice.keywords ?? []),
                  ]}
                  data-checked={selected.includes(choice.id)}
                  onSelect={() => select(choice.id)}
                >
                  {choice.icon}
                  <span className="min-w-0">
                    <span className="block truncate">
                      {choice.name}
                      {choice.typeLabel && (
                        <span className="sr-only"> {choice.typeLabel}</span>
                      )}
                    </span>
                    {choice.description && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {choice.description}
                      </span>
                    )}
                  </span>
                  {multiple && (
                    <span className="sr-only">
                      {selected.includes(choice.id)
                        ? "Selected"
                        : "Not selected"}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {multiple && variant !== "inline" && selected.length > 0 && (
        <ul
          aria-label={`Selected ${label.toLowerCase()}`}
          className="flex flex-wrap gap-1.5"
        >
          {selected.map((value) => {
            const choice = choices.find((choice) => choice.id === value);
            return (
              <li
                key={value}
                className="inline-flex max-w-full items-center gap-1 rounded-control bg-muted py-1 pr-1 pl-2 text-xs"
              >
                {choice?.icon}
                <span className="break-words min-w-0">
                  {choice?.name ?? value}
                  {choice?.typeLabel && (
                    <span className="sr-only"> {choice.typeLabel}</span>
                  )}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="size-5 shrink-0"
                  disabled={disabled}
                  aria-label={`Remove ${choice?.name ?? value}${choice?.typeLabel ? ` ${choice.typeLabel}` : ""}`}
                  onClick={() => {
                    select(value);
                    triggerRef.current?.focus();
                  }}
                >
                  <X aria-hidden="true" className="size-3" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function ChoiceSelect({
  id,
  name,
  label,
  choices,
  defaultValue,
  disabled,
  error,
  value: controlledValue,
  onValueChange,
  placeholder,
  placeholderIcon,
  variant = "default",
  showLabel = true,
}: ChoiceFieldProps & {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  placeholderIcon?: ReactNode;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = controlledValue ?? internalValue;
  const current = choices.find((choice) => choice.id === value);
  return (
    <div className={showLabel ? "grid gap-1.5" : "min-w-0"}>
      <label
        id={`${id}-label`}
        htmlFor={id}
        className={showLabel ? "text-sm font-medium" : "sr-only"}
      >
        {label}
      </label>
      <Select.Root
        name={name}
        value={value || null}
        onValueChange={(value) => {
          if (value === null) return;
          if (controlledValue === undefined) setInternalValue(value);
          onValueChange?.(value);
        }}
        disabled={disabled}
      >
        <Select.Trigger
          id={id}
          aria-labelledby={`${id}-label ${id}-value`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          render={
            <Button
              variant={variant === "inline" ? "inline" : "outline"}
              className="w-full justify-start font-normal"
            />
          }
        >
          {current?.icon ?? placeholderIcon}
          <span
            id={`${id}-value`}
            className={current ? undefined : "text-muted-foreground"}
          >
            {current?.name ?? placeholder}
          </span>
          <Select.Icon className="ml-auto">
            <ChevronsUpDown
              aria-hidden="true"
              className="size-3.5 text-muted-foreground"
            />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            alignItemWithTrigger={false}
            sideOffset={4}
            className="z-50"
          >
            <Select.Popup className="max-h-(--available-height) w-(--anchor-width) overflow-y-auto rounded-control bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10">
              {choices.map((choice) => (
                <Select.Item
                  key={choice.id}
                  value={choice.id}
                  className="flex cursor-default items-center gap-2 rounded-control px-2 py-1.5 text-sm outline-none data-highlighted:bg-muted"
                >
                  {choice.icon}
                  <Select.ItemText>{choice.name}</Select.ItemText>
                  <Select.ItemIndicator className="ml-auto">
                    <Check aria-hidden="true" className="size-4" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

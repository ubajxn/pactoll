"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CircleDashed,
  DollarSign,
  Globe,
  GripVertical,
  Handshake,
  Link2,
  ListTodo,
  Mail,
  MapPin,
  Phone,
  Settings2,
  Text,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TableHead } from "@/components/ui/table";
import {
  type ColumnPreferences,
  constrainColumnOrder,
  moveColumn,
  normalizeColumns,
} from "@/lib/column-preferences";

export type DisplayColumn = { id: string; label: string };
export function useColumnDisplay(
  key: string,
  definitions: DisplayColumn[],
  defaultHidden: string[] = [],
  reorderable = true,
) {
  const schema = JSON.stringify({
    ids: definitions.map((column) => column.id),
    defaultHidden,
  });
  const [saved, setSaved] = useState<{
    key: string;
    value: ColumnPreferences;
  } | null>(null);
  useEffect(() => {
    const { ids, defaultHidden } = JSON.parse(schema);
    let value: unknown;
    try {
      const cookie = document.cookie
        .split("; ")
        .find((item) => item.startsWith(`crm-columns-${key}=`));
      if (cookie)
        value = JSON.parse(
          decodeURIComponent(cookie.slice(cookie.indexOf("=") + 1)),
        );
    } catch {
      /* Invalid or unavailable cookies use defaults. */
    }
    setSaved({ key, value: normalizeColumns(value, ids, defaultHidden) });
  }, [key, schema]);
  const [dropTarget, setDropTarget] = useState<{
    id: string;
    side: "left" | "right";
  } | null>(null);
  const preferences = constrainColumnOrder(
    normalizeColumns(
      saved?.key === key ? saved.value : null,
      definitions.map((column) => column.id),
      defaultHidden,
    ),
    definitions.map((column) => column.id),
    reorderable,
  );
  function update(value: ColumnPreferences) {
    setSaved({ key, value });
    try {
      // biome-ignore lint/suspicious/noDocumentCookie: browser-local preferences also support browsers without Cookie Store.
      document.cookie = `crm-columns-${key}=${encodeURIComponent(JSON.stringify(value))}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    } catch {
      /* Controls remain usable when cookies are blocked. */
    }
  }
  const visible = preferences.order.filter(
    (id) => !preferences.hidden.includes(id),
  );
  return {
    definitions,
    dropTarget,
    setDropTarget,
    canReorder(id: string) {
      return reorderable && id !== definitions[0]?.id && id !== visible[0];
    },
    preferences,
    visible,
    toggle(id: string) {
      if (visible.length === 1 && visible.includes(id)) return;
      update({
        ...preferences,
        hidden: preferences.hidden.includes(id)
          ? preferences.hidden.filter((item) => item !== id)
          : [...preferences.hidden, id],
      });
    },
    move(source: string, target: string) {
      if (
        !reorderable ||
        source === definitions[0]?.id ||
        target === definitions[0]?.id ||
        source === visible[0] ||
        target === visible[0]
      )
        return;
      update(moveColumn(preferences, source, target));
    },
    reset() {
      update(
        normalizeColumns(
          null,
          definitions.map((column) => column.id),
          defaultHidden,
        ),
      );
    },
    arrange<T>(items: T[], id: (item: T) => string): T[] {
      return visible.flatMap((key) => items.filter((item) => id(item) === key));
    },
  };
}
export type ColumnDisplayState = ReturnType<typeof useColumnDisplay>;

export function columnIcon(id: string) {
  return (
    (
      {
        name: Text,
        title: ListTodo,
        website: Globe,
        owner: UserRound,
        assignee: UserRound,
        industry: BriefcaseBusiness,
        revenue: DollarSign,
        amount: DollarSign,
        headcount: Users,
        location: MapPin,
        createdAt: CalendarDays,
        dueDate: CalendarDays,
        closeDate: CalendarDays,
        contactCount: Users,
        opportunityCount: Handshake,
        email: Mail,
        phone: Phone,
        role: BriefcaseBusiness,
        account: Building2,
        stage: CircleDashed,
        relatedRecords: Link2,
        linkedin: Globe,
        facebook: Globe,
        instagram: Globe,
        twitter: Globe,
        nextStep: ListTodo,
      } as Record<string, typeof Text>
    )[id] ?? Text
  );
}
export function ColumnOptions({
  display,
  exclude = [],
}: {
  display: ColumnDisplayState;
  exclude?: string[];
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Display properties</p>
      {display.preferences.order.map((id) => {
        const column = display.definitions.find((column) => column.id === id);
        if (!column || exclude.includes(id)) return null;
        const Icon = columnIcon(id);
        return (
          <label key={id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-3.5 accent-primary outline-none"
              checked={display.visible.includes(id)}
              disabled={
                display.visible.length === 1 && display.visible.includes(id)
              }
              onChange={() => display.toggle(id)}
            />
            <Icon
              aria-hidden="true"
              className="size-3.5 text-muted-foreground"
            />
            {column.label}
          </label>
        );
      })}
    </div>
  );
}
export function ColumnDisplay({ display }: { display: ColumnDisplayState }) {
  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant="outline" size="sm" className="ml-auto" />}
      >
        <Settings2 />
        Display
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="max-h-[70vh] w-64 overflow-y-auto rounded-lg"
      >
        <PopoverTitle className="sr-only">Display columns</PopoverTitle>
        <ColumnOptions display={display} />
        <Button size="sm" variant="ghost" onClick={display.reset}>
          Reset display
        </Button>
      </PopoverContent>
    </Popover>
  );
}
export function ColumnHeader({
  id,
  label,
  display,
  sorted = false,
  onSort,
}: {
  id: string;
  label: string;
  display: ColumnDisplayState;
  sorted?: false | "asc" | "desc";
  onSort?: () => void;
}) {
  const Icon = columnIcon(id);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const [preview, setPreview] = useState<{ x: number; y: number } | null>(null);
  const reorderable = display.canReorder(id);
  function cancelDrag() {
    gesture.current = null;
    setPreview(null);
    display.setDropTarget(null);
  }
  const [announcement, setAnnouncement] = useState("");
  function move(target: string) {
    if (!reorderable || !display.canReorder(target)) return;
    display.move(id, target);
    setAnnouncement(
      `${label} moved ${display.preferences.order.indexOf(target) < display.preferences.order.indexOf(id) ? "left" : "right"}.`,
    );
  }
  return (
    <TableHead
      data-column-id={id}
      className={`group/column ${preview ? "bg-muted" : ""}`}
      aria-sort={
        onSort
          ? sorted === "asc"
            ? "ascending"
            : sorted === "desc"
              ? "descending"
              : "none"
          : undefined
      }
    >
      {display.dropTarget?.id === id && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-primary ${display.dropTarget.side === "left" ? "left-0" : "right-0"}`}
        />
      )}
      {preview &&
        createPortal(
          <div
            aria-hidden="true"
            className="pointer-events-none fixed z-[100] flex items-center gap-2 rounded-md border bg-popover px-3 py-2 text-xs font-medium text-popover-foreground shadow-lg"
            style={{ left: preview.x + 12, top: preview.y + 12 }}
          >
            <GripVertical className="size-3.5" />
            <Icon className="size-3.5" />
            {label}
          </div>,
          document.body,
        )}
      <div className="flex h-8 items-center gap-2">
        {reorderable ? (
          <button
            type="button"
            className="relative flex size-5 shrink-0 touch-none items-center justify-center rounded cursor-grab active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-ring"
            aria-label={`Reorder ${label}. Use Left and Right arrow keys.`}
            title="Drag to reorder. Use Left or Right arrow keys when focused."
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              gesture.current = {
                x: event.clientX,
                y: event.clientY,
              };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              const start = gesture.current;
              if (
                !start ||
                Math.hypot(event.clientX - start.x, event.clientY - start.y) < 5
              )
                return;
              setPreview({ x: event.clientX, y: event.clientY });
              const header = document
                .elementFromPoint(event.clientX, event.clientY)
                ?.closest<HTMLElement>("th[data-column-id]");
              const target = header?.dataset.columnId;
              display.setDropTarget(
                header?.closest("table") ===
                  event.currentTarget.closest("table") &&
                  target &&
                  target !== id &&
                  display.canReorder(target)
                  ? {
                      id: target,
                      side:
                        display.visible.indexOf(target) <
                        display.visible.indexOf(id)
                          ? "left"
                          : "right",
                    }
                  : null,
              );
            }}
            onPointerUp={(event) => {
              const start = gesture.current;
              cancelDrag();
              if (event.currentTarget.hasPointerCapture(event.pointerId))
                event.currentTarget.releasePointerCapture(event.pointerId);
              if (
                !start ||
                Math.hypot(event.clientX - start.x, event.clientY - start.y) < 5
              )
                return;
              const header = document
                .elementFromPoint(event.clientX, event.clientY)
                ?.closest<HTMLElement>("th[data-column-id]");
              if (
                header?.closest("table") ===
                  event.currentTarget.closest("table") &&
                header?.dataset.columnId &&
                header.dataset.columnId !== id
              )
                move(header.dataset.columnId);
            }}
            onPointerCancel={() => {
              cancelDrag();
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                cancelDrag();
                return;
              }
              if (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
                return;
              event.preventDefault();
              const target =
                display.visible[
                  display.visible.indexOf(id) +
                    (event.key === "ArrowLeft" ? -1 : 1)
                ];
              if (target) move(target);
            }}
          >
            <Icon
              aria-hidden="true"
              className="size-3.5 group-hover/column:opacity-0 group-focus-within/column:opacity-0"
            />
            <GripVertical
              aria-hidden="true"
              className="absolute size-3.5 opacity-0 group-hover/column:opacity-100 group-focus-within/column:opacity-100"
            />
          </button>
        ) : (
          <span className="flex size-5 shrink-0 items-center justify-center">
            <Icon aria-hidden="true" className="size-3.5" />
          </span>
        )}
        {onSort ? (
          <button
            type="button"
            onClick={onSort}
            className="flex h-full flex-1 items-center justify-between gap-4 text-left outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span>{label}</span>
            <span
              aria-hidden="true"
              className={`ml-auto ${sorted ? "text-foreground" : "opacity-0 group-hover/column:opacity-100 group-focus-within/column:opacity-100"}`}
            >
              {sorted === "asc" ? (
                <ArrowUp className="size-3.5" />
              ) : sorted === "desc" ? (
                <ArrowDown className="size-3.5" />
              ) : (
                <ArrowUpDown className="size-3.5" />
              )}
            </span>
          </button>
        ) : (
          <span>{label}</span>
        )}
        <span className="sr-only" aria-live="polite">
          {announcement}
        </span>
      </div>
    </TableHead>
  );
}

"use client";

import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { CalendarDays, CircleCheck, Plus, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { CollectionControls } from "@/components/crm/collection-controls";
import type { CollectionFilter } from "@/components/crm/collection-filter-menu";
import {
  type ColumnDisplayState,
  ColumnHeader,
  useColumnDisplay,
} from "@/components/crm/column-display";
import { CreateRecord } from "@/components/crm/create-record";
import { MemberAvatar } from "@/components/crm/member-picker";
import { PageHeader, PageHeading } from "@/components/crm/page-header";
import { RecordNameLink } from "@/components/crm/record-detail-actions";
import { TaskStatusIcon } from "@/components/crm/status-icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RecordKind, Task } from "@/lib/data/contracts";
import { useData } from "@/lib/data/provider";
import { matchesSearch, searchRecord } from "@/lib/search";
import {
  isOverdueTask,
  taskMatchesStatusFilter,
  taskStatusLabels,
  taskStatusOptions,
} from "@/lib/tasks";

type RelatedNames = Record<RecordKind, Map<string, string>>;
type TaskGroup = "Overdue" | "Today" | "Tomorrow" | "Upcoming" | "No due date";

const taskGroups: TaskGroup[] = [
  "Overdue",
  "Today",
  "Tomorrow",
  "Upcoming",
  "No due date",
];

const tableFeaturesWithSorting = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
});

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function offsetDate(date: string, days: number) {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function taskGroup(task: Task, today = todayKey()): TaskGroup {
  if (!task.dueDate) return "No due date";
  if (task.dueDate < today) return "Overdue";
  if (task.dueDate === today) return "Today";
  if (task.dueDate === offsetDate(today, 1)) return "Tomorrow";
  return "Upcoming";
}

function formatDueDate(dueDate: string | null) {
  if (!dueDate) return "—";
  const date = new Date(`${dueDate}T12:00:00`);
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year:
      date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  }).format(date);
}

/** Task table using the same sortable collection treatment as accounts. */
export function TaskCollection({ title }: { title: string }) {
  return (
    <Suspense fallback={null}>
      <TaskCollectionContent title={title} />
    </Suspense>
  );
}
function TaskCollectionContent({ title }: { title: string }) {
  const display = useColumnDisplay(
    "tasks",
    [
      { id: "title", label: "Task" },
      { id: "assignee", label: "Assignee" },
      { id: "dueDate", label: "Due date" },
      { id: "relatedRecords", label: "Related records" },
    ],
    [],
    false,
  );
  const params = useSearchParams();
  const pathname = usePathname();
  const data = useData();
  const createTrigger = useRef<HTMLButtonElement>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [relatedNames, setRelatedNames] = useState<RelatedNames>(() => ({
    accounts: new Map(),
    contacts: new Map(),
    opportunities: new Map(),
    tasks: new Map(),
  }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [saveError, setSaveError] = useState("");
  const updatingIdsRef = useRef(new Set<string>());
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const refresh = () => setAttempt((value) => value + 1);
    window.addEventListener("crm:tasks-changed", refresh);
    return () => window.removeEventListener("crm:tasks-changed", refresh);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt explicitly retries the supplied adapter.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    Promise.all([
      data.list("tasks"),
      data.list("accounts"),
      data.list("contacts"),
      data.list("opportunities"),
    ]).then(
      ([loadedTasks, accounts, contacts, opportunities]) => {
        if (cancelled) return;
        setTasks(loadedTasks);
        setRelatedNames({
          accounts: new Map(accounts.map((record) => [record.id, record.name])),
          contacts: new Map(contacts.map((record) => [record.id, record.name])),
          opportunities: new Map(
            opportunities.map((record) => [record.id, record.name]),
          ),
          tasks: new Map(),
        });
        setLoading(false);
      },
      () => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [data, attempt]);

  async function updateStatus(task: Task, nextStatus: Task["status"]) {
    if (updatingIdsRef.current.has(task.id) || task.status === nextStatus)
      return;
    updatingIdsRef.current.add(task.id);
    setUpdatingIds(new Set(updatingIdsRef.current));
    setSaveError("");
    try {
      const updated = await data.update("tasks", task.id, {
        status: nextStatus,
      });
      setTasks((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch {
      setSaveError("Could not update this task. Try again.");
    } finally {
      updatingIdsRef.current.delete(task.id);
      setUpdatingIds(new Set(updatingIdsRef.current));
    }
  }

  const assignees = new Map(
    tasks.flatMap((task) =>
      task.assignee ? [[task.assignee.id, task.assignee.name] as const] : [],
    ),
  );
  const filters: CollectionFilter[] = [
    {
      key: "status",
      label: "Status",
      icon: CircleCheck,
      options: [
        { value: "", label: "Active tasks" },
        ...taskStatusOptions.map((option) => ({
          ...option,
          icon: <TaskStatusIcon status={option.value} />,
        })),
      ],
    },
    {
      key: "assignee",
      label: "Assignee",
      icon: UserRound,
      options: [
        { value: "", label: "All assignees" },
        { value: "unassigned", label: "Unassigned" },
        ...Array.from(assignees, ([value, label]) => ({ value, label })),
      ],
    },
    {
      key: "due",
      label: "Due date",
      icon: CalendarDays,
      options: [
        { value: "", label: "Any due date" },
        ...taskGroups.map((group) => ({ value: group, label: group })),
      ],
    },
  ];
  const today = todayKey();
  const statusFilter = params.get("status");
  const hasFilters = Boolean(
    params.get("q") ||
      statusFilter ||
      params.get("assignee") ||
      params.get("due"),
  );
  const visible = tasks.filter((task) => {
    const keywords = searchRecord("tasks", task).keywords;
    keywords.push(
      ...task.relatedRecords.map(
        (record) => relatedNames[record.type].get(record.id) ?? "",
      ),
    );
    return (
      matchesSearch(keywords, params.get("q") ?? "") &&
      taskMatchesStatusFilter(task, statusFilter) &&
      (!params.get("assignee") ||
        (task.assignee?.id ?? "unassigned") === params.get("assignee")) &&
      (!params.get("due") ||
        (taskGroup(task, today) === params.get("due") &&
          (params.get("due") !== "Overdue" || isOverdueTask(task, today))))
    );
  });
  function updateFilters(values: Record<string, string>, replace = false) {
    const next = new URLSearchParams(params.toString());
    next.delete("page");
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    window.history[replace ? "replaceState" : "pushState"](
      null,
      "",
      `${pathname}${next.size ? `?${next}` : ""}`,
    );
  }
  function clearFilters() {
    updateFilters({ q: "", status: "", assignee: "", due: "" });
  }
  return (
    <div className="-mt-6 flex min-w-0 flex-1 flex-col sm:-mt-8 lg:-mt-10">
      <PageHeader>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <PageHeading title={title} />
          <Button
            ref={createTrigger}
            size="sm"
            variant="outline"
            onClick={() => setCreateOpen(true)}
            aria-label="Create task"
          >
            <Plus aria-hidden="true" />
            Create task
          </Button>
        </div>
      </PageHeader>
      <CollectionControls
        title={title}
        display={display}
        filters={filters}
        params={params}
        updateFilters={updateFilters}
        onClear={clearFilters}
      />
      <CreateRecord
        kind="tasks"
        open={createOpen}
        onOpenChange={setCreateOpen}
        returnFocus={createTrigger}
        onCreated={(record) => {
          const task = record as Task;
          setCreateOpen(false);
          setTasks((current) => [...current, task]);
        }}
      />
      {saveError && (
        <p role="alert" className="text-sm text-destructive">
          {saveError}
        </p>
      )}
      {loading ? null : error ? (
        <div role="alert" className="space-y-3">
          <p>Could not load tasks.</p>
          <Button
            variant="outline"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Retry
          </Button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-6">
          <div className="max-w-sm space-y-4 text-left">
            <p className="text-sm text-muted-foreground">
              No tasks yet.
              <br />
              Create your first task to get started.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCreateOpen(true)}
              aria-label="Create task"
            >
              <Plus aria-hidden="true" />
              Create task
            </Button>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            {hasFilters
              ? "No tasks match your search or filters."
              : "No active tasks. Use the status filter to view done or canceled tasks."}
          </p>
          {hasFilters && (
            <Button size="sm" variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <TaskTable
          display={display}
          onStatusChange={updateStatus}
          relatedNames={relatedNames}
          tasks={visible}
          query={params.toString()}
          updatingIds={updatingIds}
        />
      )}
    </div>
  );
}

function TaskTable({
  display,
  query,
  tasks,
  relatedNames,
  onStatusChange,
  updatingIds,
}: {
  display: ColumnDisplayState;
  query: string;
  tasks: Task[];
  relatedNames: RelatedNames;
  onStatusChange: (task: Task, status: Task["status"]) => void;
  updatingIds: ReadonlySet<string>;
}) {
  const columns = createColumnHelper<
    typeof tableFeaturesWithSorting,
    Task
  >().columns([
    {
      accessorKey: "title",
      header: "Task",
      cell: ({ getValue, row }) => {
        const task = row.original;
        const isCompleted = task.status === "completed";
        return (
          <div className="flex min-w-56 items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button size="icon-sm" variant="ghost" />}
                aria-label={`Status of ${task.title}: ${taskStatusLabels[task.status]}`}
                disabled={updatingIds.has(task.id)}
              >
                <TaskStatusIcon status={task.status} />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 rounded-lg">
                <DropdownMenuRadioGroup
                  value={task.status}
                  onValueChange={(value) => {
                    const option = taskStatusOptions.find(
                      (option) => option.value === value,
                    );
                    if (option) onStatusChange(task, option.value);
                  }}
                >
                  {taskStatusOptions.map(({ value, label }) => (
                    <DropdownMenuRadioItem key={value} value={value}>
                      <TaskStatusIcon status={value} />
                      {label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <RecordNameLink
              kind="tasks"
              id={task.id}
              className={`font-medium hover:underline focus-visible:outline-ring ${isCompleted ? "text-muted-foreground line-through" : ""}`}
              href={`/tasks/${encodeURIComponent(task.id)}${query ? `?${query}` : ""}`}
              scroll={false}
            >
              {getValue<string>()}
            </RecordNameLink>
          </div>
        );
      },
    },
    {
      accessorKey: "assignee",
      header: "Assignee",
      cell: ({ row }) =>
        row.original.assignee ? (
          <span className="flex items-center gap-2">
            <MemberAvatar member={row.original.assignee} />
            {row.original.assignee.name}
          </span>
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        ),
      enableSorting: false,
    },
    {
      accessorKey: "dueDate",
      header: "Due date",
      cell: ({ getValue, row }) => {
        const dueDate = getValue<string | null>();
        const isOverdue =
          (row.original.status === "open" ||
            row.original.status === "in_progress") &&
          dueDate !== null &&
          dueDate < todayKey();
        return (
          <time
            className={`flex items-center gap-1.5 ${isOverdue ? "font-medium text-destructive" : "text-muted-foreground"}`}
            dateTime={dueDate ?? undefined}
          >
            <CalendarDays aria-hidden="true" className="size-3.5" />
            {formatDueDate(dueDate)}
          </time>
        );
      },
    },
    {
      accessorKey: "relatedRecords",
      header: "Related records",
      cell: ({ row }) => (
        <RelatedTaskRecords relatedNames={relatedNames} task={row.original} />
      ),
      enableSorting: false,
    },
  ]);
  const table = useTable<typeof tableFeaturesWithSorting, Task>({
    columns,
    data: tasks,
    features: tableFeaturesWithSorting,
    getRowId: (task) => task.id,
  });
  const groupedRows = taskGroups
    .map((group) => ({
      group,
      rows: table
        .getRowModel()
        .rows.filter((row) => taskGroup(row.original) === group),
    }))
    .filter(
      ({ group, rows }) => rows.length > 0 || (group === "Today" && !query),
    );

  return (
    <div className="-mx-6 border-b sm:-mx-8 lg:-mx-10">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {display
                .arrange(headerGroup.headers, (header) => header.column.id)
                .map((header) => {
                  const column = header.column;
                  const sorted = column.getIsSorted();
                  return (
                    <ColumnHeader
                      key={header.id}
                      id={column.id}
                      label={String(column.columnDef.header)}
                      display={display}
                      sorted={sorted}
                      onSort={
                        column.getCanSort()
                          ? () => column.toggleSorting()
                          : undefined
                      }
                    />
                  );
                })}
            </TableRow>
          ))}
        </TableHeader>
        {groupedRows.map(({ group, rows }) => (
          <TableBody key={group}>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableCell
                className="py-2 text-xs font-semibold text-muted-foreground"
                colSpan={display.visible.length}
              >
                {group}
              </TableCell>
            </TableRow>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  className="py-3 text-sm text-muted-foreground"
                  colSpan={display.visible.length}
                >
                  No tasks today.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} data-state={row.original.status}>
                  {display
                    .arrange(row.getAllCells(), (cell) => cell.column.id)
                    .map((cell) => (
                      <TableCell key={cell.id}>
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                </TableRow>
              ))
            )}
          </TableBody>
        ))}
      </Table>
    </div>
  );
}

function RelatedTaskRecords({
  task,
  relatedNames,
}: {
  task: Task;
  relatedNames: RelatedNames;
}) {
  if (task.relatedRecords.length === 0)
    return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1">
      {task.relatedRecords.slice(0, 2).map((record) => (
        <Link
          className="text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-ring"
          href={`/${record.type}/${encodeURIComponent(record.id)}`}
          key={`${record.type}-${record.id}`}
        >
          {relatedNames[record.type].get(record.id) ?? "Unknown record"}
        </Link>
      ))}
      {task.relatedRecords.length > 2 && (
        <span className="text-muted-foreground">
          +{task.relatedRecords.length - 2}
        </span>
      )}
    </div>
  );
}

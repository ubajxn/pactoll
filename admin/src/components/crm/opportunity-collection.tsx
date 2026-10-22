"use client";

import {
  ArrowDown,
  ArrowUp,
  Building2,
  CircleDashed,
  LayoutGrid,
  List,
  Plus,
  Search,
  Settings2,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { CollectionFilterMenu } from "@/components/crm/collection-filter-menu";
import {
  ColumnHeader,
  ColumnOptions,
  useColumnDisplay,
} from "@/components/crm/column-display";
import { CreateRecord } from "@/components/crm/create-record";
import { RecordDetailPanel } from "@/components/crm/detail-overlay";
import { ListHeading } from "@/components/crm/list-heading";
import { useRecordList } from "@/components/crm/lists-provider";
import {
  OpportunityBoard,
  StageMenu,
} from "@/components/crm/opportunity-board";
import { PageHeader, PageHeading } from "@/components/crm/page-header";
import {
  OpenRecordPageButton,
  RecordNameLink,
} from "@/components/crm/record-detail-actions";
import { RecordRowMenu } from "@/components/crm/record-row-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Member } from "@/lib/data/contracts";
import { type Account, type Opportunity, stages } from "@/lib/data/contracts";
import { useData } from "@/lib/data/provider";
import {
  changeOpportunityStage,
  formatCloseDate,
  formatMoney,
  type OpportunityColumn,
  opportunityColumns,
  queryOpportunities,
  type Stage,
  stageLabels,
  stageTotal,
} from "@/lib/opportunities";

const selectClass =
  "h-8 w-full rounded-control border border-input bg-background px-2 text-sm outline-none";
const displayColumns = [
  { id: "name", label: "Name" },
  ...Object.entries(opportunityColumns).map(([id, label]) => ({ id, label })),
];

export function OpportunityCollection({
  readOnly = false,
  onStageChange,
}: {
  readOnly?: boolean;
  onStageChange?: (id: string, stage: Stage) => Promise<Opportunity>;
}) {
  const data = useData();
  const list = useRecordList();
  const searchParams = useSearchParams();
  const collectionPath = list
    ? `/lists/${encodeURIComponent(list.id)}`
    : "/opportunities";
  const pathname = usePathname();
  // Intercepted routes keep this collection mounted while the detail slot changes.
  const activeRecordId =
    (list ? (searchParams.get("record") ?? undefined) : undefined) ??
    (pathname.startsWith("/opportunities/")
      ? decodeURIComponent(pathname.slice("/opportunities/".length))
      : undefined);
  const params = new URLSearchParams(searchParams.toString());
  const [records, setRecords] = useState<Opportunity[]>([]);
  const [owners, setOwners] = useState<Member[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [saveError, setSaveError] = useState("");
  const pendingRef = useRef(new Set<string>());
  const [pending, setPending] = useState(new Set<string>());
  const [createStage, setCreateStage] = useState<Stage | null>(null);
  const createTrigger = useRef<HTMLButtonElement>(null);
  const display = useColumnDisplay("opportunities", displayColumns, [
    "nextStep",
  ]);
  const columns = display.visible.filter(
    (id): id is OpportunityColumn =>
      id !== "name" && Object.hasOwn(opportunityColumns, id),
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchQuery = searchParams.get("q") ?? "";
  useEffect(() => {
    if (!searchOpen || searchQuery) return;
    const closeEmptySearch = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !searchRef.current?.contains(event.target)
      ) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeEmptySearch, true);
    return () =>
      document.removeEventListener("pointerdown", closeEmptySearch, true);
  }, [searchOpen, searchQuery]);
  const previousRecordId = useRef(activeRecordId);
  useEffect(() => {
    const closedId = previousRecordId.current;
    previousRecordId.current = activeRecordId;
    if (activeRecordId || !closedId) return;
    let nextFrame = 0;
    const frame = requestAnimationFrame(() => {
      // Restore after Next's navigation focus handler has completed.
      nextFrame = requestAnimationFrame(() => {
        document
          .querySelector<HTMLAnchorElement>(
            `[data-opportunity-link="${CSS.escape(closedId)}"]`,
          )
          ?.focus({ preventScroll: true });
      });
    });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(nextFrame);
    };
  }, [activeRecordId]);
  const view = params.get("view") === "table" ? "table" : "board";
  params.delete("record");
  params.delete("preset");
  params.set("view", view);
  const query = `?${params.toString()}`;

  useEffect(() => {
    if (!searchParams.has("preset")) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("preset");
    const query = next.toString();
    window.history.replaceState(
      null,
      "",
      `${pathname}${query ? `?${query}` : ""}`,
    );
  }, [pathname, searchParams]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt explicitly reloads adapter data.
  useEffect(() => {
    let cancelled = false;
    setLoadError(false);
    Promise.all([
      data.list("opportunities"),
      data.list("accounts"),
      data.listMembers(),
    ]).then(
      ([opportunities, accounts, members]) => {
        if (cancelled) return;
        setRecords(opportunities);
        setAccounts(accounts);
        setOwners(members);
        setLoading(false);
      },
      () => {
        if (!cancelled) {
          setLoadError(true);
          setLoading(false);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [data, attempt]);
  useEffect(() => {
    const refresh = () => setAttempt((value) => value + 1);
    window.addEventListener("crm:opportunities-changed", refresh);
    return () =>
      window.removeEventListener("crm:opportunities-changed", refresh);
  }, []);

  function updateQuery(values: Record<string, string>, replace = false) {
    const next = new URLSearchParams(params);
    next.delete("page");
    for (const [key, value] of Object.entries(values))
      value ? next.set(key, value) : next.delete(key);
    window.history[replace ? "replaceState" : "pushState"](
      null,
      "",
      `${pathname}?${next.toString()}`,
    );
  }
  function clearFilters() {
    updateQuery({ q: "", stage: "", owner: "", account: "" });
  }
  function create(stage: Stage, event: MouseEvent<HTMLButtonElement>) {
    createTrigger.current = event.currentTarget;
    setCreateStage(stage);
  }
  async function moveStage(id: string, stage: Stage) {
    const record = records.find((record) => record.id === id);
    if (
      !record ||
      readOnly ||
      pendingRef.current.has(id) ||
      record.stage === stage
    )
      return;
    const restoreStageFocus =
      !!document.activeElement?.closest('[role="menu"]');
    pendingRef.current.add(id);
    setPending(new Set(pendingRef.current));
    setSaveError("");
    try {
      await changeOpportunityStage(
        record,
        stage,
        onStageChange ??
          ((id, stage) => data.update("opportunities", id, { stage })),
        (next) =>
          setRecords((current) =>
            current.map((item) => (item.id === next.id ? next : item)),
          ),
      );
    } catch {
      setSaveError(
        `Could not move ${record.name}. Its previous stage was restored. Try again.`,
      );
    } finally {
      pendingRef.current.delete(id);
      setPending(new Set(pendingRef.current));
      if (restoreStageFocus)
        requestAnimationFrame(() => {
          const target = document.querySelector<HTMLButtonElement>(
            `[data-stage-menu="${CSS.escape(id)}"]`,
          );
          (target ?? searchRef.current)?.focus();
        });
    }
  }
  const scopedRecords = list
    ? records.filter((record) => list.recordIds.includes(record.id))
    : records;
  const visible = queryOpportunities(scopedRecords, accounts, params);
  const pageCount = Math.max(1, Math.ceil(visible.length / 25));
  const page = Math.min(
    pageCount,
    Math.max(1, Math.floor(Number(params.get("page"))) || 1),
  );
  const filters = ["stage", "account", "owner"] as const;
  const filterCount = filters.filter((key) => params.get(key)).length;
  const sorting = params.get("sort") ?? "name";
  const descending = params.get("direction") === "desc";
  function sortBy(key: string) {
    updateQuery({
      sort: key,
      direction: sorting === key && !descending ? "desc" : "asc",
    });
  }

  return (
    <div data-opportunity-collection className="flex min-h-0 flex-1 flex-col">
      <PageHeader>
        {list ? <ListHeading /> : <PageHeading title="Opportunities" />}
        <Button
          size="sm"
          variant="outline"
          disabled={readOnly}
          onClick={(event) => create("qualification", event)}
          aria-label="Create opportunity"
        >
          <Plus />
          Create opportunity
        </Button>
      </PageHeader>
      <div
        data-collection-controls
        className="flex min-h-11 shrink-0 flex-wrap items-center gap-2 border-b px-6 py-2"
      >
        <CollectionFilterMenu
          label="opportunities"
          values={params}
          onChange={(key, value) => updateQuery({ [key]: value })}
          filters={[
            {
              key: "account",
              label: "Account",
              icon: Building2,
              options: [
                { value: "", label: "All accounts" },
                ...accounts.map((account) => ({
                  value: account.id,
                  label: account.name,
                })),
              ],
            },
            {
              key: "stage",
              label: "Stage",
              icon: CircleDashed,
              options: [
                { value: "", label: "All stages" },
                ...stages.map((stage) => ({
                  value: stage,
                  label: stageLabels[stage],
                })),
              ],
            },
            {
              key: "owner",
              label: "Owner",
              icon: UserRound,
              options: [
                { value: "", label: "All owners" },
                { value: "unassigned", label: "Unassigned" },
                ...owners.map((owner) => ({
                  value: owner.id,
                  label: owner.name,
                })),
              ],
            },
          ]}
        />
        {searchOpen || params.get("q") ? (
          <Input
            ref={searchRef}
            aria-label="Find opportunities"
            placeholder="Find opportunities…"
            value={params.get("q") ?? ""}
            className="h-7 w-40 sm:w-52"
            onChange={(event) => updateQuery({ q: event.target.value }, true)}
            onBlur={(event) => {
              if (!event.currentTarget.value) setSearchOpen(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                updateQuery({ q: "" });
                setSearchOpen(false);
              }
            }}
          />
        ) : (
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Find opportunities"
            onClick={() => {
              setSearchOpen(true);
              requestAnimationFrame(() => searchRef.current?.focus());
            }}
          >
            <Search />
          </Button>
        )}
        <Popover>
          <PopoverTrigger
            render={<Button variant="outline" size="sm" className="ml-auto" />}
          >
            <Settings2 />
            Display
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 gap-4 rounded-lg">
            <PopoverTitle className="sr-only">
              Display opportunities
            </PopoverTitle>
            <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
              {(["table", "board"] as const).map((mode) => (
                <Button
                  key={mode}
                  size="sm"
                  variant={view === mode ? "outline" : "ghost"}
                  aria-pressed={view === mode}
                  className="font-normal"
                  onClick={() => updateQuery({ view: mode })}
                >
                  {mode === "table" ? <List /> : <LayoutGrid />}
                  {mode === "table" ? "Table" : "Board"}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <label
                htmlFor="opportunity-sort"
                className="text-sm text-muted-foreground"
              >
                Sorting
              </label>
              <select
                id="opportunity-sort"
                className={`${selectClass} flex-1`}
                value={sorting}
                onChange={(event) => updateQuery({ sort: event.target.value })}
              >
                <option value="name">Name</option>
                <option value="amount">Amount</option>
                <option value="closeDate">Close date</option>
                <option value="updatedAt">Last updated</option>
                <option value="stage">Stage</option>
                <option value="account">Account</option>
                <option value="owner">Owner</option>
              </select>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={descending ? "Sort ascending" : "Sort descending"}
                onClick={() =>
                  updateQuery({ direction: descending ? "asc" : "desc" })
                }
              >
                {descending ? <ArrowDown /> : <ArrowUp />}
              </Button>
            </div>
            <ColumnOptions
              display={display}
              exclude={view === "board" ? ["name", "stage"] : []}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                display.reset();
                updateQuery({ sort: "name", direction: "asc" });
              }}
            >
              Reset display
            </Button>
          </PopoverContent>
        </Popover>
      </div>
      {(filterCount > 0 || params.get("q")) && (
        <div className="flex flex-wrap items-center gap-2 border-b px-6 py-2">
          {filters.map(
            (key) =>
              params.get(key) && (
                <Button
                  key={key}
                  size="sm"
                  variant="secondary"
                  className="font-normal"
                  aria-label={`Remove ${key} filter`}
                  onClick={() => updateQuery({ [key]: "" })}
                >
                  {key === "stage"
                    ? (stageLabels[params.get(key) as Stage] ?? params.get(key))
                    : key === "account"
                      ? (accounts.find((item) => item.id === params.get(key))
                          ?.name ?? "Account")
                      : (owners.find((item) => item.id === params.get(key))
                          ?.name ?? "Unassigned")}
                  <X />
                </Button>
              ),
          )}
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
      {saveError && (
        <div
          role="alert"
          className="flex items-center gap-3 border-b px-6 py-2 text-xs text-destructive"
        >
          {saveError}
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Dismiss error"
            onClick={() => setSaveError("")}
          >
            <X />
          </Button>
        </div>
      )}
      {readOnly && (
        <p className="border-b px-6 py-2 text-xs text-muted-foreground">
          Read-only view. Opportunity changes are disabled.
        </p>
      )}
      {loading ? (
        <output className="sr-only">Loading opportunities</output>
      ) : loadError ? (
        <div role="alert" className="m-auto space-y-3 p-8 text-center">
          <p className="text-sm">Could not load opportunities.</p>
          <p className="text-sm text-muted-foreground">
            Check the data source and try again.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Retry
          </Button>
        </div>
      ) : visible.length === 0 && view === "table" ? (
        <div className="m-auto space-y-3 p-8 text-center text-sm text-muted-foreground">
          <p>
            {scopedRecords.length === 0
              ? list
                ? "This list is empty. Add opportunities from their Name menu, or create one here."
                : "No opportunities yet. Create one to get started."
              : "No opportunities match your search or filters."}
          </p>
          {(filterCount > 0 || params.get("q")) && (
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : view === "board" ? (
        <OpportunityBoard
          records={visible}
          accounts={accounts}
          columns={columns}
          pending={pending}
          readOnly={readOnly}
          onStageChange={moveStage}
          onCreate={create}
          detailQuery={query}
        />
      ) : (
        visible.length > 0 && (
          <>
            <div className="min-h-0 flex-1 overflow-hidden [&>[data-slot=table-container]]:h-full">
              <Table stickyFirstColumn className="border-b">
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow className="bg-background hover:bg-background">
                    {display.visible.map((key) => (
                      <ColumnHeader
                        key={key}
                        id={key}
                        label={
                          displayColumns.find((column) => column.id === key)
                            ?.label ?? key
                        }
                        display={display}
                        sorted={
                          sorting === key
                            ? descending
                              ? "desc"
                              : "asc"
                            : false
                        }
                        onSort={
                          key === "nextStep" ? undefined : () => sortBy(key)
                        }
                      />
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.slice((page - 1) * 25, page * 25).map((record) => (
                    <TableRow key={record.id}>
                      {display.visible.map((key) =>
                        key === "name" ? (
                          <TableCell
                            key={key}
                            className="group/name-cell min-w-52 pr-2"
                          >
                            <div className="flex items-center gap-3">
                              <RecordNameLink
                                kind="opportunities"
                                id={record.id}
                                data-opportunity-link={record.id}
                                className="font-medium hover:underline focus-visible:outline-ring"
                                href={
                                  list
                                    ? `${collectionPath}${query}&record=${encodeURIComponent(record.id)}`
                                    : `/opportunities/${encodeURIComponent(record.id)}${query}`
                                }
                                scroll={false}
                                prefetch={false}
                                onNavigate={
                                  list
                                    ? (event) => {
                                        event.preventDefault();
                                        window.history.pushState(
                                          null,
                                          "",
                                          `${collectionPath}${query}&record=${encodeURIComponent(record.id)}`,
                                        );
                                      }
                                    : undefined
                                }
                              >
                                {record.name}
                              </RecordNameLink>
                              <div className="ml-auto flex shrink-0 items-center gap-1">
                                <OpenRecordPageButton
                                  kind="opportunities"
                                  id={record.id}
                                  className="text-muted-foreground opacity-0 group-hover/name-cell:opacity-100 group-focus-within/name-cell:opacity-100 [@media(hover:none)]:opacity-100"
                                />
                                <RecordRowMenu
                                  kind="opportunities"
                                  record={record}
                                  disabled={readOnly}
                                />
                              </div>
                            </div>
                          </TableCell>
                        ) : (
                          <TableCell
                            key={key}
                            className="max-w-64 text-muted-foreground"
                          >
                            {key === "account" ? (
                              record.accountId ? (
                                <Link
                                  href={`/accounts/${encodeURIComponent(record.accountId)}`}
                                  className="hover:underline"
                                >
                                  {accounts.find(
                                    (account) =>
                                      account.id === record.accountId,
                                  )?.name ?? "Account"}
                                </Link>
                              ) : (
                                "—"
                              )
                            ) : key === "stage" ? (
                              <StageMenu
                                record={record}
                                disabled={readOnly || pending.has(record.id)}
                                onChange={moveStage}
                              />
                            ) : key === "amount" ? (
                              formatMoney(record.amount)
                            ) : key === "owner" ? (
                              (record.owner?.name ?? "Unassigned")
                            ) : key === "closeDate" ? (
                              formatCloseDate(record.closeDate)
                            ) : (
                              <span className="block truncate">
                                {record.nextStep || "—"}
                              </span>
                            )}
                          </TableCell>
                        ),
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div
              data-opportunity-pagination
              className="flex shrink-0 items-center gap-3 border-t px-6 py-2 text-xs text-muted-foreground"
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <span className="truncate">
                  {visible.length}{" "}
                  {visible.length === 1 ? "opportunity" : "opportunities"}
                </span>
                <span className="shrink-0 tabular-nums">
                  {stageTotal(visible)}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                disabled={page <= 1}
                onClick={() => updateQuery({ page: String(page - 1) })}
              >
                Previous
              </Button>
              <span>
                {page} / {pageCount}
              </span>
              <Button
                size="sm"
                variant="ghost"
                disabled={page >= pageCount}
                onClick={() => updateQuery({ page: String(page + 1) })}
              >
                Next
              </Button>
            </div>
          </>
        )
      )}
      <CreateRecord
        kind="opportunities"
        open={createStage !== null}
        initialStage={createStage ?? undefined}
        onOpenChange={(open) => {
          if (!open) setCreateStage(null);
        }}
        returnFocus={createTrigger}
        onCreated={(record) => {
          setRecords((current) => [...current, record as Opportunity]);
          setCreateStage(null);
        }}
      />
      {list && activeRecordId && (
        <RecordDetailPanel
          readOnly={readOnly}
          kind="opportunities"
          id={activeRecordId}
          onClose={() =>
            window.history.pushState(null, "", `${collectionPath}${query}`)
          }
        />
      )}
    </div>
  );
}

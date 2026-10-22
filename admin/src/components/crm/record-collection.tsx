"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import {
  BriefcaseBusiness,
  Building2,
  MapPin,
  Plus,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { type ReactNode, Suspense, useEffect, useRef, useState } from "react";
import { AccountField } from "@/components/crm/account-field";
import { CollectionControls } from "@/components/crm/collection-controls";
import type { CollectionFilter } from "@/components/crm/collection-filter-menu";
import {
  type ColumnDisplayState,
  ColumnHeader,
  useColumnDisplay,
} from "@/components/crm/column-display";
import { CreateRecord, recordLabels } from "@/components/crm/create-record";
import { RecordDetailPanel } from "@/components/crm/detail-overlay";
import { ListHeading } from "@/components/crm/list-heading";
import { useRecordList } from "@/components/crm/lists-provider";
import { PageHeader, PageHeading } from "@/components/crm/page-header";
import {
  OpenRecordPageButton,
  RecordNameLink,
} from "@/components/crm/record-detail-actions";
import { RecordRowMenu } from "@/components/crm/record-row-menu";
import { TaskCollection } from "@/components/crm/task-collection";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  Account,
  Contact,
  Member,
  RecordKind,
  Records,
} from "@/lib/data/contracts";
import { useData } from "@/lib/data/provider";
import { matchesSearch, searchRecord } from "@/lib/search";

function CollectionRecordLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className: string;
}) {
  const params = useSearchParams().toString();
  const list = useRecordList();
  const pathname = usePathname();
  const listParams = new URLSearchParams(params);
  listParams.set("record", decodeURIComponent(href.split("/").at(-1) ?? ""));
  const target = list
    ? `${pathname}?${listParams}`
    : `${href}${params ? `?${params}` : ""}`;
  return (
    <RecordNameLink
      kind={href.startsWith("/accounts/") ? "accounts" : "contacts"}
      id={decodeURIComponent(href.split("/").at(-1) ?? "")}
      href={target}
      onNavigate={
        list
          ? (event) => {
              event.preventDefault();
              window.history.pushState(null, "", target);
            }
          : undefined
      }
      className={className}
      scroll={false}
    >
      {children}
    </RecordNameLink>
  );
}

const tableFeaturesWithSorting = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
});

type AccountRow = Account & {
  contactCount?: number;
  opportunityCount?: number;
};

const accountColumns = createColumnHelper<
  typeof tableFeaturesWithSorting,
  AccountRow
>().columns([
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ getValue, row }) => (
      <CollectionRecordLink
        className="font-medium hover:underline focus-visible:outline-ring"
        href={`/accounts/${encodeURIComponent(row.original.id)}`}
      >
        {getValue<string>()}
      </CollectionRecordLink>
    ),
  },
  {
    accessorKey: "website",
    header: "Website",
    cell: ({ getValue }) => {
      const website = getValue<string>();
      return website ? (
        <a
          className="text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-ring"
          href={website}
          rel="noreferrer"
          target="_blank"
        >
          {website.replace(/^https?:\/\//, "")}
        </a>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorFn: (account) => account.owner?.name ?? "",
    id: "owner",
    header: "Owner",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue<string>() || "—"}</span>
    ),
  },
  ...(
    [
      ["industry", "Industry"],
      ["revenue", "Revenue (USD)"],
      ["headcount", "Headcount"],
      ["location", "Location"],
      ["linkedin", "LinkedIn"],
      ["facebook", "Facebook"],
      ["instagram", "Instagram"],
      ["twitter", "Twitter / X"],
      ["createdAt", "Created at"],
    ] as const
  ).map(([accessorKey, header]) => ({
    accessorKey,
    header,
    cell: ({ row }: { row: { original: Account } }) => (
      <AccountField name={accessorKey} value={row.original[accessorKey]} />
    ),
  })),
  {
    id: "contactCount",
    header: "Contacts",
    accessorFn: (account) => account.contactCount ?? 0,
  },
  {
    id: "opportunityCount",
    header: "Opportunity count",
    accessorFn: (account) => account.opportunityCount ?? 0,
  },
]);

const contactColumns = createColumnHelper<
  typeof tableFeaturesWithSorting,
  Contact
>().columns([
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ getValue, row }) => (
      <CollectionRecordLink
        className="font-medium hover:underline focus-visible:outline-ring"
        href={`/contacts/${encodeURIComponent(row.original.id)}`}
      >
        {getValue<string>()}
      </CollectionRecordLink>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ getValue }) => {
      const email = getValue<string>();
      return email ? (
        <a
          className="text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-ring"
          href={`mailto:${email}`}
        >
          {email}
        </a>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue<string>() || "—"}</span>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue<string>() || "—"}</span>
    ),
  },
]);

/** Shared collection for account and contact records. */
export function RecordCollection({
  kind,
  title,
}: {
  kind: RecordKind;
  title: string;
}) {
  if (kind === "tasks") return <TaskCollection title={title} />;
  return (
    <Suspense fallback={null}>
      <StandardRecordCollection kind={kind} title={title} />
    </Suspense>
  );
}

function StandardRecordCollection({
  kind,
  title,
}: {
  kind: Exclude<RecordKind, "tasks">;
  title: string;
}) {
  const data = useData();
  const list = useRecordList();
  const display = useColumnDisplay(
    kind,
    Array.from<{ accessorKey?: string; id?: string; header?: unknown }>(
      kind === "accounts" ? accountColumns : contactColumns,
    ).map((column) => ({
      id:
        "accessorKey" in column
          ? String(column.accessorKey)
          : String(column.id),
      label: String(column.header),
    })),
  );
  const pathname = usePathname();
  const params = useSearchParams();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const [records, setRecords] = useState<Records[RecordKind][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const refresh = () => setAttempt((value) => value + 1);
    const eventName = `crm:${kind}-changed`;
    window.addEventListener(eventName, refresh);
    return () => window.removeEventListener(eventName, refresh);
  }, [kind]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt reloads after a save or failure.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    const load = async () => {
      const [records, members, accounts] = await Promise.all([
        data.list(kind),
        data.listMembers(),
        kind === "contacts" ? data.list("accounts") : Promise.resolve([]),
      ]);
      if (!cancelled) {
        setMembers(members);
        setAccounts(accounts);
      }
      if (kind !== "accounts") return records;
      const [contacts, opportunities] = await Promise.all([
        data.list("contacts"),
        data.list("opportunities"),
      ]);
      return records.map((record) => ({
        ...record,
        contactCount: contacts.filter(
          (contact) => contact.accountId === record.id,
        ).length,
        opportunityCount: opportunities.filter(
          (opportunity) => opportunity.accountId === record.id,
        ).length,
      }));
    };
    load().then(
      (records) => {
        if (!cancelled) {
          setRecords(records);
          setLoading(false);
        }
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
  }, [data, kind, attempt]);
  const filterRecords = (
    list
      ? records.filter((record) => list.recordIds.includes(record.id))
      : records
  ) as (Account | Contact)[];
  const owners = new Map(members.map((member) => [member.id, member.name]));
  for (const record of filterRecords) {
    if (record.owner) owners.set(record.owner.id, record.owner.name);
  }
  function textFilter(
    key: "industry" | "location" | "role",
    label: string,
    icon: CollectionFilter["icon"],
  ): CollectionFilter {
    const values = filterRecords.map((record) =>
      key in record ? String(record[key as keyof typeof record] ?? "") : "",
    );
    return {
      key,
      label,
      icon,
      options: [
        {
          value: "",
          label:
            key === "industry"
              ? "All industries"
              : `All ${label.toLowerCase()}s`,
        },
        ...Array.from(new Set(values.filter(Boolean)))
          .sort((a, b) => a.localeCompare(b))
          .map((value) => ({ value, label: value })),
      ],
    };
  }
  const filters: CollectionFilter[] = [
    ...(kind === "contacts"
      ? [
          {
            key: "account",
            label: "Account",
            icon: Building2,
            options: [
              { value: "", label: "All accounts" },
              { value: "unassigned", label: "No account" },
              ...accounts.map((account) => ({
                value: account.id,
                label: account.name,
              })),
            ],
          },
        ]
      : []),
    {
      key: "owner",
      label: "Owner",
      icon: UserRound,
      options: [
        { value: "", label: "All owners" },
        { value: "unassigned", label: "Unassigned" },
        ...Array.from(owners, ([value, label]) => ({ value, label })),
      ],
    },
    ...(kind === "accounts"
      ? [
          textFilter("industry", "Industry", Building2),
          textFilter("location", "Location", MapPin),
        ]
      : [textFilter("role", "Role", BriefcaseBusiness)]),
  ];
  const activeFilters = filters.filter(({ key }) => params.get(key));
  const query = params.get("q") ?? "";
  const visible = filterRecords.filter((record) => {
    const keywords = searchRecord(kind, record).keywords;
    if ("industry" in record) keywords.push(record.industry, record.location);
    if ("accountId" in record)
      keywords.push(
        accounts.find((account) => account.id === record.accountId)?.name ?? "",
      );
    return (
      matchesSearch(keywords, query) &&
      activeFilters.every(({ key }) => {
        const value = params.get(key);
        if (key === "owner")
          return (record.owner?.id ?? "unassigned") === value;
        if (key === "account")
          return (
            ("accountId" in record
              ? (record.accountId ?? "unassigned")
              : "unassigned") === value
          );
        return key in record && record[key as keyof typeof record] === value;
      })
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
    updateFilters({
      ...Object.fromEntries(filters.map(({ key }) => [key, ""])),
      q: "",
    });
  }
  return (
    <div className="-mt-6 flex min-w-0 flex-1 flex-col sm:-mt-8 lg:-mt-10">
      <PageHeader>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          {list ? <ListHeading /> : <PageHeading title={title} />}
          <Button
            ref={trigger}
            size="sm"
            variant="outline"
            onClick={() => setOpen(true)}
            aria-label={`Create ${recordLabels[kind]}`}
          >
            <Plus aria-hidden="true" />
            Create {recordLabels[kind]}
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
        kind={kind}
        open={open}
        onOpenChange={setOpen}
        returnFocus={trigger}
        onCreated={(record) => {
          setOpen(false);
          setRecords((current) => [...current, record]);
          setAttempt((value) => value + 1);
        }}
      />
      {loading ? null : error ? (
        <div role="alert" className="space-y-3">
          <p>Could not load {title.toLowerCase()}.</p>
          <Button
            variant="outline"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Retry
          </Button>
        </div>
      ) : filterRecords.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-6">
          <div className="max-w-sm space-y-4 text-left">
            <p className="text-sm text-muted-foreground">
              {list ? "This list is empty." : `No ${title.toLowerCase()} yet.`}
              <br />
              {list
                ? `Add existing ${kind} from their Name menu, or create one here.`
                : `Create your first ${recordLabels[kind]} to get started.`}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpen(true)}
              aria-label={`Create ${recordLabels[kind]}`}
            >
              <Plus aria-hidden="true" />
              Create {recordLabels[kind]}
            </Button>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            No {title.toLowerCase()} match your search or filters.
          </p>
          <Button size="sm" variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : kind === "accounts" ? (
        <CollectionTable<AccountRow>
          kind="accounts"
          display={display}
          columns={accountColumns}
          data={visible as Account[]}
        />
      ) : kind === "contacts" ? (
        <CollectionTable<Contact>
          kind="contacts"
          display={display}
          columns={contactColumns}
          data={visible as Contact[]}
        />
      ) : (
        <ul className="divide-y rounded-lg border">
          {records.map((record) => (
            <li key={record.id}>
              <Link
                className="block rounded-control px-4 py-3 text-sm hover:bg-muted focus-visible:outline-ring"
                href={`/${kind}/${encodeURIComponent(record.id)}`}
              >
                {"name" in record ? record.name : record.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {list &&
        params.get("record") &&
        (kind === "accounts" || kind === "contacts") && (
          <RecordDetailPanel
            id={params.get("record") ?? ""}
            kind={kind}
            onClose={() => {
              const next = new URLSearchParams(params.toString());
              next.delete("record");
              window.history.pushState(
                null,
                "",
                `${pathname}${next.size ? `?${next}` : ""}`,
              );
            }}
          />
        )}
    </div>
  );
}

function CollectionTable<TData extends Account | Contact>({
  kind,
  columns,
  data,
  display,
}: {
  kind: "accounts" | "contacts";
  display: ColumnDisplayState;
  columns: readonly ColumnDef<
    typeof tableFeaturesWithSorting,
    TData,
    unknown
  >[];
  data: TData[];
}) {
  const table = useTable<typeof tableFeaturesWithSorting, TData>({
    columns,
    data,
    features: tableFeaturesWithSorting,
    getRowId: (record) => record.id,
  });

  return (
    <div className="-mx-6 border-b sm:-mx-8 lg:-mx-10">
      <Table stickyFirstColumn>
        <TableHeader className="sticky top-0 z-10 bg-background">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="bg-background hover:bg-background"
            >
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
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {display
                .arrange(row.getAllCells(), (cell) => cell.column.id)
                .map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={
                      cell.column.id === "name"
                        ? "group/name-cell min-w-52 pr-2"
                        : undefined
                    }
                  >
                    {cell.column.id === "name" ? (
                      <div className="flex items-center gap-3">
                        <table.FlexRender cell={cell} />
                        <div className="ml-auto flex shrink-0 items-center gap-1">
                          <OpenRecordPageButton
                            kind={kind}
                            id={row.original.id}
                            className="text-muted-foreground opacity-0 group-hover/name-cell:opacity-100 group-focus-within/name-cell:opacity-100 [@media(hover:none)]:opacity-100"
                          />
                          <RecordRowMenu kind={kind} record={row.original} />
                        </div>
                      </div>
                    ) : (
                      <table.FlexRender cell={cell} />
                    )}
                  </TableCell>
                ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

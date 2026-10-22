"use client";

import { DragDropProvider, useDraggable, useDroppable } from "@dnd-kit/react";
import {
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Diamond,
  Plus,
} from "lucide-react";
import Link from "next/link";
import type { MouseEvent } from "react";
import { useRecordList } from "@/components/crm/lists-provider";
import { MemberAvatar } from "@/components/crm/member-picker";
import {
  OpenRecordPageButton,
  RecordNameLink,
} from "@/components/crm/record-detail-actions";
import { RecordRowMenu } from "@/components/crm/record-row-menu";
import { StageIcon } from "@/components/crm/status-icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Account, type Opportunity, stages } from "@/lib/data/contracts";
import {
  formatCloseDate,
  formatMoney,
  isStage,
  type OpportunityColumn,
  type Stage,
  stageLabels,
  stageTotal,
} from "@/lib/opportunities";
import { cn } from "@/lib/utils";

export function StageMenu({
  record,
  disabled,
  onChange,
}: {
  record: Opportunity;
  disabled?: boolean;
  onChange: (id: string, stage: Stage) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 gap-1.5 font-normal"
          />
        }
        disabled={disabled}
        aria-label={`Change stage for ${record.name}: ${stageLabels[record.stage]}`}
        data-stage-menu={record.id}
      >
        <StageIcon stage={record.stage} />
        {stageLabels[record.stage]}
        <ChevronDown className="size-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48 rounded-lg">
        {stages.map((stage) => (
          <DropdownMenuItem
            key={stage}
            className="rounded-control"
            onClick={() => onChange(record.id, stage)}
          >
            <StageIcon stage={stage} />
            {stageLabels[stage]}
            {stage === record.stage && <Check className="ml-auto size-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function OpportunityBoard({
  records,
  accounts,
  columns,
  pending,
  readOnly = false,
  onStageChange,
  onCreate,
  detailQuery,
}: {
  records: Opportunity[];
  accounts: Account[];
  columns: OpportunityColumn[];
  pending: ReadonlySet<string>;
  readOnly?: boolean;
  onStageChange: (id: string, stage: Stage) => void;
  onCreate: (stage: Stage, event: MouseEvent<HTMLButtonElement>) => void;
  detailQuery: string;
}) {
  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (event.canceled || readOnly) return;
        const { source, target } = event.operation;
        if (source && isStage(target?.id))
          onStageChange(String(source.id), target.id);
      }}
    >
      <section
        aria-label="Opportunity pipeline"
        data-opportunity-board
        className="flex min-h-0 flex-1 scroll-fade-x gap-3 overflow-x-auto overscroll-x-contain px-6 pb-3 pt-4"
      >
        {stages.map((stage) => (
          <StageColumn
            key={stage}
            stage={stage}
            records={records.filter((record) => record.stage === stage)}
            disabled={readOnly}
            onCreate={onCreate}
          >
            {records
              .filter((record) => record.stage === stage)
              .map((record) => (
                <OpportunityCard
                  key={record.id}
                  record={record}
                  account={accounts.find(
                    (account) => account.id === record.accountId,
                  )}
                  columns={columns}
                  disabled={readOnly || pending.has(record.id)}
                  pending={pending.has(record.id)}
                  detailQuery={detailQuery}
                />
              ))}
          </StageColumn>
        ))}
      </section>
    </DragDropProvider>
  );
}

function StageColumn({
  stage,
  records,
  disabled,
  onCreate,
  children,
}: {
  stage: Stage;
  records: Opportunity[];
  disabled: boolean;
  onCreate: (stage: Stage, event: MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}) {
  const { ref, isDropTarget } = useDroppable({
    id: stage,
    disabled,
    accept: "opportunity",
  });
  return (
    <section
      ref={ref}
      aria-label={`${stageLabels[stage]} stage`}
      className={cn(
        "flex w-64 min-w-64 flex-col rounded-lg transition-colors motion-reduce:transition-none",
        isDropTarget && "bg-accent ring-1 ring-ring",
      )}
    >
      <div className="mb-3 flex h-7 shrink-0 items-center gap-2 px-2 text-sm">
        <StageIcon stage={stage} />
        <h2 className="font-medium">{stageLabels[stage]}</h2>
        <span className="rounded-control bg-muted px-1.5 tabular-nums text-muted-foreground">
          {records.length}
        </span>
        <Button
          size="icon-sm"
          variant="ghost"
          className="ml-auto text-muted-foreground"
          disabled={disabled}
          aria-label={`Create opportunity in ${stageLabels[stage]}`}
          onClick={(event) => onCreate(stage, event)}
        >
          <Plus />
        </Button>
      </div>
      <div className="min-h-28 flex-1 scroll-fade-y space-y-2 overflow-y-auto px-0.5 pb-3">
        {children}
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start border-dashed bg-transparent text-muted-foreground"
          disabled={disabled}
          onClick={(event) => onCreate(stage, event)}
        >
          <Plus className="size-3.5" />
          Create opportunity
        </Button>
        {isDropTarget && (
          <p className="px-2 py-3 text-center text-xs text-muted-foreground">
            Move to {stageLabels[stage]}
          </p>
        )}
      </div>
      <div className="flex min-h-9 shrink-0 items-center gap-2 border-t px-2 py-2 text-xs text-muted-foreground">
        <Diamond className="size-3.5 shrink-0" />
        <output
          className="tabular-nums"
          aria-label={`${stageLabels[stage]} total`}
        >
          {stageTotal(records)}
        </output>
      </div>
    </section>
  );
}

function OpportunityCard({
  record,
  account,
  columns,
  disabled,
  pending,
  detailQuery,
}: {
  record: Opportunity;
  account?: Account;
  columns: OpportunityColumn[];
  disabled: boolean;
  pending: boolean;
  detailQuery: string;
}) {
  const list = useRecordList();
  const href = list
    ? `/lists/${encodeURIComponent(list.id)}${detailQuery}&record=${encodeURIComponent(record.id)}`
    : `/opportunities/${encodeURIComponent(record.id)}${detailQuery}`;
  const { ref, isDragging } = useDraggable({
    id: record.id,
    type: "opportunity",
    disabled,
  });
  return (
    // biome-ignore lint/a11y/useSemanticElements: A draggable card groups links, not form fields; this overrides dnd-kit's default button role.
    <article
      ref={ref}
      role="group"
      aria-label={record.name}
      aria-busy={pending}
      className={cn(
        "group/name-cell relative rounded-lg border bg-card p-3 text-card-foreground shadow-xs outline-none transition-shadow hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
        !disabled && "cursor-grab",
        isDragging && "cursor-grabbing opacity-50 ring-2 ring-ring",
      )}
    >
      <div className="mb-2 flex items-start gap-1">
        <RecordNameLink
          kind="opportunities"
          id={record.id}
          data-opportunity-link={record.id}
          href={href}
          scroll={false}
          prefetch={false}
          onNavigate={
            list
              ? (event) => {
                  event.preventDefault();
                  window.history.pushState(null, "", href);
                }
              : undefined
          }
          className="min-w-0 flex-1 rounded-control text-sm font-medium leading-5 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          {record.name}
        </RecordNameLink>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <OpenRecordPageButton
            kind="opportunities"
            id={record.id}
            disabled={pending}
            className="text-muted-foreground opacity-0 group-hover/name-cell:opacity-100 group-focus-within/name-cell:opacity-100 [@media(hover:none)]:opacity-100"
          />
          <RecordRowMenu
            kind="opportunities"
            record={record}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="space-y-2.5 text-sm text-muted-foreground">
        {columns.includes("account") && (
          <div className="flex items-center gap-2">
            <Building2 className="size-3.5 shrink-0" />
            {account ? (
              <Link
                className="truncate hover:underline"
                href={`/accounts/${encodeURIComponent(account.id)}`}
              >
                {account.name}
              </Link>
            ) : (
              "No account"
            )}
          </div>
        )}
        {columns.includes("amount") && (
          <div className="flex items-center gap-2">
            <Diamond className="size-3.5" />
            <span className="tabular-nums text-foreground">
              {formatMoney(record.amount)}
            </span>
          </div>
        )}
        {columns.includes("closeDate") && (
          <div className="flex items-center gap-2">
            <CalendarDays className="size-3.5" />
            <span>{formatCloseDate(record.closeDate)}</span>
          </div>
        )}
        {columns.includes("owner") && (
          <div className="flex items-center gap-2">
            {record.owner && <MemberAvatar member={record.owner} />}
            <span>{record.owner?.name || "Unassigned"}</span>
          </div>
        )}
        {columns.includes("nextStep") && (
          <p className="line-clamp-2 leading-5">
            {record.nextStep || "No next step"}
          </p>
        )}
      </div>
      {pending && <p className="mt-2 text-xs text-muted-foreground">Saving…</p>}
    </article>
  );
}

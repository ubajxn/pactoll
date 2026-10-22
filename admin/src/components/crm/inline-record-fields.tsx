"use client";

import { useEffect, useId, useRef, useState } from "react";
import { columnIcon } from "@/components/crm/column-display";
import { MemberPicker } from "@/components/crm/member-picker";
import {
  ChoiceSelect,
  type FieldChoice,
  RecordPicker,
} from "@/components/crm/record-fields";
import { RecordKindIcon } from "@/components/crm/record-kind-icon";
import { StageIcon, TaskStatusIcon } from "@/components/crm/status-icons";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Member, Person, RecordKind, Records } from "@/lib/data/contracts";
import { recordUpdateSchemas, relationshipTypes, stages } from "@/lib/data/contracts";
import { useData } from "@/lib/data/provider";
import { stageLabels } from "@/lib/opportunities";
import {
  loadRelationshipChoices,
  type RelationshipChoice,
} from "@/lib/relationship-choices";
import { taskStatusOptions } from "@/lib/tasks";

type Option = FieldChoice & RelationshipChoice;
type Commit = (
  field: string,
  patch: Record<string, unknown>,
) => Promise<boolean>;

export function InlineRecordFields({
  kind,
  record,
  readOnly = false,
  onUpdated,
}: {
  kind: RecordKind;
  record: Records[RecordKind];
  readOnly?: boolean;
  onUpdated: (record: Records[RecordKind]) => void;
}) {
  const data = useData();
  const baseId = useId();
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const currentIdentity = useRef("");
  const commitVersions = useRef<Record<string, number>>({});
  const identity = `${kind}:${record.id}`;
  currentIdentity.current = identity;
  const [options, setOptions] = useState<Option[]>([]);
  const [people, setPeople] = useState<Member[]>([]);
  const [loadingChoices, setLoadingChoices] = useState(true);
  const [choiceError, setChoiceError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt retries relationship choices.
  useEffect(() => {
    let cancelled = false;
    setLoadingChoices(true);
    setChoiceError(false);
    loadRelationshipChoices(data, kind).then(
      ({ options: loadedOptions, members }) => {
        if (cancelled) return;
        setOptions(
          loadedOptions.map((option) => ({
            ...option,
            href: `/${option.kind}/${encodeURIComponent(option.id)}`,
          })),
        );
        setPeople(members);
        setLoadingChoices(false);
      },
      () => {
        if (!cancelled) {
          setChoiceError(true);
          setLoadingChoices(false);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [data, kind, attempt]);

  const commit: Commit = (field, patch) => {
    const parsed = recordUpdateSchemas[kind].safeParse(patch);
    if (!parsed.success) {
      setErrors((current) => ({
        ...current,
        [field]: fieldError(field, parsed.error.issues[0]?.message),
      }));
      return Promise.resolve(false);
    }

    setErrors((current) => ({ ...current, [field]: "" }));
    const version = (commitVersions.current[field] ?? 0) + 1;
    commitVersions.current[field] = version;
    setPending((current) => ({
      ...current,
      [field]: (current[field] ?? 0) + 1,
    }));
    const request = queue.current.then(() =>
      data.update(kind, record.id, parsed.data),
    );
    queue.current = request.catch(() => undefined);
    return request
      .then(
        (updated) => {
          if (currentIdentity.current === identity) onUpdated(updated);
          window.dispatchEvent(new Event(`crm:${kind}-changed`));
          return true;
        },
        () => {
          if (
            currentIdentity.current === identity &&
            commitVersions.current[field] === version
          )
            setErrors((current) => ({
              ...current,
              [field]: "Could not save this value. Try again.",
            }));
          return false;
        },
      )
      .finally(() => {
        setPending((current) => {
          const next = { ...current };
          if ((next[field] ?? 0) <= 1) delete next[field];
          else next[field] -= 1;
          return next;
        });
      });
  };

  const relationshipDisabled = readOnly || loadingChoices || choiceError;
  const id = (field: string) => `${baseId}-${field}`;
  const person = (memberId: string): Person | null => {
    const member = people.find((item) => item.id === memberId);
    return member ? { id: member.id, name: member.name } : null;
  };
  const text = (
    field: string,
    label: string,
    value: string | number | null,
    options: {
      type?: "text" | "email" | "tel" | "url" | "number";
      nullableNumber?: boolean;
      placeholder?: string;
      icon?: string;
    } = {},
  ) => (
    <InlineInputField
      key={field}
      id={id(field)}
      field={field}
      label={label}
      value={value}
      type={options.type}
      icon={options.icon}
      placeholder={options.placeholder ?? `Set ${label.toLowerCase()}…`}
      error={errors[field]}
      pending={Boolean(pending[field])}
      readOnly={readOnly}
      onCommit={(next) =>
        commit(field, {
          [field]:
            options.type === "number"
              ? next === ""
                ? options.nullableNumber
                  ? null
                  : Number.NaN
                : Number(next)
              : next,
        })
      }
    />
  );
  const date = (field: string, label: string, value: string | null) => (
    <InlineDateField
      key={field}
      id={id(field)}
      field={field}
      label={label}
      value={value}
      error={errors[field]}
      pending={Boolean(pending[field])}
      readOnly={readOnly}
      onCommit={(next) => commit(field, { [field]: next })}
    />
  );
  const choice = (
    field: string,
    label: string,
    value: string,
    choices: FieldChoice[],
    patch: (value: string) => Record<string, unknown>,
    icon?: string,
  ) => (
    <InlineChoiceField
      key={field}
      id={id(field)}
      field={field}
      label={label}
      value={value}
      choices={choices}
      icon={icon}
      error={errors[field]}
      pending={Boolean(pending[field])}
      disabled={readOnly}
      onCommit={(next) => commit(field, patch(next))}
    />
  );
  const picker = (
    field: string,
    label: string,
    value: string[],
    choices: Option[],
    patch: (value: string[]) => Record<string, unknown>,
    multiple = false,
    icon?: string,
  ) => (
    <InlinePickerField
      key={field}
      id={id(field)}
      field={field}
      label={label}
      value={value}
      choices={choices}
      multiple={multiple}
      icon={icon}
      error={errors[field]}
      pending={Boolean(pending[field])}
      disabled={relationshipDisabled}
      onCommit={(next) => commit(field, patch(next))}
    />
  );
  const owner = "owner" in record ? record.owner : record.assignee;
  const ownerField = "owner" in record ? "owner" : "assignee";
  const relationshipTypeLabels: Record<string, string> = {
    target: "Target",
    potential_client: "Potential Client",
    current_client: "Current Client",
    vendor: "Vendor",
    trade_publication: "Trade Publication",
    industry_association: "Industry Association",
    competitor: "Competitor",
  };
  const fields =
    kind === "accounts" && "industry" in record
      ? [
          text("name", "Name", record.name),
          choice(
            "relationshipType",
            "Relationship",
            record.relationshipType ?? "target",
            relationshipTypes.map((rt) => ({
              id: rt,
              name: relationshipTypeLabels[rt] ?? rt,
            })),
            (value) => ({ relationshipType: value }),
          ),
          text("website", "Website", record.website, { type: "url" }),
          text("industry", "Industry", record.industry),
          text("steelProducts", "Steel products", record.steelProducts ?? ""),
          text("steelNeeds", "Steel needs", record.steelNeeds ?? ""),
          text("revenue", "Annual revenue (USD)", record.revenue, {
            type: "number",
            nullableNumber: true,
            icon: "revenue",
          }),
          text("headcount", "Headcount", record.headcount, {
            type: "number",
            nullableNumber: true,
          }),
          text("location", "Location", record.location),
          text("linkedin", "LinkedIn", record.linkedin, { type: "url" }),
          text("facebook", "Facebook", record.facebook, { type: "url" }),
          text("instagram", "Instagram", record.instagram, { type: "url" }),
          text("twitter", "Twitter / X", record.twitter, { type: "url" }),
        ]
      : kind === "contacts" && "email" in record
        ? [
            text("name", "Name", record.name),
            text("email", "Email", record.email, { type: "email" }),
            text("phone", "Phone", record.phone, { type: "tel" }),
            text("role", "Role", record.role),
            picker(
              "accountId",
              "Account",
              record.accountId ? [record.accountId] : [],
              options.filter((option) => option.kind === "accounts"),
              (values) => ({ accountId: values[0] ?? null }),
              false,
              "account",
            ),
          ]
        : kind === "opportunities" && "stage" in record
          ? [
              text("name", "Name", record.name),
              picker(
                "accountId",
                "Account",
                record.accountId ? [record.accountId] : [],
                options.filter((option) => option.kind === "accounts"),
                (values) => ({ accountId: values[0] ?? null }),
                false,
                "account",
              ),
              choice(
                "stage",
                "Stage",
                record.stage,
                stages.map((stage) => ({
                  id: stage,
                  name: stageLabels[stage],
                  icon: <StageIcon stage={stage} />,
                })),
                (stage) => ({ stage }),
              ),
              text("amount", "Amount (USD)", record.amount, {
                type: "number",
              }),
              date("closeDate", "Close date", record.closeDate),
              picker(
                "contactIds",
                "Related contacts",
                record.contactIds,
                options.filter((option) => option.kind === "contacts"),
                (contactIds) => ({ contactIds }),
                true,
                "contactCount",
              ),
              <InlineTextareaField
                key="nextStep"
                id={id("nextStep")}
                field="nextStep"
                label="Next step"
                value={record.nextStep}
                error={errors.nextStep}
                pending={Boolean(pending.nextStep)}
                readOnly={readOnly}
                onCommit={(nextStep) => commit("nextStep", { nextStep })}
              />,
            ]
          : "title" in record
            ? [
                text("title", "Title", record.title, { icon: "title" }),
                choice(
                  "status",
                  "Status",
                  record.status,
                  taskStatusOptions.map(({ value, label }) => ({
                    id: value,
                    name: label,
                    icon: <TaskStatusIcon status={value} />,
                  })),
                  (status) => ({ status }),
                ),
                date("dueDate", "Due date", record.dueDate),
                picker(
                  "relatedRecords",
                  "Related records",
                  record.relatedRecords.map(
                    (reference) => `${reference.type}:${reference.id}`,
                  ),
                  options
                    .filter((option) => option.kind !== "tasks")
                    .map((option) => ({
                      ...option,
                      id: `${option.kind}:${option.id}`,
                      icon: <RecordKindIcon kind={option.kind} />,
                      typeLabel: singular(option.kind),
                      keywords: [singular(option.kind)],
                      href: `/${option.kind}/${encodeURIComponent(option.id)}`,
                    })),
                  (values) => ({
                    relatedRecords: values.map((value) => {
                      const [type, referenceId] = value.split(":");
                      return { type, id: referenceId };
                    }),
                  }),
                  true,
                ),
              ]
            : [];

  return (
    <div>
      <div className="space-y-0.5">{fields}</div>
      <InlineProperty
        label={ownerField === "owner" ? "Owner" : "Assignee"}
        icon={ownerField}
      >
        <MemberPicker
          id={id(ownerField)}
          name={ownerField}
          label={ownerField === "owner" ? "Owner" : "Assignee"}
          members={people}
          value={owner?.id ?? ""}
          onValueChange={(value) =>
            void commit(ownerField, { [ownerField]: person(value) })
          }
          disabled={relationshipDisabled}
          variant="inline"
          showLabel={false}
          error={errors[ownerField]}
          emptyLabel={`Set ${ownerField === "owner" ? "owner" : "assignee"}…`}
        />
        <FieldState
          id={id(ownerField)}
          error={errors[ownerField]}
          pending={Boolean(pending[ownerField])}
        />
      </InlineProperty>
      {kind === "accounts" && (
        <InlineProperty label="Created" icon="createdAt">
          <span className="flex min-h-8 items-center px-2.5 text-sm text-muted-foreground">
            {new Date(record.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </InlineProperty>
      )}
      {choiceError && (
        <div
          className="mt-3 flex items-center gap-2 text-xs text-destructive"
          role="alert"
        >
          <span>Relationship choices could not be loaded.</span>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}

function InlineDateField({
  id,
  field,
  label,
  value,
  error,
  pending,
  readOnly,
  onCommit,
}: {
  id: string;
  field: string;
  label: string;
  value: string | null;
  error?: string;
  pending: boolean;
  readOnly: boolean;
  onCommit: (value: string | null) => Promise<boolean>;
}) {
  const { draft, submitSelection } = useSelectionDraft(value, value ?? "");
  return (
    <InlineProperty label={label} icon={field} htmlFor={id}>
      <DatePicker
        id={id}
        label={label}
        value={draft}
        onValueChange={(next) => submitSelection(next, onCommit)}
        disabled={readOnly}
        variant="inline"
        placeholder={`Set ${label.toLowerCase()}…`}
        error={error}
        pending={pending}
      />
      <FieldState id={id} error={error} pending={pending} />
    </InlineProperty>
  );
}

function InlineInputField({
  id,
  field,
  label,
  value,
  type = "text",
  icon,
  placeholder,
  error,
  pending,
  readOnly,
  onCommit,
}: {
  id: string;
  field: string;
  label: string;
  value: string | number | null;
  type?: "text" | "email" | "tel" | "url" | "number";
  icon?: string;
  placeholder: string;
  error?: string;
  pending: boolean;
  readOnly: boolean;
  onCommit: (value: string) => Promise<boolean>;
}) {
  const committed = value == null ? "" : String(value);
  const { draft, editDraft, cancelDraft, submitDraft } =
    useTextDraft(committed);
  const cancelBlur = useRef(false);
  const save = () => {
    if (cancelBlur.current) {
      cancelBlur.current = false;
      return;
    }
    if (!readOnly) submitDraft(onCommit);
  };
  return (
    <InlineProperty label={label} icon={icon ?? field} htmlFor={id}>
      <Input
        id={id}
        type={type}
        min={type === "number" ? 0 : undefined}
        step={
          type === "number" ? (field === "headcount" ? 1 : "any") : undefined
        }
        value={draft}
        variant="inline"
        className={
          readOnly
            ? "hover:bg-transparent focus:border-transparent focus:bg-transparent focus:ring-0"
            : undefined
        }
        placeholder={placeholder}
        readOnly={readOnly}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-busy={pending}
        onChange={(event) => editDraft(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            cancelBlur.current = true;
            cancelDraft();
            event.currentTarget.blur();
          }
        }}
      />
      <FieldState id={id} error={error} pending={pending} />
    </InlineProperty>
  );
}

function InlineTextareaField({
  id,
  field,
  label,
  value,
  error,
  pending,
  readOnly,
  onCommit,
}: {
  id: string;
  field: string;
  label: string;
  value: string;
  error?: string;
  pending: boolean;
  readOnly: boolean;
  onCommit: (value: string) => Promise<boolean>;
}) {
  const { draft, editDraft, cancelDraft, submitDraft } = useTextDraft(value);
  const cancelBlur = useRef(false);
  return (
    <InlineProperty label={label} icon={field} htmlFor={id}>
      <Textarea
        id={id}
        value={draft}
        variant="inline"
        className={
          readOnly
            ? "hover:bg-transparent focus:border-transparent focus:bg-transparent focus:ring-0"
            : undefined
        }
        placeholder={`Set ${label.toLowerCase()}…`}
        readOnly={readOnly}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-busy={pending}
        onChange={(event) => editDraft(event.target.value)}
        onBlur={() => {
          if (cancelBlur.current) {
            cancelBlur.current = false;
            return;
          }
          if (!readOnly) submitDraft(onCommit);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            cancelBlur.current = true;
            cancelDraft();
            event.currentTarget.blur();
          }
        }}
      />
      <FieldState id={id} error={error} pending={pending} />
    </InlineProperty>
  );
}

function InlineChoiceField({
  id,
  field,
  label,
  value,
  choices,
  icon,
  error,
  pending,
  disabled,
  onCommit,
}: {
  id: string;
  field: string;
  label: string;
  value: string;
  choices: FieldChoice[];
  icon?: string;
  error?: string;
  pending: boolean;
  disabled: boolean;
  onCommit: (value: string) => Promise<boolean>;
}) {
  const { draft, submitSelection } = useSelectionDraft(value, value);
  return (
    <InlineProperty label={label} icon={icon ?? field}>
      <ChoiceSelect
        id={id}
        name={field}
        label={label}
        choices={choices}
        defaultValue={value}
        value={draft}
        onValueChange={(next) => submitSelection(next, onCommit)}
        disabled={disabled}
        error={error}
        variant="inline"
        showLabel={false}
      />
      <FieldState id={id} error={error} pending={pending} />
    </InlineProperty>
  );
}

function InlinePickerField({
  id,
  field,
  label,
  value,
  choices,
  multiple,
  icon,
  error,
  pending,
  disabled,
  onCommit,
}: {
  id: string;
  field: string;
  label: string;
  value: string[];
  choices: Option[];
  multiple: boolean;
  icon?: string;
  error?: string;
  pending: boolean;
  disabled: boolean;
  onCommit: (value: string[]) => Promise<boolean>;
}) {
  const valueKey = value.join("\u0000");
  const { draft, submitSelection } = useSelectionDraft(value, valueKey);
  return (
    <InlineProperty label={label} icon={icon ?? field}>
      <RecordPicker
        id={id}
        name={field}
        label={label}
        choices={choices}
        multiple={multiple}
        linkedSelection
        selectedFirst={field === "contactIds"}
        defaultValue={value}
        value={draft}
        onValueChange={(next) => submitSelection(next, onCommit)}
        disabled={disabled}
        error={error}
        emptyLabel={`Set ${label.toLowerCase()}…`}
        variant="inline"
        showLabel={false}
      />
      <FieldState id={id} error={error} pending={pending} />
    </InlineProperty>
  );
}

function InlineProperty({
  label,
  icon,
  htmlFor,
  children,
}: {
  label: string;
  icon: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  const Icon = columnIcon(icon);
  return (
    <div className="grid grid-cols-1 items-start py-0.5 sm:grid-cols-[144px_minmax(0,1fr)] sm:gap-3">
      <div className="flex min-h-8 items-center gap-2 text-[13px] text-muted-foreground">
        <Icon aria-hidden="true" className="size-3.5 shrink-0" />
        {htmlFor ? (
          <label className="truncate" htmlFor={htmlFor}>
            {label}
          </label>
        ) : (
          <span className="truncate">{label}</span>
        )}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function useSelectionDraft<T>(committed: T, committedKey: string) {
  const [draft, setDraft] = useState(committed);
  const committedRef = useRef(committed);
  const observedCommittedKey = useRef(committedKey);
  const selectionVersion = useRef(0);
  const dirty = useRef(false);
  const submissions = useRef<Array<{ version: number }>>([]);
  committedRef.current = committed;

  useEffect(() => {
    if (observedCommittedKey.current === committedKey) return;
    observedCommittedKey.current = committedKey;
    if (submissions.current.length === 0 && !dirty.current) setDraft(committed);
  }, [committed, committedKey]);

  const submitSelection = (
    next: T,
    onCommit: (value: T) => Promise<boolean>,
  ) => {
    const version = ++selectionVersion.current;
    dirty.current = true;
    setDraft(next);
    const submission = { version };
    submissions.current.push(submission);
    void onCommit(next).then((saved) => {
      if (!saved) {
        submissions.current = submissions.current.filter(
          (candidate) => candidate !== submission,
        );
        if (selectionVersion.current === version) {
          dirty.current = false;
          setDraft(committedRef.current);
        }
        return;
      }
      submissions.current = submissions.current.filter(
        (candidate) => candidate !== submission,
      );
      if (selectionVersion.current === submission.version)
        dirty.current = false;
    });
  };
  return { draft, submitSelection };
}

function useTextDraft(committed: string) {
  const [draft, setDraft] = useState(committed);
  const draftRef = useRef(committed);
  const committedRef = useRef(committed);
  const editVersion = useRef(0);
  const dirty = useRef(false);
  const submissions = useRef<Array<{ version: number; value: string }>>([]);
  committedRef.current = committed;

  useEffect(() => {
    const submissionIndex = submissions.current.findIndex(
      (submission) => submission.value === committed,
    );
    const submission = submissions.current[submissionIndex];
    if (submission) submissions.current.splice(submissionIndex, 1);
    if (!dirty.current || submission?.version === editVersion.current) {
      draftRef.current = committed;
      dirty.current = false;
      setDraft(committed);
    }
  }, [committed]);

  const editDraft = (next: string) => {
    editVersion.current += 1;
    dirty.current = true;
    draftRef.current = next;
    setDraft(next);
  };
  const cancelDraft = () => {
    dirty.current = false;
    draftRef.current = committedRef.current;
    setDraft(committedRef.current);
  };
  const submitDraft = (onCommit: (value: string) => Promise<boolean>) => {
    if (!dirty.current) return;
    const version = editVersion.current;
    if (
      submissions.current.some((submission) => submission.version === version)
    )
      return;
    if (
      draftRef.current === committedRef.current &&
      submissions.current.length === 0
    ) {
      dirty.current = false;
      return;
    }

    const submission = { version, value: draftRef.current };
    submissions.current.push(submission);
    void onCommit(submission.value).then((saved) => {
      if (!saved) {
        submissions.current = submissions.current.filter(
          (candidate) => candidate !== submission,
        );
        return;
      }
      submissions.current = submissions.current.filter(
        (candidate) => candidate !== submission,
      );
      if (editVersion.current === submission.version) dirty.current = false;
    });
  };
  return { draft, editDraft, cancelDraft, submitDraft };
}

function FieldState({
  id,
  error,
  pending,
}: {
  id: string;
  error?: string;
  pending: boolean;
}) {
  return (
    <>
      {pending && <span className="sr-only">Saving…</span>}
      {error && (
        <p id={`${id}-error`} className="mt-1 px-2.5 text-xs text-destructive">
          {error}
        </p>
      )}
    </>
  );
}

function singular(kind: RecordKind) {
  return kind === "opportunities" ? "opportunity" : kind.slice(0, -1);
}

function fieldError(field: string, fallback = "Enter a valid value.") {
  return (
    (
      {
        name: "Enter a name between 1 and 1,000 characters.",
        title: "Enter a title between 1 and 1,000 characters.",
        website: "Enter a full URL beginning with http:// or https://.",
        email: "Enter a valid email address.",
        revenue: "Enter an amount of zero or more.",
        headcount: "Enter a whole number of zero or more.",
        amount: "Enter an amount of zero or more.",
        closeDate: "Enter a valid close date.",
        dueDate: "Enter a valid due date.",
      } as Record<string, string>
    )[field] ?? fallback
  );
}

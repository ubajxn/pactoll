"use client";

import {
  type FormEvent,
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  notifyListsChanged,
  useRecordList,
} from "@/components/crm/lists-provider";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  type Account,
  type Member,
  type Opportunity,
  type RecordKind,
  type Records,
  recordSchemas,
  stages,
} from "@/lib/data/contracts";
import { useData } from "@/lib/data/provider";
import { stageLabels } from "@/lib/opportunities";
import {
  loadRelationshipChoices,
  type RelationshipChoice,
} from "@/lib/relationship-choices";
import { taskStatusOptions } from "@/lib/tasks";

export const recordLabels = {
  accounts: "account",
  contacts: "contact",
  opportunities: "opportunity",
  tasks: "task",
};
type Option = FieldChoice & RelationshipChoice;

export function CreateRecord({
  kind,
  open,
  onOpenChange,
  onCreated,
  returnFocus,
  initialStage,
  opportunity,
  account,
}: {
  kind: RecordKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (record: Records[RecordKind]) => void;
  returnFocus: RefObject<HTMLButtonElement | null>;
  initialStage?: Opportunity["stage"];
  opportunity?: Opportunity;
  account?: Account;
}) {
  const [busy, setBusy] = useState(false);
  const record = account ?? opportunity;
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!busy) onOpenChange(value);
      }}
    >
      <DialogContent
        finalFocus={returnFocus}
        className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
        showCloseButton={false}
      >
        <DialogHeader className="gap-2">
          <DialogTitle>
            {record ? "Edit" : "Create"} {recordLabels[kind]}
          </DialogTitle>
          <DialogDescription>
            Enter the details for your {recordLabels[kind]}.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <RecordForm
            autoFocus
            onPending={setBusy}
            kind={kind}
            onCancel={() => onOpenChange(false)}
            onSaved={onCreated}
            initialStage={initialStage}
            record={record}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export function RecordForm({
  kind,
  onSaved,
  onPending = () => {},
  initialStage,
  record,
  onCancel,
  autoFocus = false,
}: {
  kind: RecordKind;
  onPending?: (pending: boolean) => void;
  onSaved: (record: Records[RecordKind]) => void;
  initialStage?: Opportunity["stage"];
  record?: Records[RecordKind];
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  const data = useData();
  const list = useRecordList();
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const saving = useRef(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [people, setPeople] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const recordValues = record as unknown as Record<string, unknown> | undefined;
  const savedValue = (name: string) => {
    if (!record) return undefined;
    if (name === "name") return "name" in record ? record.name : record.title;
    return recordValues?.[name];
  };
  const selectedPersonId = record
    ? "owner" in record
      ? (record.owner?.id ?? "")
      : (record.assignee?.id ?? "")
    : "";
  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt retries loading relationship choices.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    loadRelationshipChoices(data, kind).then(
      ({ options: loadedOptions, members }) => {
        if (cancelled) return;
        setOptions(loadedOptions);
        setPeople(members);
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
  }, [data, kind, attempt]);
  useEffect(() => {
    if (!autoFocus || loading || loadError) return;
    const frame = requestAnimationFrame(() => {
      formRef.current
        ?.querySelector<HTMLInputElement>('input:not([type="hidden"])')
        ?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [autoFocus, loading, loadError]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current || loading || loadError) return;
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? "").trim();
    const member = people.find((person) => person.id === value("owner"));
    const person = member ? { id: member.id, name: member.name } : null;
    const input =
      kind === "accounts"
        ? {
            name: value("name"),
            website: value("website"),
            owner: person,
            industry: value("industry"),
            location: value("location"),
            revenue: value("revenue") === "" ? null : Number(value("revenue")),
            headcount:
              value("headcount") === "" ? null : Number(value("headcount")),
            linkedin: value("linkedin"),
            facebook: value("facebook"),
            instagram: value("instagram"),
            twitter: value("twitter"),
          }
        : kind === "contacts"
          ? {
              name: value("name"),
              email: value("email"),
              phone: value("phone"),
              role: value("role"),
              accountId: value("accountId") || null,
              owner: person,
            }
          : kind === "opportunities"
            ? {
                name: value("name"),
                accountId: value("accountId") || null,
                stage: value("stage"),
                amount: Number(value("amount")),
                currency: "USD",
                closeDate: value("closeDate") || null,
                nextStep: value("nextStep"),
                owner: person,
                contactIds: form.getAll("contactIds").map(String),
              }
            : {
                title: value("name"),
                dueDate: value("dueDate") || null,
                status: value("status"),
                assignee: person,
                relatedRecords: form.getAll("relatedRecords").map((item) => {
                  const [type, id] = String(item).split(":");
                  return { type, id };
                }),
              };
    const parsed = recordSchemas[kind].safeParse(input);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues)
        errors[
          String(issue.path[0]) === "title" ? "name" : String(issue.path[0])
        ] =
          (
            {
              name: "Enter a name between 1 and 1,000 characters.",
              title: "Enter a title between 1 and 1,000 characters.",
              website:
                "Enter a full website URL beginning with http:// or https://.",
              email: "Enter a valid email address.",
              amount: "Enter an amount of zero or more.",
              closeDate: "Enter a valid close date.",
              dueDate: "Enter a valid due date.",
            } as Record<string, string>
          )[String(issue.path[0])] ?? issue.message;
      setErrors(errors);
      setError("Check the highlighted fields.");
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    saving.current = true;
    setPending(true);
    onPending(true);
    setErrors({});
    setError(null);
    try {
      const saved = record
        ? await data.update(kind, record.id, parsed.data)
        : await data.create(
            kind,
            parsed.data,
            list ? { listId: list.id } : undefined,
          );
      if (list) notifyListsChanged();
      onSaved(saved);
    } catch {
      setError("Could not save the record. Your entries are kept. Try again.");
    } finally {
      saving.current = false;
      setPending(false);
      onPending(false);
    }
  }

  function field(
    name: string,
    label: string,
    type = "text",
    defaultValue = "",
    required = false,
  ) {
    return (
      <div className="grid gap-1.5" key={name}>
        <label htmlFor={`${id}-${name}`} className="text-sm font-medium">
          {label}
          {required ? " *" : ""}
        </label>
        <Input
          id={`${id}-${name}`}
          name={name}
          type={type}
          defaultValue={String(savedValue(name) ?? defaultValue)}
          required={required}
          min={type === "number" ? 0 : undefined}
          step={
            type === "number" ? (name === "headcount" ? 1 : "any") : undefined
          }
          inputMode={
            type === "number"
              ? name === "headcount"
                ? "numeric"
                : "decimal"
              : undefined
          }
          aria-invalid={!!errors[name]}
          aria-describedby={errors[name] ? `${id}-${name}-error` : undefined}
        />
        {errors[name] && (
          <p id={`${id}-${name}-error`} className="text-xs text-destructive">
            {errors[name]}
          </p>
        )}
      </div>
    );
  }
  function dateField(name: string, label: string) {
    return (
      <div className="grid gap-1.5" key={name}>
        <label htmlFor={`${id}-${name}`} className="text-sm font-medium">
          {label}
        </label>
        <DatePicker
          id={`${id}-${name}`}
          name={name}
          label={label}
          defaultValue={String(savedValue(name) ?? "") || null}
          disabled={pending || loading || loadError}
          error={errors[name]}
        />
        {errors[name] && (
          <p id={`${id}-${name}-error`} className="text-xs text-destructive">
            {errors[name]}
          </p>
        )}
      </div>
    );
  }
  function select(
    name: string,
    label: string,
    choices: FieldChoice[],
    multiple = false,
    blank = true,
  ) {
    const stored = savedValue(name);
    const defaultValue = record
      ? name === "relatedRecords" && Array.isArray(stored)
        ? stored.map((item) => {
            const reference = item as { type: RecordKind; id: string };
            return `${reference.type}:${reference.id}`;
          })
        : Array.isArray(stored)
          ? stored.map(String)
          : [String(stored ?? "")].filter(Boolean)
      : name === "stage"
        ? [initialStage ?? stages[0]]
        : blank
          ? []
          : [choices[0]?.id ?? ""];
    const props = {
      id: `${id}-${name}`,
      name,
      label,
      choices,
      disabled: pending || loading || loadError,
      error: errors[name],
    };
    return blank ? (
      <RecordPicker
        key={name}
        {...props}
        multiple={multiple}
        selectedFirst={name === "contactIds"}
        defaultValue={defaultValue}
      />
    ) : (
      <ChoiceSelect key={name} {...props} defaultValue={defaultValue[0]} />
    );
  }
  return (
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-4">
      <fieldset
        key={loading ? "loading" : "ready"}
        disabled={pending || loading || loadError}
        className="space-y-4"
      >
        {field("name", kind === "tasks" ? "Title" : "Name", "text", "", true)}
        {kind === "accounts" && (
          <>
            {field("website", "Website", "url")}
            {field("industry", "Industry")}
            <div className="grid grid-cols-2 gap-3">
              {field("revenue", "Annual revenue (USD)", "number")}
              {field("headcount", "Headcount", "number")}
            </div>
            {field("location", "Location")}
            {field("linkedin", "LinkedIn", "url")}
            {field("facebook", "Facebook", "url")}
            {field("instagram", "Instagram", "url")}
            {field("twitter", "Twitter / X", "url")}
          </>
        )}
        {kind === "contacts" && (
          <>
            {field("email", "Email", "email")}
            {field("phone", "Phone", "tel")}
            {field("role", "Role")}
          </>
        )}
        {(kind === "contacts" || kind === "opportunities") &&
          select(
            "accountId",
            "Account",
            options.filter((option) => option.kind === "accounts"),
          )}
        {kind === "opportunities" && (
          <>
            {select(
              "stage",
              "Stage",
              stages.map((stage) => ({
                id: stage,
                name: stageLabels[stage],
                icon: <StageIcon stage={stage} />,
              })),
              false,
              false,
            )}
            {field("amount", "Amount (USD)", "number", "0")}
            {dateField("closeDate", "Close date")}
            {select(
              "contactIds",
              "Related contacts",
              options.filter((option) => option.kind === "contacts"),
              true,
            )}
            <div className="grid gap-1.5">
              <label htmlFor={`${id}-nextStep`} className="text-sm font-medium">
                Next step
              </label>
              <Textarea
                id={`${id}-nextStep`}
                name="nextStep"
                maxLength={50000}
                defaultValue={String(savedValue("nextStep") ?? "")}
              />
            </div>
          </>
        )}
        {kind === "tasks" && (
          <>
            {select(
              "status",
              "Status",
              taskStatusOptions.map(({ value, label }) => ({
                id: value,
                name: label,
                icon: <TaskStatusIcon status={value} />,
              })),
              false,
              false,
            )}
            {dateField("dueDate", "Due date")}
            {select(
              "relatedRecords",
              "Related records",
              options
                .filter((option) => option.kind !== "tasks")
                .map((option) => ({
                  id: `${option.kind}:${option.id}`,
                  name: option.name,
                  icon: <RecordKindIcon kind={option.kind} />,
                  typeLabel: recordLabels[option.kind],
                  description: option.description,
                  keywords: [recordLabels[option.kind]],
                })),
              true,
            )}
          </>
        )}
        <MemberPicker
          id={`${id}-owner`}
          name="owner"
          label={kind === "tasks" ? "Assignee" : "Owner"}
          members={people}
          disabled={pending || loading || loadError}
          defaultValue={selectedPersonId}
        />
      </fieldset>
      {loading && (
        <output className="block text-sm text-muted-foreground">
          Loading relationship choices…
        </output>
      )}
      {loadError && (
        <div role="alert" className="space-y-2 text-sm">
          <p>Could not load relationship choices.</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Retry
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant={record ? "default" : "outline"}
          disabled={pending || loading || loadError}
        >
          {pending
            ? "Saving…"
            : record
              ? "Save changes"
              : `Create ${recordLabels[kind]}`}
        </Button>
      </div>
    </form>
  );
}

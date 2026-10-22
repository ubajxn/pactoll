"use client";

import { Box, Building2, Handshake, UserRound } from "lucide-react";
import { type RefObject, useId, useRef, useState } from "react";
import { notifyListsChanged } from "@/components/crm/lists-provider";
import { ChoiceSelect } from "@/components/crm/record-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  type CrmList,
  DataError,
  type ListRecordKind,
  listInputSchema,
} from "@/lib/data/contracts";
import { useData } from "@/lib/data/provider";

export const listTypeLabels = {
  accounts: "Accounts",
  opportunities: "Opportunities",
  contacts: "Contacts",
};

const listTypeChoices = [
  {
    id: "accounts",
    name: listTypeLabels.accounts,
    icon: <Building2 aria-hidden="true" className="size-4" />,
  },
  {
    id: "opportunities",
    name: listTypeLabels.opportunities,
    icon: <Handshake aria-hidden="true" className="size-4" />,
  },
  {
    id: "contacts",
    name: listTypeLabels.contacts,
    icon: <UserRound aria-hidden="true" className="size-4" />,
  },
];

export function ListDialog({
  open,
  onOpenChange,
  recordType,
  recordId,
  list,
  onSaved,
  returnFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordType?: ListRecordKind;
  recordId?: string;
  list?: CrmList;
  onSaved?: (list: CrmList) => void;
  returnFocus?: RefObject<HTMLButtonElement | null>;
}) {
  const busy = useRef(false);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!busy.current) onOpenChange(next);
      }}
    >
      {open && (
        <ListForm
          key={list?.id ?? recordId ?? "new"}
          {...{
            onOpenChange,
            recordType,
            recordId,
            list,
            onSaved,
            returnFocus,
            busy,
          }}
        />
      )}
    </Dialog>
  );
}

function ListForm({
  onOpenChange,
  recordType,
  recordId,
  list,
  onSaved,
  returnFocus,
  busy,
}: Omit<Parameters<typeof ListDialog>[0], "open"> & {
  busy: RefObject<boolean>;
}) {
  const data = useData();
  const id = useId();
  const [name, setName] = useState(list?.name ?? "");
  const [type, setType] = useState<ListRecordKind | "">(
    list?.recordType ?? recordType ?? "",
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <DialogContent
      finalFocus={returnFocus}
      className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
      showCloseButton={false}
    >
      <DialogHeader className="gap-2">
        <DialogTitle>{list ? "Rename list" : "Create list"}</DialogTitle>
        <DialogDescription>
          {recordId
            ? "Create a list and add this record to it."
            : "Organize records in a list shared with your company."}
        </DialogDescription>
      </DialogHeader>
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy.current) return;
          const parsed = listInputSchema.safeParse({
            name,
            recordType: type,
            recordId,
          });
          if (!parsed.success) {
            setError(
              parsed.error.issues[0]?.message ?? "Check the list details.",
            );
            return;
          }
          busy.current = true;
          setPending(true);
          setError("");
          try {
            const saved = list
              ? await data.updateList(list.id, { name: parsed.data.name })
              : await data.createList(parsed.data);
            notifyListsChanged();
            onOpenChange(false);
            onSaved?.(saved);
          } catch (error) {
            setError(
              error instanceof DataError
                ? error.message
                : "Could not save the list. Try again.",
            );
          } finally {
            busy.current = false;
            setPending(false);
          }
        }}
      >
        <div className="grid gap-1.5">
          <label htmlFor={`${id}-name`} className="text-sm font-medium">
            Name
          </label>
          <Input
            id={`${id}-name`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            disabled={pending}
            placeholder="e.g. Priority accounts"
            aria-invalid={!!error}
          />
        </div>
        {!list && (
          <ChoiceSelect
            id={`${id}-type`}
            name="recordType"
            label="Record type"
            choices={listTypeChoices}
            defaultValue=""
            value={type}
            placeholder="Select record type…"
            placeholderIcon={
              <Box
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
            }
            disabled={pending || !!recordId}
            onValueChange={(value) => setType(value as ListRecordKind)}
          />
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant={list ? "default" : "outline"}
            disabled={pending || !name.trim() || (!list && !type)}
          >
            {pending ? "Saving…" : list ? "Save" : "Create list"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

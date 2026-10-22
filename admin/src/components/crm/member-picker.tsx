"use client";

import { RecordPicker } from "@/components/crm/record-fields";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Member } from "@/lib/data/contracts";

export function MemberAvatar({
  member,
  className,
}: {
  member: { name: string; image?: string | null };
  className?: string;
}) {
  const parts = member.name.trim().split(/\s+/).filter(Boolean);
  const initials = (parts.length > 1 ? [parts[0], parts.at(-1)] : parts)
    .map((part) => Array.from(part ?? "")[0] ?? "")
    .join("")
    .toUpperCase();
  return (
    <Avatar size="sm" className={className} aria-hidden="true">
      {member.image && <AvatarImage src={member.image} alt="" />}
      <AvatarFallback>{initials || "?"}</AvatarFallback>
    </Avatar>
  );
}

export function MemberPicker({
  id,
  name,
  label,
  members,
  defaultValue = "",
  disabled,
  value,
  onValueChange,
  variant = "default",
  showLabel = true,
  error,
  emptyLabel = "Unassigned",
}: {
  id: string;
  name: string;
  label: string;
  members: Member[];
  defaultValue?: string;
  disabled?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  variant?: "default" | "inline";
  showLabel?: boolean;
  error?: string;
  emptyLabel?: string;
}) {
  return (
    <div className={showLabel ? "grid gap-1.5" : "min-w-0"}>
      <RecordPicker
        id={id}
        name={name}
        label={label}
        choices={members.map((member) => ({
          id: member.id,
          name: member.name,
          keywords: [member.email],
          icon: <MemberAvatar member={member} />,
        }))}
        defaultValue={defaultValue ? [defaultValue] : []}
        emptyLabel={emptyLabel}
        searchLabel="Search team members"
        disabled={disabled}
        error={error}
        value={value === undefined ? undefined : value ? [value] : []}
        onValueChange={(values) => onValueChange?.(values[0] ?? "")}
        variant={variant}
        showLabel={showLabel}
      />
      {members.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Add members in Settings → Team to assign this record.
        </p>
      )}
    </div>
  );
}

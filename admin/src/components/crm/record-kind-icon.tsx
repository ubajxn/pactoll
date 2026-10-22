import { Building2, Handshake, ListTodo, Users } from "lucide-react";
import type { RecordKind } from "@/lib/data/contracts";

const icons = {
  accounts: Building2,
  contacts: Users,
  opportunities: Handshake,
  tasks: ListTodo,
};

export function RecordKindIcon({ kind }: { kind: RecordKind }) {
  const Icon = icons[kind];
  return (
    <Icon
      aria-hidden="true"
      className="size-3.5 shrink-0 text-muted-foreground"
    />
  );
}

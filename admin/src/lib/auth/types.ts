import type { Member } from "@/lib/data/contracts";
import type { Role } from "@/lib/permissions";

export interface WorkspaceContext {
  user: Member;
  workspace: { id: string; name: string; slug: string };
  role: Role;
}

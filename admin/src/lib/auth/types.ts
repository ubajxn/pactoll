import type { Member } from "@/lib/data/contracts";

export interface WorkspaceContext {
  user: Member;
  workspace: { id: string; name: string; slug: string };
  role: string;
}

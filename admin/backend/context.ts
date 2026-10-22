import type { Pool } from "pg";
import type { WorkspaceContext } from "../src/lib/auth/types";
import type { Role } from "../src/lib/permissions";
import { DataError } from "../src/lib/data/contracts";
import type { Auth } from "./auth";

export async function getWorkspaceContext(
  auth: Auth,
  pool: Pool,
  request: Request,
): Promise<WorkspaceContext> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user.emailVerified)
    throw new DataError("unauthorized", "Sign in to continue");
  const organizationId = session.session.activeOrganizationId;
  const { rows } = await pool.query<{
    id: string;
    name: string;
    slug: string;
    role: string;
  }>(
    'SELECT o.id,o.name,o.slug,m.role FROM organization o JOIN member m ON m."organizationId"=o.id WHERE ($1::uuid IS NULL OR o.id=$1::uuid) AND m."userId"=$2 LIMIT 1',
    [organizationId ?? null, session.user.id],
  );
  const workspace = rows[0];
  if (!workspace)
    throw new DataError(
      "workspace_required",
      "Open your invitation link to join the company, or ask an admin for access",
    );
  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    },
    workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
    role: workspace.role as Role,
  };
}

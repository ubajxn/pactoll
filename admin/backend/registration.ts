import { createHash } from "node:crypto";
import { APIError } from "better-auth/api";
import type { Pool } from "pg";

export const invitationRequired = () =>
  new APIError("FORBIDDEN", {
    code: "INVITATION_REQUIRED",
    message:
      "An invitation is required. Open the invitation link sent to your email or ask a company admin for one.",
  });

export function signupTokenHash(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

export async function publicSignupAllowed(pool: Pool) {
  const { rows } = await pool.query<{ allowed: boolean }>(
    "SELECT NOT signup_closed AS allowed FROM crm_installation WHERE singleton",
  );
  return rows[0]?.allowed === true;
}

export async function validInvitation(pool: Pool, id: unknown, email: string) {
  if (typeof id !== "string") return false;
  const { rowCount } = await pool.query(
    `SELECT id FROM invitation WHERE id::text=$1 AND lower(email)=lower($2)
       AND status='pending' AND "expiresAt">now()`,
    [id, email],
  );
  return rowCount === 1;
}

export async function authorizeSignup(
  pool: Pool,
  email: string,
  token?: string,
) {
  if (await publicSignupAllowed(pool)) return;
  if (token) {
    const { rowCount } = await pool.query(
      `SELECT i.id FROM crm_signup_links l JOIN invitation i ON i.id=l.invitation_id
       WHERE l.token_hash=$1 AND l.expires_at>now() AND lower(i.email)=lower($2)
         AND i.status='pending' AND i."expiresAt">now()`,
      [signupTokenHash(token), email],
    );
    if (rowCount === 1) return;
  }
  throw invitationRequired();
}

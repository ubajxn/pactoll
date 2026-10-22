import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { magicLink, organization } from "better-auth/plugins";
import type { Pool } from "pg";
import { validatedAvatar } from "./avatar";
import { authBaseUrl, authSecret } from "./config";
import { createEmailSender, createSignInEmail, type Email } from "./email";
import {
  authorizeSignup,
  invitationRequired,
  publicSignupAllowed,
  signupTokenHash,
  validInvitation,
} from "./registration";

function validatedName(value: string) {
  const name = value.trim();
  if (!name || name.length > 100)
    throw new APIError("BAD_REQUEST", {
      message: "Name must be between 1 and 100 characters",
    });
  return name;
}

export function createAuth(
  pool: Pool,
  options: {
    baseURL?: string;
    secret?: string;
    sendEmail?: (email: Email) => Promise<void>;
  } = {},
) {
  const baseURL = options.baseURL ?? authBaseUrl();
  const sendEmail = options.sendEmail ?? createEmailSender();
  return betterAuth({
    appName: "CRM",
    database: pool,
    baseURL,
    secret: options.secret ?? authSecret(),
    trustedOrigins: [baseURL],
    emailAndPassword: { enabled: true },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        enabled: Boolean(process.env.GOOGLE_CLIENT_ID),
      },
    },
    onAPIError: {
      onError(error) {
        const constraint =
          error && typeof error === "object" && "constraint" in error
            ? error.constraint
            : undefined;
        if (constraint === "signup_invitation_required")
          throw invitationRequired();
        if (
          constraint !== "member_last_owner_delete" &&
          constraint !== "member_last_owner_update"
        )
          return;
        throw new APIError("BAD_REQUEST", {
          code:
            constraint === "member_last_owner_delete"
              ? "YOU_CANNOT_LEAVE_THE_ORGANIZATION_AS_THE_ONLY_OWNER"
              : "YOU_CANNOT_LEAVE_THE_ORGANIZATION_WITHOUT_AN_OWNER",
          message:
            constraint === "member_last_owner_delete"
              ? "You cannot leave the organization as the only owner"
              : "You cannot leave the organization without an owner",
        });
      },
    },
    advanced: {
      database: { generateId: "uuid" },
      ipAddress: { ipAddressHeaders: ["x-crm-client-ip"] },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === "/sign-in/magic-link") {
          const email = String(ctx.body.email ?? "")
            .trim()
            .toLowerCase();
          ctx.body.email = email;
          const existing = await pool.query(
            'SELECT id FROM "user" WHERE lower(email)=$1',
            [email],
          );
          if (
            !existing.rowCount &&
            !(await publicSignupAllowed(pool)) &&
            !(await validInvitation(
              pool,
              ctx.body.metadata?.invitationId,
              email,
            ))
          )
            throw invitationRequired();
        }
        if (ctx.path !== "/organization/invite-member") return;
        // Better Auth normally logs and swallows invitation email failures.
        // This request must fail so the UI never claims an unsent email was sent.
        return {
          context: {
            ...ctx,
            context: {
              ...ctx.context,
              runInBackgroundOrAwait: async (
                delivery: Parameters<
                  typeof ctx.context.runInBackgroundOrAwait
                >[0],
              ) => {
                try {
                  await delivery;
                } catch {
                  throw new APIError("SERVICE_UNAVAILABLE", {
                    message:
                      "Invitation email could not be sent. Retry from Pending invitations.",
                  });
                }
              },
            },
          },
        };
      }),
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user, ctx) => {
            await authorizeSignup(pool, user.email, ctx?.query?.token);
            return {
              data: {
                ...user,
                name:
                  user.name.trim().slice(0, 100) || user.email.split("@")[0],
              },
            };
          },
        },
        update: {
          before: async (user) => {
            return {
              data: {
                ...user,
                ...(user.name === undefined
                  ? {}
                  : { name: validatedName(user.name) }),
                ...(user.image === undefined
                  ? {}
                  : { image: validatedAvatar(user.image) }),
              },
            };
          },
        },
      },
      session: {
        create: {
          before: async (session) => {
            const { rows } = await pool.query<{ organizationId: string }>(
              'SELECT "organizationId" FROM member WHERE "userId"=$1 LIMIT 1',
              [session.userId],
            );
            return {
              data: {
                ...session,
                activeOrganizationId: rows[0]?.organizationId ?? null,
              },
            };
          },
        },
      },
    },
    session: { expiresIn: 60 * 60 * 24 * 7, cookieCache: { enabled: false } },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 100,
      customRules: { "/sign-in/magic-link": { window: 60, max: 5 } },
    },
    plugins: [
      magicLink({
        expiresIn: 60 * 15,
        storeToken: "hashed",
        async sendMagicLink({ email, url, token, metadata }) {
          await pool.query(
            "DELETE FROM crm_signup_links WHERE expires_at<=now()",
          );
          if (await validInvitation(pool, metadata?.invitationId, email)) {
            await pool.query(
              "INSERT INTO crm_signup_links (token_hash,invitation_id,expires_at) VALUES ($1,$2,now()+interval '15 minutes')",
              [signupTokenHash(token), metadata?.invitationId],
            );
          }
          try {
            await sendEmail(createSignInEmail(email, url));
          } catch {
            throw new APIError("SERVICE_UNAVAILABLE", {
              message:
                "Your sign-in email could not be sent. Please try again.",
            });
          }
        },
      }),
      organization({
        allowUserToCreateOrganization: false,
        requireEmailVerificationOnInvitation: true,
        disableOrganizationDeletion: true,
        invitationExpiresIn: 60 * 60 * 24 * 7,
        organizationHooks: {
          beforeUpdateOrganization: async ({ organization }) => ({
            data: {
              ...organization,
              ...(organization.name === undefined
                ? {}
                : { name: validatedName(organization.name) }),
            },
          }),
        },
        async sendInvitationEmail({ id, email, organization, inviter }) {
          const url = `${baseURL}/invite/${encodeURIComponent(id)}`;
          await sendEmail({
            to: email,
            subject: `Join ${organization.name} on CRM`,
            text: `${inviter.user.name} invited you to join ${organization.name}.\n\n${url}\n\nSign in with ${email} to accept. This invitation expires in 7 days.`,
          });
        },
      }),
    ],
  });
}
export type Auth = ReturnType<typeof createAuth>;

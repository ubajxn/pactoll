import { hashPassword } from "better-auth/crypto";
import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Set DATABASE_URL env var");
  process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: node scripts/set-password.mjs <email> <password>");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });

try {
  const { rows } = await pool.query('SELECT id FROM "user" WHERE lower(email) = lower($1)', [email]);
  if (!rows.length) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  const userId = rows[0].id;
  const hashed = await hashPassword(password);

  const { rows: accounts } = await pool.query(
    'SELECT id FROM account WHERE "userId" = $1 AND "providerId" = $2',
    [userId, "credential"],
  );

  if (accounts.length) {
    await pool.query(
      'UPDATE account SET password = $1, "updatedAt" = now() WHERE id = $2',
      [hashed, accounts[0].id],
    );
    console.log(`Password updated for ${email}`);
  } else {
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO account (id, "userId", "providerId", "accountId", password, "createdAt", "updatedAt")
       VALUES ($1::uuid, $2::uuid, 'credential', $3::text, $4, now(), now())`,
      [id, userId, userId, hashed],
    );
    console.log(`Password credential created for ${email}`);
  }
} finally {
  await pool.end();
}

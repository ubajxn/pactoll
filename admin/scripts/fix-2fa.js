const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`ALTER TABLE "twoFactor" ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false`);
    await client.query(`ALTER TABLE "twoFactor" ADD COLUMN IF NOT EXISTS "failedVerificationCount" INTEGER DEFAULT 0`);
    await client.query(`ALTER TABLE "twoFactor" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMPTZ`);
    await client.query('COMMIT');

    const cols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'twoFactor' ORDER BY ordinal_position
    `);
    console.log('twoFactor columns:', cols.rows.map(r => r.column_name).join(', '));
    console.log('SUCCESS');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('FAILED:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
})();

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: node scripts/run-migration.js <migration-file>');
  process.exit(1);
}

(async () => {
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(path.resolve('backend/migrations', migrationFile), 'utf8');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log(`SUCCESS: ${migrationFile} applied`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('FAILED:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
})();

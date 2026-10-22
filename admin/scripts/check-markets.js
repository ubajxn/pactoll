const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });
const ORG = 'da62326b-707d-41bd-bc2d-a61a81926dae';

(async () => {
  const { rows } = await pool.query(
    `SELECT id, name, vertical, territory_id, estimated_market_size, estimated_addressable,
            current_penetration_pct, growth_rate_pct, volume_potential_tons_yr, avg_price_per_lb,
            key_players, material_requirements, typical_gauges, typical_widths, typical_grades,
            competitive_landscape, barriers_to_entry, is_active, notes
     FROM erp_target_markets WHERE org_id = $1`, [ORG]
  );
  console.log(`Found ${rows.length} target markets:`);
  rows.forEach(r => {
    console.log(`\n  ${r.name} (${r.vertical})`);
    console.log(`    Market: $${r.estimated_market_size?.toLocaleString() || '—'} | Addressable: $${r.estimated_addressable?.toLocaleString() || '—'}`);
    console.log(`    Penetration: ${r.current_penetration_pct || '—'}% | Growth: ${r.growth_rate_pct || '—'}%`);
    console.log(`    Volume: ${r.volume_potential_tons_yr || '—'} tons/yr | Avg $/lb: ${r.avg_price_per_lb || '—'}`);
    console.log(`    Territory: ${r.territory_id || 'unassigned'}`);
  });

  // Get territory IDs for assignment
  const terrs = await pool.query(`SELECT id, name FROM erp_territories WHERE org_id = $1`, [ORG]);
  console.log('\nTerritories:');
  terrs.rows.forEach(t => console.log(`  ${t.name}: ${t.id}`));

  await pool.end();
})();

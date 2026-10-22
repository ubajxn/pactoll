const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });
const ORG = 'da62326b-707d-41bd-bc2d-a61a81926dae';

(async () => {
  const client = await pool.connect();
  try {
    const terrs = await client.query(`SELECT id, name FROM erp_territories WHERE org_id = $1`, [ORG]);
    const socal = terrs.rows.find(t => t.name.includes('California'))?.id;
    const az = terrs.rows.find(t => t.name.includes('Arizona'))?.id;

    // Datacenter — Arizona focus, highest growth
    await client.query(`
      UPDATE erp_target_markets SET
        territory_id = $2,
        estimated_market_size = 500000000,
        estimated_addressable = 18500000,
        current_penetration_pct = 1.8,
        growth_rate_pct = 42,
        volume_potential_tons_yr = 8500,
        avg_price_per_lb = 0.085,
        key_players = $3,
        material_requirements = $4,
        typical_gauges = '14ga - 3/8"',
        typical_widths = '48" - 72"',
        typical_grades = 'A36, A572-50, A500, A1011',
        competitive_landscape = 'Limited local toll processing in AZ. Service centers doing some blanking but lack dedicated slitting capacity. Major opportunity to be first mover.',
        barriers_to_entry = 'Long lead times on structural grades. Must carry adequate CRS/HRS inventory. Relationships with GCs and MEP contractors critical.',
        notes = 'QTS Chandler expanding Phase III. CyrusOne building 2 new facilities in Mesa. Microsoft Azure campus in Goodyear. Google breaking ground in Mesa. Meta exploring sites. Demand for structural steel panels, cable tray blanks, and enclosure components. Growing 42% YoY — fastest vertical.'
      WHERE org_id = $1 AND vertical = 'datacenter'
    `, [
      ORG, az,
      JSON.stringify(["QTS Realty Trust", "CyrusOne", "Microsoft Azure", "Google Cloud", "Meta Platforms", "Digital Realty", "Aligned Energy", "EdgeCore", "Stream Data Centers"]),
      JSON.stringify({"structural_panels": "A36/A572 blanks for wall and roof panels", "cable_tray": "CRS blanks for cable management systems", "enclosures": "GA/GL panels for electrical enclosures", "hvac_supports": "A36 angle and channel for mechanical supports", "raised_floor": "CRS pedestals and stringers"})
    ]);

    // Solar — both territories
    await client.query(`
      UPDATE erp_target_markets SET
        territory_id = $2,
        estimated_market_size = 250000000,
        estimated_addressable = 12000000,
        current_penetration_pct = 3.5,
        growth_rate_pct = 22,
        volume_potential_tons_yr = 5200,
        avg_price_per_lb = 0.072,
        key_players = $3,
        material_requirements = $4,
        typical_gauges = '12ga - 1/4"',
        typical_widths = '3" - 12" (slit coil)',
        typical_grades = 'A572-50, A36, galvanized G90',
        competitive_landscape = 'Several service centers compete. PTP advantage is high-volume slitting at tight tolerances for tracker rail.',
        barriers_to_entry = 'Must maintain tight gauge tolerance (+/- 0.002"). Solar developers want JIT delivery to remote sites. Long payment terms typical.',
        notes = 'IRA driving massive utility-scale buildout across Southwest. NEXTracker and Array Technologies both expanding AZ manufacturing. Tracker rail is high-volume slit coil — PTP sweet spot. CA rooftop solar also steady demand.'
      WHERE org_id = $1 AND vertical = 'solar'
    `, [
      ORG, socal,
      JSON.stringify(["NEXTracker", "Array Technologies", "First Solar", "SunPower", "Canadian Solar", "Borrego Solar", "Recurrent Energy"]),
      JSON.stringify({"tracker_rail": "A572-50 slit coil for single-axis trackers", "mounting_brackets": "Galvanized blanks for roof/ground mount", "structural": "A36 for carport and ground-mount structures", "cable_tray": "Galvanized slit coil for cable management"})
    ]);

    // HVAC — SoCal focused
    await client.query(`
      UPDATE erp_target_markets SET
        territory_id = $2,
        estimated_market_size = 180000000,
        estimated_addressable = 8500000,
        current_penetration_pct = 4.2,
        growth_rate_pct = 14,
        volume_potential_tons_yr = 3800,
        avg_price_per_lb = 0.092,
        key_players = $3,
        material_requirements = $4,
        typical_gauges = '20ga - 14ga',
        typical_widths = '24" - 60"',
        typical_grades = 'CRS, GA G60/G90, aluminized Type 1',
        competitive_landscape = 'Established relationships with LA-area HVAC manufacturers. Several competitors but PTP has quality advantage on leveled sheet.',
        barriers_to_entry = 'Surface quality critical — no scratches, dents, or coil breaks. Must level to flatness tolerance. Quick turnaround expected.',
        notes = 'Steady bread-and-butter business. Ductwork fabricators need consistent leveled sheet. Heat exchanger manufacturers need precision blanks. Residential construction driving demand.'
      WHERE org_id = $1 AND vertical = 'hvac'
    `, [
      ORG, socal,
      JSON.stringify(["Johnson Controls", "Daikin", "Lennox", "Carrier", "Trane", "LA Sheet Metal Works", "Pacific HVAC Supply"]),
      JSON.stringify({"ductwork": "GA G60 leveled sheet for duct fabrication", "heat_exchangers": "CRS precision blanks", "housings": "GA G90 blanks for unit housings", "brackets": "CRS slit coil for mounting hardware"})
    ]);

    // Automotive — SoCal
    await client.query(`
      UPDATE erp_target_markets SET
        territory_id = $2,
        estimated_market_size = 120000000,
        estimated_addressable = 4200000,
        current_penetration_pct = 2.8,
        growth_rate_pct = 8,
        volume_potential_tons_yr = 2100,
        avg_price_per_lb = 0.105,
        key_players = $3,
        material_requirements = $4,
        typical_gauges = '22ga - 10ga',
        typical_widths = '6" - 48"',
        typical_grades = 'CRS, HRPO, EDD, HSLA',
        competitive_landscape = 'Competitive but margin-rich. Automotive aftermarket shops need fast turnaround on smaller runs. OEM stampers need precise slit widths.',
        barriers_to_entry = 'Tight width tolerances on slit coil. Surface quality requirements. Must handle draw-quality and HSLA grades without edge cracking.',
        notes = 'Aftermarket parts manufacturers in LA/OC corridor. Brackets, mounts, chassis components. Also EV startup supply chain developing.'
      WHERE org_id = $1 AND vertical = 'automotive'
    `, [
      ORG, socal,
      JSON.stringify(["Dorman Products", "Spectra Premium", "US Auto Parts", "Unique Fabricating", "Martinrea", "EV startup suppliers"]),
      JSON.stringify({"brackets": "HRPO/CRS slit coil for stamped brackets", "chassis": "HSLA blanks for structural components", "panels": "CRS leveled sheet for body panels", "ev_battery": "Precision slit aluminum for battery enclosures"})
    ]);

    // Construction — both territories
    await client.query(`
      UPDATE erp_target_markets SET
        territory_id = $2,
        estimated_market_size = 350000000,
        estimated_addressable = 14000000,
        current_penetration_pct = 3.8,
        growth_rate_pct = 11,
        volume_potential_tons_yr = 6200,
        avg_price_per_lb = 0.068,
        key_players = $3,
        material_requirements = $4,
        typical_gauges = '16ga - 1/2"',
        typical_widths = '36" - 72"',
        typical_grades = 'A36, A572-50, GA G90, A500',
        competitive_landscape = 'Most competitive vertical. Service centers and other toll processors all chase construction. Win on turnaround, quality, and relationship.',
        barriers_to_entry = 'Price-sensitive market. Must maintain competitive per-lb rates. Volume drives profitability. Long payment terms common with GCs.',
        notes = 'LA commercial and industrial construction steady. AZ booming with warehouse/distribution centers. Steel decking, studs, joists, and miscellaneous metals. Good base-load business.'
      WHERE org_id = $1 AND vertical = 'construction'
    `, [
      ORG, socal,
      JSON.stringify(["Clark Construction", "Hensel Phelps", "Turner Construction", "McCarthy Building", "Sundt Construction", "Layton Construction"]),
      JSON.stringify({"decking": "GA G90 blanks for floor/roof deck", "studs": "GA G60 slit coil for metal studs", "joists": "A36/A572 blanks for open web joists", "misc_metals": "A36 plate and sheet for fabrication"})
    ]);

    // Verify
    const markets = await client.query(
      `SELECT name, vertical, territory_id, volume_potential_tons_yr, avg_price_per_lb, growth_rate_pct,
              key_players IS NOT NULL as has_players, material_requirements IS NOT NULL as has_reqs
       FROM erp_target_markets WHERE org_id = $1 ORDER BY growth_rate_pct DESC`, [ORG]
    );
    console.log('Updated target markets:');
    markets.rows.forEach(m => {
      console.log(`  ${m.name} (${m.vertical}): ${m.volume_potential_tons_yr} tons/yr @ $${m.avg_price_per_lb}/lb, +${m.growth_rate_pct}% growth, players: ${m.has_players}, reqs: ${m.has_reqs}`);
    });
    console.log('SUCCESS');
  } catch(e) {
    console.error('FAILED:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
})();

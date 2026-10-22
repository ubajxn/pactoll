const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });
const ORG = 'da62326b-707d-41bd-bc2d-a61a81926dae';

(async () => {
  const client = await pool.connect();
  try {
    // Update existing territories with deep fields
    await client.query(`
      UPDATE erp_territories SET
        territory_type = 'exclusive',
        state_codes = '["CA"]',
        zip_codes = '["90001","90002","90220","90221","90222","90301","90302","90303","90501","90502","90503","90504","90505","90506","90710","90717","90731","90732","90744","90745","90746","90747","90810","90813","90814","90815"]',
        counties = '["Los Angeles County"]',
        cities = '["Carson","Long Beach","Torrance","Inglewood","Hawthorne","Gardena","Compton","Wilmington","San Pedro","Rancho Dominguez"]',
        msas = '["Los Angeles-Long Beach-Anaheim"]',
        center_lat = 33.8317,
        center_lng = -118.2818,
        radius_miles = 30,
        quota = 3500000,
        quota_period = 'annual',
        quota_attainment_pct = 72,
        current_revenue = 2520000,
        current_customers = 48,
        target_customers = 65,
        total_prospects = 180,
        population = 10040000,
        num_businesses = 350000,
        num_manufacturing_businesses = 12400,
        color = '#2563eb',
        notes = 'Core territory. Home base in Carson. Dense manufacturing corridor from Wilmington to Torrance. Strong existing relationships with steel service centers and fabricators.'
      WHERE org_id = $1 AND name ILIKE '%california%'
    `, [ORG]);

    await client.query(`
      UPDATE erp_territories SET
        territory_type = 'exclusive',
        state_codes = '["AZ"]',
        zip_codes = '["85001","85003","85004","85006","85008","85009","85012","85014","85016","85018","85020","85022","85024","85027","85028","85029","85032","85033","85034","85035","85040","85041","85042","85043","85044","85048","85050","85051","85053","85054","85083","85085","85086","85204","85206","85210","85224","85225","85226","85233","85234","85248","85249","85250","85251","85253","85254","85255","85256","85257","85258","85260","85281","85282","85283","85284","85286"]',
        counties = '["Maricopa County","Pinal County"]',
        cities = '["Phoenix","Mesa","Chandler","Gilbert","Tempe","Scottsdale","Goodyear","Surprise","Buckeye"]',
        msas = '["Phoenix-Mesa-Chandler"]',
        center_lat = 33.4484,
        center_lng = -112.0740,
        radius_miles = 50,
        quota = 1500000,
        quota_period = 'annual',
        quota_attainment_pct = 28,
        current_revenue = 420000,
        current_customers = 12,
        target_customers = 35,
        total_prospects = 95,
        population = 4946000,
        num_businesses = 125000,
        num_manufacturing_businesses = 3200,
        color = '#d97706',
        notes = 'Growth territory. Datacenter boom driving massive steel demand — QTS, CyrusOne, Microsoft Azure, Google all building. Focus on structural steel needs and panel processing for datacenter enclosures.'
      WHERE org_id = $1 AND name ILIKE '%arizona%'
    `, [ORG]);

    const updated = await client.query(
      `SELECT name, territory_type, current_revenue, current_customers, quota FROM erp_territories WHERE org_id = $1`,
      [ORG]
    );
    console.log('Updated territories:');
    updated.rows.forEach(r => console.log(`  ${r.name}: $${Number(r.current_revenue).toLocaleString()} revenue, ${r.current_customers} customers, $${Number(r.quota).toLocaleString()} quota`));
    console.log('SUCCESS');
  } catch (e) {
    console.error('FAILED:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
})();

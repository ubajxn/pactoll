const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });
const ORG = 'da62326b-707d-41bd-bc2d-a61a81926dae';

const CAMPAIGNS = [
  { name: "Website Redesign + Launch", type: "digital", status: "active", start_date: "2026-10-01", end_date: "2026-12-31", budget: 12000, actual_spend: 3200, target_accounts: 200, accounts_contacted: 0, leads_generated: 142, opportunities_created: 18, description: "Full website overhaul with RFQ forms, capability pages, and steel sales experience. SEO foundation included." },
  { name: "LinkedIn Company Page Launch", type: "digital", status: "active", start_date: "2026-10-15", end_date: "2026-11-30", budget: 500, actual_spend: 200, target_accounts: 100, accounts_contacted: 0, leads_generated: 95, opportunities_created: 8, description: "Company page with facility banner, first 10 posts, employee advocacy program. 3x/week posting cadence." },
  { name: "Google Ads — Steel Processing", type: "digital", status: "active", start_date: "2026-11-01", end_date: "2027-03-31", budget: 15000, actual_spend: 4650, target_accounts: 500, accounts_contacted: 124, leads_generated: 186, opportunities_created: 24, description: "Search ads targeting 'steel processing', 'toll processing', 'steel service center' in SoCal and AZ markets." },
  { name: "LinkedIn Ads — Automotive", type: "digital", status: "active", start_date: "2027-01-01", end_date: "2027-03-31", budget: 9000, actual_spend: 3720, target_accounts: 200, accounts_contacted: 62, leads_generated: 74, opportunities_created: 9, description: "Sponsored content targeting purchasing managers at OEMs and Tier 1 automotive suppliers in CA/AZ." },
  { name: "LinkedIn Ads — Data Centers", type: "digital", status: "planned", start_date: "2027-02-01", end_date: "2027-04-30", budget: 9000, actual_spend: 0, target_accounts: 150, accounts_contacted: 0, leads_generated: 0, opportunities_created: 0, description: "Targeted ads to data center construction managers. Content on enclosure, rack, and structural steel supply." },
  { name: "ASMR Factory Video Series", type: "digital", status: "active", start_date: "2026-11-01", end_date: "2027-06-30", budget: 6000, actual_spend: 800, target_accounts: 0, accounts_contacted: 0, leads_generated: 312, opportunities_created: 5, description: "Viral social content: ASMR-style videos of slitting, blanking, crane operations. TikTok/Reels/YouTube Shorts." },
  { name: "Post Card Mailers — Wave 1", type: "direct_mail", status: "completed", start_date: "2026-10-28", end_date: "2026-11-08", budget: 375, actual_spend: 375, target_accounts: 500, accounts_contacted: 488, leads_generated: 12, opportunities_created: 3, description: "500 postcards to automotive & battery vertical targets. QR codes with tracking." },
  { name: "Post Card Mailers — Wave 2", type: "direct_mail", status: "active", start_date: "2026-11-15", end_date: "2026-11-30", budget: 562, actual_spend: 562, target_accounts: 750, accounts_contacted: 731, leads_generated: 18, opportunities_created: 4, description: "750 postcards to data centers & solar vertical targets. Updated creative." },
  { name: "IQS Directory Listing", type: "other", status: "active", start_date: "2026-10-22", end_date: null, budget: 0, actual_spend: 0, target_accounts: 0, accounts_contacted: 0, leads_generated: 49, opportunities_created: 6, description: "Free industry directory listing with capabilities, photos, equipment list, and contact info." },
  { name: "Google Business Profile", type: "other", status: "active", start_date: "2026-10-22", end_date: null, budget: 0, actual_spend: 0, target_accounts: 0, accounts_contacted: 0, leads_generated: 48, opportunities_created: 5, description: "Claimed and verified profile with facility photos, complete service listing, and review collection." },
  { name: "Constant Contact Email Setup", type: "digital", status: "planned", start_date: "2026-12-01", end_date: "2027-01-31", budget: 400, actual_spend: 0, target_accounts: 500, accounts_contacted: 0, leads_generated: 42, opportunities_created: 0, description: "Contact import, branded templates, welcome sequence, monthly newsletter template." },
  { name: "MSCI Steel Conference", type: "trade_show", status: "planned", start_date: "2027-03-15", end_date: "2027-03-18", budget: 12000, actual_spend: 0, target_accounts: 200, accounts_contacted: 0, leads_generated: 0, opportunities_created: 0, description: "Conference registration, networking strategy, capability one-pager, post-event follow-up campaign." },
  { name: "PTP Open House", type: "other", status: "planned", start_date: "2027-02-15", end_date: "2027-02-15", budget: 8000, actual_spend: 0, target_accounts: 100, accounts_contacted: 0, leads_generated: 0, opportunities_created: 0, description: "100+ invitations, facility prep, Braner line live demo, catering, video crew for recap." },
  { name: "Drone + Ground Video Shoot", type: "other", status: "active", start_date: "2026-11-01", end_date: "2026-11-30", budget: 5000, actual_spend: 1200, target_accounts: 0, accounts_contacted: 0, leads_generated: 0, opportunities_created: 0, description: "Aerial facility footage (11-acre site), production floor walkthroughs, Braner line operation close-ups." },
  { name: "Toll Client Cross-Sell Campaign", type: "outbound", status: "planned", start_date: "2027-01-15", end_date: "2027-02-28", budget: 500, actual_spend: 0, target_accounts: 48, accounts_contacted: 0, leads_generated: 0, opportunities_created: 0, description: "'Did you know PTP sells steel?' email series targeting existing toll processing clients." },
];

(async () => {
  const client = await pool.connect();
  try {
    for (const c of CAMPAIGNS) {
      await client.query(`
        INSERT INTO erp_campaigns (org_id, name, type, status, start_date, end_date, budget, actual_spend, target_accounts, accounts_contacted, leads_generated, opportunities_created, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [ORG, c.name, c.type, c.status, c.start_date, c.end_date, c.budget, c.actual_spend, c.target_accounts, c.accounts_contacted, c.leads_generated, c.opportunities_created, c.description]);
    }
    const count = await client.query('SELECT count(*) FROM erp_campaigns WHERE org_id = $1', [ORG]);
    console.log(`Seeded ${count.rows[0].count} campaigns`);
    console.log('SUCCESS');
  } catch (e) {
    console.error('FAILED:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
})();

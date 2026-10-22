const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });
const ORG = 'da62326b-707d-41bd-bc2d-a61a81926dae';

const DELIVERABLES = [
  { name: "Website Redesign + Launch", priority: "now", status: "in_progress", category: "website", estimated_cost: 3000, description: "New information architecture, RFQ form, steel sales landing pages, equipment pages, mobile-first", kpis: "2,000+ monthly visitors by Q1 2027, 5% RFQ conversion, sub-2s load", sort_order: 1 },
  { name: "Google Business Profile", priority: "now", status: "in_progress", category: "directories", estimated_cost: 0, description: "Claim/verify profile, facility photos, complete service listing, review collection", kpis: "5-star rating with 10+ reviews by Jan 2027", sort_order: 2 },
  { name: "LinkedIn Company Page + First 10 Posts", priority: "now", status: "in_progress", category: "social", estimated_cost: 500, description: "Company page with facility banner, about section, first 10 posts, employee advocacy", kpis: "500 followers by Jan 2027, 5% engagement rate", sort_order: 3 },
  { name: "IQS Directory Listing", priority: "now", status: "completed", category: "directories", estimated_cost: 0, description: "Company profile with capabilities, facility photos, equipment list", kpis: "Listing live, indexed by Google within 30 days", sort_order: 4 },
  { name: "Photography Library (phone start)", priority: "now", status: "in_progress", category: "content", estimated_cost: 200, description: "Equipment photos, product photos, facility exterior, team portraits", kpis: "100+ photos, organized library, web-optimized", sort_order: 5 },
  { name: "Instagram Business Profile", priority: "now", status: "planned", category: "social", estimated_cost: 200, description: "Business profile with facility photos, ASMR Reels, behind-the-scenes, equipment showcases", kpis: "300 followers by Q1 2027, 2 Reels/week", sort_order: 6 },
  { name: "ASMR Steel Content (first batch)", priority: "now", status: "in_progress", category: "content", estimated_cost: 300, description: "Slitting close-ups, blanking sounds, crane footage, coil unwinding", kpis: "2 videos/week, 5K+ views on top performers", sort_order: 7 },
  { name: "RFQ Form + Lead Capture", priority: "now", status: "planned", category: "website", estimated_cost: 0, description: "Gauge/width/grade fields, auto-routing, CRM integration", kpis: "5% conversion rate from website visitors", sort_order: 8 },
  { name: "SEO Foundation + Local Optimization", priority: "next", status: "planned", category: "website", estimated_cost: 400, description: "Keyword research, on-page optimization, Google Business, local SEO for Carson/LA", kpis: "Page 1 for 'steel service center Carson CA'", sort_order: 9 },
  { name: "Drone + Ground Video Shoot", priority: "next", status: "planned", category: "content", estimated_cost: 800, description: "Aerial facility footage (11-acre site), production floor walkthroughs, Braner line close-ups", kpis: "15+ video assets, 5+ social edits, 1 hero video (2 min)", sort_order: 10 },
  { name: "LinkedIn Posting Cadence (3x/week)", priority: "next", status: "planned", category: "social", estimated_cost: 300, description: "Consistent 3x/week LinkedIn posting schedule with mixed content", kpis: "Consistent cadence, 5% engagement rate maintained", sort_order: 11 },
  { name: "Constant Contact Setup + Welcome Sequence", priority: "next", status: "planned", category: "email", estimated_cost: 200, description: "Account setup, contact list import, branded templates, 3-email welcome sequence", kpis: "500+ contacts, 25%+ open rate, 5%+ click rate", sort_order: 12 },
  { name: "SteelOrbis + MCN Buyer's Guide Listings", priority: "next", status: "planned", category: "directories", estimated_cost: 300, description: "Full company profiles, product catalogs, capability matrices", kpis: "Listings live by mid-November, 50+ profile views/month", sort_order: 13 },
  { name: "Customer Spotlight Video (first)", priority: "next", status: "planned", category: "content", estimated_cost: 500, description: "Video testimonial from long-term toll client, case study for website", kpis: "4 spotlights in first 6 months", sort_order: 14 },
  { name: "Post Card Mailer — Wave 1", priority: "next", status: "planned", category: "advertising", estimated_cost: 375, description: "Automotive & Battery vertical, 500 mailers with tracking codes", kpis: "17% response rate, 12+ qualified leads", sort_order: 15 },
  { name: "Google Ads Campaign Setup", priority: "next", status: "planned", category: "advertising", estimated_cost: 500, description: "Steel processing + toll processing keywords, SoCal geo-targeting", kpis: "3%+ CTR, $25 cost per lead, 186 conversions", sort_order: 16 },
  { name: "LinkedIn Ads — Automotive Vertical", priority: "later", status: "planned", category: "advertising", estimated_cost: 500, description: "Sponsored content targeting purchasing managers at OEMs and Tier 1 suppliers", kpis: "200+ qualified impressions/day, 15+ leads/month, $50 CPL", sort_order: 17 },
  { name: "LinkedIn Ads — Data Centers Vertical", priority: "later", status: "planned", category: "advertising", estimated_cost: 500, description: "Targeted ads to data center construction managers", kpis: "150+ qualified impressions/day, 10+ leads/month", sort_order: 18 },
  { name: "ThomasNet Premium Listing", priority: "later", status: "planned", category: "directories", estimated_cost: 400, description: "Company profile, capability pages, product categories, RFQ integration", kpis: "Listing live, 30+ RFQs/quarter", sort_order: 19 },
  { name: "Toll Client Cross-Sell Email Campaign", priority: "later", status: "planned", category: "email", estimated_cost: 300, description: "'Did you know PTP sells steel?' email series to existing toll clients", kpis: "15% response rate, 5+ new supply accounts", sort_order: 20 },
  { name: "MSCI Steel Conference Presence", priority: "later", status: "planned", category: "events", estimated_cost: 2000, description: "Conference registration, networking strategy, capability one-pager", kpis: "25+ conversations, 10+ follow-up meetings, 5+ qualified leads", sort_order: 21 },
  { name: "PTP Open House Event", priority: "later", status: "planned", category: "events", estimated_cost: 1500, description: "100+ invitations, facility prep, Braner line live demo, catering, video crew", kpis: "50-100 attendees, 20+ new leads, 5+ deals initiated", sort_order: 22 },
  { name: "Grand Tour Video Series (first episode)", priority: "later", status: "planned", category: "content", estimated_cost: 800, description: "Camera-equipped truck fleet footage, Carson to Phoenix corridor", kpis: "100K+ views across series, 10K+ YouTube subscribers", sort_order: 23 },
];

(async () => {
  const client = await pool.connect();
  try {
    for (const d of DELIVERABLES) {
      await client.query(`
        INSERT INTO erp_deliverables (org_id, name, priority, status, category, estimated_cost, description, kpis, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [ORG, d.name, d.priority, d.status, d.category, d.estimated_cost, d.description, d.kpis, d.sort_order]);
    }
    const count = await client.query('SELECT count(*) FROM erp_deliverables WHERE org_id = $1', [ORG]);
    console.log(`Seeded ${count.rows[0].count} deliverables`);
    console.log('SUCCESS');
  } catch (e) {
    console.error('FAILED:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
})();

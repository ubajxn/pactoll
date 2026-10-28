const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });
const ORG = 'da62326b-707d-41bd-bc2d-a61a81926dae';

(async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS erp_digital_presence (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        org_id UUID NOT NULL,
        platform TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'other',
        status TEXT NOT NULL DEFAULT 'not_started',
        priority TEXT NOT NULL DEFAULT 'med',
        url TEXT,
        username TEXT,
        notes TEXT,
        setup_date DATE,
        last_checked DATE,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);
    console.log('Table erp_digital_presence created');

    const PROFILES = [
      // Business Listings
      { platform: "Google Business Profile", category: "business_listing", status: "not_started", priority: "high", notes: "Search, Maps, reviews, posts, photos. Single most important listing. Claim and verify." },
      { platform: "Bing Places for Business", category: "business_listing", status: "not_started", priority: "med", notes: "Mirrors GBP for Bing/Edge users. Can import from Google." },
      { platform: "Apple Business Connect", category: "business_listing", status: "not_started", priority: "med", notes: "Apple Maps listing. Growing share with iPhone users." },
      { platform: "Yelp Business", category: "business_listing", status: "not_started", priority: "med", notes: "Claim and complete profile. Industrial Yelp traffic is real." },
      { platform: "Better Business Bureau", category: "business_listing", status: "not_started", priority: "low", notes: "BBB accreditation — trust signal for enterprise buyers." },
      { platform: "Dun & Bradstreet", category: "business_listing", status: "not_started", priority: "med", notes: "D-U-N-S number and profile. Required by many large buyers and government contracts." },

      // Social Media
      { platform: "LinkedIn Company Page", category: "social_media", status: "not_started", priority: "high", notes: "Primary B2B channel. Company updates, hiring, industry content. Connect employee profiles." },
      { platform: "YouTube Channel", category: "social_media", status: "not_started", priority: "high", notes: "Facility tours, equipment in action, Braner line video. Already have content — needs branded channel." },
      { platform: "Facebook Business Page", category: "social_media", status: "not_started", priority: "med", notes: "Community presence, hiring posts, facility photos. Low effort to maintain." },
      { platform: "Instagram Business", category: "social_media", status: "not_started", priority: "med", notes: "Visual showcase — equipment, coils, facility, team. Manufacturing content performs well." },
      { platform: "X (Twitter)", category: "social_media", status: "not_started", priority: "low", notes: "Industry news, tariff commentary, company updates. Optional but good for visibility." },

      // Industry Directories
      { platform: "ThomasNet", category: "industry_directory", status: "not_started", priority: "high", notes: "The industrial buyer's first stop. Category: Steel Service Centers, Toll Processing. Critical for inbound leads." },
      { platform: "IQS Directory", category: "industry_directory", status: "live", priority: "high", notes: "Free industry directory listing with capabilities, photos, equipment list, and contact info.", url: "https://www.iqsdirectory.com" },
      { platform: "MacRAE'S / IndustryNet", category: "industry_directory", status: "not_started", priority: "med", notes: "Industrial supplier directories. Free listings, paid for premium placement." },
      { platform: "GlobalSpec / Engineering360", category: "industry_directory", status: "not_started", priority: "med", notes: "Engineering procurement directory. Specs-focused buyers find suppliers here." },
      { platform: "MSCI Membership", category: "industry_directory", status: "not_started", priority: "med", notes: "Metals Service Center Institute — industry association membership. Directory listing + credibility + networking." },
      { platform: "California Manufacturers Register", category: "industry_directory", status: "not_started", priority: "low", notes: "State manufacturing directory. Helps with local/regional discovery." },
      { platform: "SteelOrbis / MetalMiner", category: "industry_directory", status: "not_started", priority: "low", notes: "Steel industry marketplaces with supplier profiles." },

      // SEO & Analytics
      { platform: "Google Search Console", category: "seo_analytics", status: "not_started", priority: "high", notes: "Index pages, monitor search performance, fix crawl issues. Foundation of SEO." },
      { platform: "Google Analytics (GA4)", category: "seo_analytics", status: "not_started", priority: "high", notes: "Traffic, conversions, user behavior. Set up conversion tracking on contact form." },
      { platform: "Schema Markup", category: "seo_analytics", status: "not_started", priority: "high", notes: "LocalBusiness + Organization structured data on pactoll.com — hours, address, services, logo. Powers rich search results." },
      { platform: "Open Graph & Meta Tags", category: "seo_analytics", status: "not_started", priority: "med", notes: "Title, description, OG image for every page. Controls how links look when shared." },
      { platform: "Bing Webmaster Tools", category: "seo_analytics", status: "not_started", priority: "low", notes: "Bing indexing and search analytics. Quick setup with Google import." },

      // Reviews & Trust
      { platform: "Google Reviews", category: "review_trust", status: "not_started", priority: "high", notes: "Ask satisfied clients for reviews. 5+ reviews unlocks star ratings in search." },
      { platform: "LinkedIn Recommendations", category: "review_trust", status: "not_started", priority: "med", notes: "Client testimonials on the company page and key employee profiles." },
      { platform: "Industry Certifications", category: "review_trust", status: "not_started", priority: "med", notes: "ISO, automotive qualifications, safety certifications — displayed on website and all profiles." },

      // Content & Outreach
      { platform: "Company Blog / News", category: "content_outreach", status: "not_started", priority: "med", notes: "Industry commentary, project spotlights, tariff impact analysis. SEO + authority." },
      { platform: "Email Newsletter (Constant Contact)", category: "content_outreach", status: "not_started", priority: "low", notes: "Monthly or quarterly to clients and prospects. Industry news, capability updates." },
      { platform: "Case Studies / Testimonials", category: "content_outreach", status: "not_started", priority: "med", notes: "Real client stories with specs, volumes, outcomes. Sales enablement." },
      { platform: "Downloadable Spec Sheets", category: "content_outreach", status: "not_started", priority: "med", notes: "PDF capability sheets for each service. Sales tool + lead capture." },
    ];

    for (const p of PROFILES) {
      await client.query(`
        INSERT INTO erp_digital_presence (org_id, platform, category, status, priority, url, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [ORG, p.platform, p.category, p.status, p.priority, p.url || null, p.notes]);
    }

    const count = await client.query('SELECT count(*) FROM erp_digital_presence WHERE org_id = $1', [ORG]);
    console.log(`Seeded ${count.rows[0].count} digital presence profiles`);
    console.log('SUCCESS');
  } catch (e) {
    console.error('FAILED:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
})();

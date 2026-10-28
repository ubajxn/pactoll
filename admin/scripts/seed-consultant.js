const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });
const ORG = 'da62326b-707d-41bd-bc2d-a61a81926dae';

(async () => {
  const client = await pool.connect();
  try {
    // Consultant invoices
    await client.query(`
      CREATE TABLE IF NOT EXISTS erp_consultant_invoices (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        org_id UUID NOT NULL,
        invoice_number TEXT NOT NULL,
        client_name TEXT NOT NULL,
        description TEXT,
        amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'draft',
        issue_date DATE,
        due_date DATE,
        paid_date DATE,
        line_items JSONB DEFAULT '[]',
        notes TEXT,
        public_url TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);
    console.log('Table erp_consultant_invoices created');

    // Consultant deliverables / delivery log
    await client.query(`
      CREATE TABLE IF NOT EXISTS erp_consultant_deliverables (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        org_id UUID NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL DEFAULT 'other',
        status TEXT NOT NULL DEFAULT 'delivered',
        delivered_date DATE,
        hours NUMERIC(6,1),
        value NUMERIC(12,2),
        invoice_number TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);
    console.log('Table erp_consultant_deliverables created');

    // Consultant retainer scope
    await client.query(`
      CREATE TABLE IF NOT EXISTS erp_consultant_retainer (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        org_id UUID NOT NULL,
        month TEXT NOT NULL,
        amount NUMERIC(12,2) NOT NULL DEFAULT 3000,
        status TEXT NOT NULL DEFAULT 'pending',
        scope_items JSONB DEFAULT '[]',
        hours_used NUMERIC(6,1) DEFAULT 0,
        hours_included NUMERIC(6,1) DEFAULT 40,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);
    console.log('Table erp_consultant_retainer created');

    // Seed Invoice #001
    await client.query(`
      INSERT INTO erp_consultant_invoices (org_id, invoice_number, client_name, description, amount, status, issue_date, due_date, line_items, public_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      ORG,
      'JJP-2026-001',
      'Pacific Toll Processing',
      'Phase 1 — Setup & Digital Growth Foundation',
      8000,
      'sent',
      '2026-10-23',
      '2026-11-06',
      JSON.stringify([
        { description: 'Market Research & Competitive Analysis', amount: 1200 },
        { description: 'Customer-Facing Website — Design & Development', amount: 3500 },
        { description: 'SEO & AI Discoverability Infrastructure', amount: 800 },
        { description: 'Growth Strategy Presentation Suite', amount: 1000 },
        { description: 'Web Administration & Hosting Setup', amount: 700 },
        { description: 'Social Media Account Setup & Branding', amount: 800 },
      ]),
      'https://pactoll.stjack.com/invoice-001.html',
    ]);
    console.log('Seeded Invoice #001');

    // Seed deliverables
    const DELIVERABLES = [
      { title: 'Steel Sales page — full editorial rebuild', category: 'website', status: 'delivered', delivered_date: '2026-10-25', description: '6 product spreads with spec grids, application blocks, inline styles. Gold standard page.', invoice_number: 'JJP-2026-001' },
      { title: 'Equipment page — full editorial rebuild', category: 'website', status: 'delivered', delivered_date: '2026-10-27', description: '9 capability spreads covering all processing, logistics, warehousing. Solar + video sections.', invoice_number: 'JJP-2026-001' },
      { title: 'Services page — quote wizard cleanup', category: 'website', status: 'delivered', delivered_date: '2026-10-27', description: 'Removed modal, linked CTAs to contact page.', invoice_number: 'JJP-2026-001' },
      { title: 'Quote wizard removal — all 11 pages', category: 'website', status: 'delivered', delivered_date: '2026-10-27', description: 'Removed modal HTML, wizard JS, data-service attributes from every page site-wide.', invoice_number: 'JJP-2026-001' },
      { title: 'Site-wide navigation unification', category: 'website', status: 'delivered', delivered_date: '2026-10-24', description: 'Unified nav, quick-nav, footer, hero pattern across all pages.', invoice_number: 'JJP-2026-001' },
      { title: 'CRM admin — full buildout', category: 'crm', status: 'delivered', delivered_date: '2026-10-26', description: 'Accounts, contacts, opportunities, tasks, jobs, inventory, equipment, shipments, quality, safety, invoices, POs, expenses, properties, insurance, vendors.', invoice_number: 'JJP-2026-001' },
      { title: 'Analytics dashboard', category: 'crm', status: 'delivered', delivered_date: '2026-10-26', description: 'Campaign performance, traffic sources, postcards, paid media, social & email tabs.', invoice_number: 'JJP-2026-001' },
      { title: 'Campaigns page', category: 'crm', status: 'delivered', delivered_date: '2026-10-26', description: 'Full CRUD with types, budgets, leads, performance tracking. 15 campaigns seeded.', invoice_number: 'JJP-2026-001' },
      { title: 'Competitors intelligence page', category: 'crm', status: 'delivered', delivered_date: '2026-10-26', description: 'Competitive analysis with threat levels, services overlap, digital presence scoring.', invoice_number: 'JJP-2026-001' },
      { title: 'Territories & target markets', category: 'crm', status: 'delivered', delivered_date: '2026-10-26', description: 'Sales territories, target market segments, growth pipeline tracking.', invoice_number: 'JJP-2026-001' },
      { title: 'Digital presence tracker', category: 'digital', status: 'delivered', delivered_date: '2026-10-28', description: '30 platform profiles across 6 categories. Unified brand profile card. Status tracking.', invoice_number: 'JJP-2026-001' },
      { title: 'Digital growth proposal', category: 'strategy', status: 'delivered', delivered_date: '2026-10-23', description: 'Full scope of work, timeline, budget breakdown for PTP digital transformation.', invoice_number: 'JJP-2026-001' },
      // Upcoming / in progress
      { title: 'Contact page rebuild', category: 'website', status: 'planned', description: 'Inline form, clean layout. All site CTAs land here now.' },
      { title: 'Homepage editorial treatment', category: 'website', status: 'planned', description: 'Front door needs to match steel-sales/equipment editorial standard.' },
      { title: 'Services page editorial rebuild', category: 'website', status: 'planned', description: 'Full spread treatment with detailed content from old site.' },
      { title: 'About page editorial rebuild', category: 'website', status: 'planned', description: 'Story, values, diversity, solar, milestones in magazine format.' },
      { title: 'Google Business Profile setup', category: 'digital', status: 'planned', description: 'Claim, verify, photos, services, posts, review strategy.' },
      { title: 'LinkedIn company page launch', category: 'digital', status: 'planned', description: 'Company page, banner, first posts, employee advocacy.' },
      { title: 'Google Analytics + Search Console', category: 'digital', status: 'planned', description: 'GA4 setup, conversion tracking, Search Console verification.' },
      { title: 'Schema markup implementation', category: 'digital', status: 'planned', description: 'LocalBusiness + Organization structured data on pactoll.com.' },
    ];

    for (const d of DELIVERABLES) {
      await client.query(`
        INSERT INTO erp_consultant_deliverables (org_id, title, description, category, status, delivered_date, invoice_number)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [ORG, d.title, d.description, d.category, d.status, d.delivered_date || null, d.invoice_number || null]);
    }
    console.log(`Seeded ${DELIVERABLES.length} deliverables`);
    console.log('SUCCESS');
  } catch (e) {
    console.error('FAILED:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
})();

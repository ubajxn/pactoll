-- ============================================================
-- Competitors intelligence + Marketing deliverables
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT,
  location TEXT,
  type TEXT CHECK (type IN (
    'service_center','toll_processor','steel_mill',
    'steel_distribution','full_service','other'
  )),
  threat_level TEXT DEFAULT 'medium' CHECK (threat_level IN ('high','medium','low')),
  website TEXT,
  linkedin TEXT,
  revenue TEXT,
  employees TEXT,
  founded TEXT,
  description TEXT,
  strengths TEXT,
  weaknesses TEXT,
  services JSONB,
  key_differentiator TEXT,
  overlap_accounts JSONB,
  digital_presence JSONB,
  contacts JSONB,
  news JSONB,
  competitive_advantage TEXT,
  market_position TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  priority TEXT DEFAULT 'next' CHECK (priority IN ('now','next','later')),
  status TEXT DEFAULT 'planned' CHECK (status IN (
    'planned','in_progress','completed','on_hold','cancelled'
  )),
  category TEXT CHECK (category IN (
    'website','social','content','directories','events',
    'email','publications','advertising','other'
  )),
  estimated_cost NUMERIC,
  actual_cost NUMERIC DEFAULT 0,
  assigned_to TEXT,
  due_date DATE,
  completed_date DATE,
  description TEXT,
  kpis TEXT,
  dependencies TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

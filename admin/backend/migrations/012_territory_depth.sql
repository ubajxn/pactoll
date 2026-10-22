-- ============================================================
-- TERRITORY DEPTH: zip codes, counties, MSAs, cities,
-- geographic targeting, quota tracking, demographic data
-- ============================================================

-- Expand erp_territories with deep geographic + business fields
ALTER TABLE erp_territories
  ADD COLUMN IF NOT EXISTS territory_type TEXT DEFAULT 'exclusive'
    CHECK (territory_type IN ('exclusive','shared','overlay','house')),
  ADD COLUMN IF NOT EXISTS zip_codes JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS counties JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS cities JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS msas JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS state_codes JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS center_lat NUMERIC,
  ADD COLUMN IF NOT EXISTS center_lng NUMERIC,
  ADD COLUMN IF NOT EXISTS radius_miles NUMERIC,
  ADD COLUMN IF NOT EXISTS boundary_geojson JSONB,
  ADD COLUMN IF NOT EXISTS secondary_rep UUID REFERENCES "user"(id),
  ADD COLUMN IF NOT EXISTS manager UUID REFERENCES "user"(id),
  ADD COLUMN IF NOT EXISTS quota NUMERIC,
  ADD COLUMN IF NOT EXISTS quota_period TEXT DEFAULT 'annual'
    CHECK (quota_period IN ('monthly','quarterly','annual')),
  ADD COLUMN IF NOT EXISTS quota_attainment_pct NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_revenue NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_customers INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_customers INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_prospects INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS population BIGINT,
  ADD COLUMN IF NOT EXISTS num_businesses INT,
  ADD COLUMN IF NOT EXISTS num_manufacturing_businesses INT,
  ADD COLUMN IF NOT EXISTS avg_household_income NUMERIC,
  ADD COLUMN IF NOT EXISTS industrial_sq_ft BIGINT,
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#157070',
  ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parent_territory_id UUID REFERENCES erp_territories(id);

-- Territory coverage zones (many-to-many with fine grain)
CREATE TABLE IF NOT EXISTS erp_territory_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  territory_id UUID NOT NULL REFERENCES erp_territories(id) ON DELETE CASCADE,
  zone_type TEXT NOT NULL CHECK (zone_type IN (
    'state','county','city','zip','msa','custom'
  )),
  zone_code TEXT NOT NULL,
  zone_name TEXT NOT NULL,
  state_code TEXT,
  fips_code TEXT,
  population BIGINT,
  num_businesses INT,
  is_primary BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_territory_zones_territory ON erp_territory_zones(territory_id);
CREATE INDEX IF NOT EXISTS idx_territory_zones_type_code ON erp_territory_zones(zone_type, zone_code);
CREATE INDEX IF NOT EXISTS idx_territory_zones_state ON erp_territory_zones(state_code);

-- Territory performance history (track quota/revenue over time)
CREATE TABLE IF NOT EXISTS erp_territory_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  territory_id UUID NOT NULL REFERENCES erp_territories(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly','quarterly','annual')),
  revenue NUMERIC DEFAULT 0,
  quota NUMERIC DEFAULT 0,
  new_customers INT DEFAULT 0,
  lost_customers INT DEFAULT 0,
  jobs_completed INT DEFAULT 0,
  tons_processed NUMERIC DEFAULT 0,
  avg_margin_pct NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_territory_perf_territory ON erp_territory_performance(territory_id);
CREATE INDEX IF NOT EXISTS idx_territory_perf_period ON erp_territory_performance(period_start, period_end);

-- Territory assignments (track rep changes over time)
CREATE TABLE IF NOT EXISTS erp_territory_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  territory_id UUID NOT NULL REFERENCES erp_territories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "user"(id),
  role TEXT DEFAULT 'primary' CHECK (role IN ('primary','secondary','overlay','support')),
  assigned_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_territory_assign_territory ON erp_territory_assignments(territory_id);
CREATE INDEX IF NOT EXISTS idx_territory_assign_user ON erp_territory_assignments(user_id);

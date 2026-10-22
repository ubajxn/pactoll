-- ============================================================
-- ERP SUPPLEMENT: Sales territories, market targeting,
-- cost accounting, budgets, consumables, capex
-- ============================================================

-- Sales territories / markets
CREATE TABLE erp_territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  region TEXT,
  states JSONB,
  market_focus JSONB,
  assigned_rep UUID REFERENCES "user"(id),
  target_revenue NUMERIC,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Target markets / verticals
CREATE TABLE erp_target_markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  vertical TEXT NOT NULL CHECK (vertical IN (
    'datacenter','solar','hvac','automotive','appliance',
    'construction','aerospace','agricultural','electrical',
    'furniture','roofing','tank_vessel','general_manufacturing','other'
  )),
  description TEXT,
  territory_id UUID REFERENCES erp_territories(id),
  estimated_market_size NUMERIC,
  estimated_addressable NUMERIC,
  current_penetration_pct NUMERIC,
  growth_rate_pct NUMERIC,
  key_players JSONB,
  material_requirements JSONB,
  typical_gauges TEXT,
  typical_widths TEXT,
  typical_grades TEXT,
  volume_potential_tons_yr NUMERIC,
  avg_price_per_lb NUMERIC,
  competitive_landscape TEXT,
  barriers_to_entry TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sales campaigns
CREATE TABLE erp_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN (
    'outbound','trade_show','referral','digital',
    'direct_mail','cold_call','partnership','other'
  )),
  territory_id UUID REFERENCES erp_territories(id),
  market_id UUID REFERENCES erp_target_markets(id),
  status TEXT DEFAULT 'planned' CHECK (status IN (
    'planned','active','paused','completed','cancelled'
  )),
  start_date DATE,
  end_date DATE,
  budget NUMERIC,
  actual_spend NUMERIC DEFAULT 0,
  target_accounts INTEGER,
  accounts_contacted INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  opportunities_created INTEGER DEFAULT 0,
  deals_closed INTEGER DEFAULT 0,
  revenue_generated NUMERIC DEFAULT 0,
  owner_id UUID REFERENCES "user"(id),
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Campaign touchpoints
CREATE TABLE erp_campaign_touches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES erp_campaigns(id) ON DELETE CASCADE,
  account_id TEXT,
  contact_id TEXT,
  type TEXT CHECK (type IN (
    'email','phone','visit','meeting','trade_show',
    'sample','quote','follow_up','other'
  )),
  date DATE NOT NULL,
  outcome TEXT CHECK (outcome IN (
    'interested','not_interested','no_answer','left_message',
    'meeting_scheduled','quote_requested','sample_requested',
    'referred','disqualified','other'
  )),
  performed_by UUID REFERENCES "user"(id),
  notes TEXT,
  next_action TEXT,
  next_action_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pipeline / opportunities (extends CRM)
CREATE TABLE erp_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_id TEXT,
  contact_id TEXT,
  territory_id UUID REFERENCES erp_territories(id),
  market_id UUID REFERENCES erp_target_markets(id),
  campaign_id UUID REFERENCES erp_campaigns(id),
  stage TEXT DEFAULT 'prospecting' CHECK (stage IN (
    'prospecting','qualification','needs_analysis','proposal',
    'negotiation','trial_run','closed_won','closed_lost'
  )),
  probability_pct INTEGER DEFAULT 10,
  -- What they need
  services_needed JSONB,
  material_grade TEXT,
  estimated_gauge TEXT,
  estimated_width TEXT,
  estimated_volume_lbs NUMERIC,
  estimated_monthly_lbs NUMERIC,
  processing_type TEXT,
  -- Value
  estimated_value NUMERIC,
  estimated_monthly_value NUMERIC,
  price_per_lb NUMERIC,
  -- Timing
  expected_close_date DATE,
  expected_start_date DATE,
  actual_close_date DATE,
  -- Competition
  competitors JSONB,
  competitive_advantage TEXT,
  -- Why won/lost
  win_loss_reason TEXT,
  -- Owner
  owner_id UUID REFERENCES "user"(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- COST ACCOUNTING
-- ============================================================

-- Cost centers
CREATE TABLE erp_cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN (
    'production','shipping','quality','maintenance',
    'admin','sales','facility','overhead'
  )),
  parent_id UUID REFERENCES erp_cost_centers(id),
  budget_monthly NUMERIC,
  budget_annual NUMERIC,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, code)
);

-- Labor cost tracking
CREATE TABLE erp_labor_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES erp_employees(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  cost_center_id UUID REFERENCES erp_cost_centers(id),
  job_id UUID REFERENCES erp_jobs(id),
  -- Hours
  regular_hours NUMERIC DEFAULT 0,
  overtime_hours NUMERIC DEFAULT 0,
  double_time_hours NUMERIC DEFAULT 0,
  -- Rates
  regular_rate NUMERIC,
  overtime_rate NUMERIC,
  double_time_rate NUMERIC,
  -- Costs
  gross_wages NUMERIC DEFAULT 0,
  -- Burden / loaded cost
  fica_employer NUMERIC DEFAULT 0,
  futa NUMERIC DEFAULT 0,
  suta NUMERIC DEFAULT 0,
  workers_comp NUMERIC DEFAULT 0,
  health_insurance NUMERIC DEFAULT 0,
  dental_vision NUMERIC DEFAULT 0,
  retirement_401k NUMERIC DEFAULT 0,
  pto_accrual NUMERIC DEFAULT 0,
  other_benefits NUMERIC DEFAULT 0,
  total_burden NUMERIC DEFAULT 0,
  fully_loaded_cost NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Consumables inventory
CREATE TABLE erp_consumables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN (
    'tooling','cutting_blades','lubricant','coolant',
    'packaging','strapping','dunnage','pallets','labels',
    'welding_supplies','safety_ppe','cleaning','office','other'
  )),
  unit TEXT DEFAULT 'each',
  unit_cost NUMERIC,
  quantity_on_hand NUMERIC DEFAULT 0,
  reorder_point NUMERIC,
  reorder_quantity NUMERIC,
  preferred_vendor_id UUID REFERENCES erp_vendors(id),
  storage_location TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, code)
);

-- Consumable usage log
CREATE TABLE erp_consumable_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumable_id UUID NOT NULL REFERENCES erp_consumables(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  quantity_used NUMERIC NOT NULL,
  unit_cost NUMERIC,
  total_cost NUMERIC,
  job_id UUID REFERENCES erp_jobs(id),
  equipment_id UUID REFERENCES erp_equipment(id),
  cost_center_id UUID REFERENCES erp_cost_centers(id),
  used_by UUID REFERENCES "user"(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Capital expenditures
CREATE TABLE erp_capex (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN (
    'equipment','vehicle','building_improvement','technology',
    'tooling','land','furniture_fixtures','other'
  )),
  description TEXT,
  -- Acquisition
  vendor_id UUID REFERENCES erp_vendors(id),
  po_id UUID REFERENCES erp_purchase_orders(id),
  acquisition_date DATE,
  acquisition_cost NUMERIC NOT NULL,
  installation_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC,
  -- Depreciation
  useful_life_years INTEGER,
  depreciation_method TEXT CHECK (depreciation_method IN (
    'straight_line','declining_balance','macrs_5','macrs_7',
    'macrs_15','macrs_39','section_179','bonus'
  )),
  salvage_value NUMERIC DEFAULT 0,
  annual_depreciation NUMERIC,
  accumulated_depreciation NUMERIC DEFAULT 0,
  book_value NUMERIC,
  -- Tax
  section_179_amount NUMERIC DEFAULT 0,
  bonus_depreciation_pct NUMERIC DEFAULT 0,
  tax_basis NUMERIC,
  -- Asset linkage
  equipment_id UUID REFERENCES erp_equipment(id),
  vehicle_id UUID REFERENCES erp_vehicles(id),
  property_id UUID REFERENCES erp_properties(id),
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN (
    'proposed','approved','acquired','in_service',
    'disposed','written_off'
  )),
  disposal_date DATE,
  disposal_proceeds NUMERIC,
  gain_loss NUMERIC,
  -- Approval
  requested_by UUID REFERENCES "user"(id),
  approved_by UUID REFERENCES "user"(id),
  approved_date DATE,
  budget_year INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Budget tracking
CREATE TABLE erp_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fiscal_year INTEGER NOT NULL,
  period TEXT CHECK (period IN ('annual','q1','q2','q3','q4','monthly')),
  period_month INTEGER,
  cost_center_id UUID REFERENCES erp_cost_centers(id),
  category TEXT NOT NULL,
  budgeted_amount NUMERIC NOT NULL DEFAULT 0,
  actual_amount NUMERIC DEFAULT 0,
  variance NUMERIC DEFAULT 0,
  notes TEXT,
  approved_by UUID REFERENCES "user"(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Utility accounts (gas, electric, water, waste)
CREATE TABLE erp_utility_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  property_id UUID REFERENCES erp_properties(id),
  type TEXT NOT NULL CHECK (type IN (
    'electric','natural_gas','water','sewer','waste_disposal',
    'internet','phone','alarm','other'
  )),
  provider TEXT NOT NULL,
  account_number TEXT,
  meter_number TEXT,
  service_address TEXT,
  monthly_budget NUMERIC,
  auto_pay BOOLEAN DEFAULT false,
  contract_end_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Utility bills (for tracking usage and cost trends)
CREATE TABLE erp_utility_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utility_account_id UUID NOT NULL REFERENCES erp_utility_accounts(id) ON DELETE CASCADE,
  billing_period_start DATE,
  billing_period_end DATE,
  due_date DATE,
  usage_amount NUMERIC,
  usage_unit TEXT,
  demand_kw NUMERIC,
  rate NUMERIC,
  amount NUMERIC NOT NULL,
  taxes_fees NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  status TEXT DEFAULT 'received' CHECK (status IN ('received','approved','paid','disputed')),
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES for sales & cost tables
-- ============================================================

CREATE INDEX erp_territories_org ON erp_territories(org_id);
CREATE INDEX erp_target_markets_org ON erp_target_markets(org_id, vertical);
CREATE INDEX erp_campaigns_org_status ON erp_campaigns(org_id, status);
CREATE INDEX erp_campaign_touches_campaign ON erp_campaign_touches(campaign_id);
CREATE INDEX erp_opportunities_org_stage ON erp_opportunities(org_id, stage);
CREATE INDEX erp_opportunities_territory ON erp_opportunities(territory_id);
CREATE INDEX erp_opportunities_market ON erp_opportunities(market_id);
CREATE INDEX erp_labor_costs_employee ON erp_labor_costs(employee_id);
CREATE INDEX erp_labor_costs_period ON erp_labor_costs(period_start, period_end);
CREATE INDEX erp_labor_costs_job ON erp_labor_costs(job_id);
CREATE INDEX erp_consumable_usage_date ON erp_consumable_usage(date);
CREATE INDEX erp_consumable_usage_job ON erp_consumable_usage(job_id);
CREATE INDEX erp_capex_org_status ON erp_capex(org_id, status);
CREATE INDEX erp_budgets_org_year ON erp_budgets(org_id, fiscal_year);
CREATE INDEX erp_utility_bills_account ON erp_utility_bills(utility_account_id);

-- ============================================================
-- PTP ERP: Full operational system for steel toll processing
-- Covers: jobs, coils, equipment, transport, insurance,
--         property, finance, HR, safety, compliance
-- ============================================================

-- Material grades reference table
CREATE TABLE erp_material_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, code)
);

-- Equipment registry
CREATE TABLE erp_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'blanking_line','slitter','leveler','shear','press',
    'crane','forklift','truck','trailer','compressor',
    'welder','grinder','scale','other'
  )),
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  year_manufactured INTEGER,
  min_gauge NUMERIC,
  max_gauge NUMERIC,
  max_width NUMERIC,
  max_weight NUMERIC,
  speed_fpm NUMERIC,
  status TEXT DEFAULT 'operational' CHECK (status IN (
    'operational','maintenance','down','decommissioned'
  )),
  location TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, code)
);

-- ============================================================
-- JOBS / WORK ORDERS
-- ============================================================

CREATE TABLE erp_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  job_number TEXT NOT NULL,
  account_id TEXT,
  contact_id TEXT,
  customer_po TEXT,
  type TEXT NOT NULL CHECK (type IN (
    'blanking','slitting','leveling','cut_to_length',
    'multi_process','shearing','custom'
  )),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('rush','high','normal','low')),
  status TEXT DEFAULT 'received' CHECK (status IN (
    'quote','received','scheduled','in_progress','quality_hold',
    'complete','shipped','invoiced','closed','cancelled'
  )),
  date_received DATE,
  date_needed DATE,
  date_scheduled DATE,
  date_started TIMESTAMPTZ,
  date_completed TIMESTAMPTZ,
  material_grade_id UUID REFERENCES erp_material_grades(id),
  material_description TEXT,
  gauge_in NUMERIC,
  gauge_tolerance NUMERIC,
  width_in NUMERIC,
  blank_length NUMERIC,
  blank_width NUMERIC,
  slit_width NUMERIC,
  flatness_tolerance NUMERIC,
  coils_ordered INTEGER,
  pieces_ordered INTEGER,
  weight_ordered NUMERIC,
  price_per_lb NUMERIC,
  price_per_piece NUMERIC,
  price_flat NUMERIC,
  estimated_total NUMERIC,
  assigned_to UUID,
  equipment_id UUID REFERENCES erp_equipment(id),
  special_instructions TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES "user"(id),
  UNIQUE(org_id, job_number)
);

CREATE TABLE erp_job_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES erp_jobs(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  description TEXT,
  width NUMERIC,
  length NUMERIC,
  quantity INTEGER,
  weight NUMERIC,
  quantity_produced INTEGER DEFAULT 0,
  quantity_scrapped INTEGER DEFAULT 0,
  weight_produced NUMERIC DEFAULT 0,
  weight_scrapped NUMERIC DEFAULT 0,
  unit_price NUMERIC,
  line_total NUMERIC,
  notes TEXT,
  UNIQUE(job_id, line_number)
);

-- ============================================================
-- COIL / MATERIAL TRACKING
-- ============================================================

CREATE TABLE erp_coils (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  coil_tag TEXT NOT NULL,
  heat_number TEXT,
  mill TEXT,
  mill_cert_on_file BOOLEAN DEFAULT false,
  material_grade_id UUID REFERENCES erp_material_grades(id),
  grade_description TEXT,
  gauge NUMERIC NOT NULL,
  width NUMERIC NOT NULL,
  gross_weight NUMERIC,
  tare_weight NUMERIC,
  net_weight NUMERIC,
  outer_diameter NUMERIC,
  inner_diameter NUMERIC,
  status TEXT DEFAULT 'received' CHECK (status IN (
    'in_transit','received','staged','in_process','partial',
    'finished','shipped','scrapped','returned','on_hold'
  )),
  yard_location TEXT,
  owner_account_id TEXT,
  job_id UUID REFERENCES erp_jobs(id),
  received_date DATE,
  received_by UUID REFERENCES "user"(id),
  carrier_in TEXT,
  bol_in TEXT,
  shipped_date DATE,
  carrier_out TEXT,
  bol_out TEXT,
  surface_quality TEXT CHECK (surface_quality IN ('prime','secondary','surplus','reject')),
  edge_condition TEXT CHECK (edge_condition IN ('mill','slit','trimmed')),
  temper TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, coil_tag)
);

-- ============================================================
-- PROCESSING STEPS
-- ============================================================

CREATE TABLE erp_processing_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES erp_jobs(id) ON DELETE CASCADE,
  coil_id UUID REFERENCES erp_coils(id),
  step_number INTEGER NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN (
    'receive','stage','decoil','level','slit','blank',
    'shear','inspect','recoil','pack','label','ship','rework'
  )),
  equipment_id UUID REFERENCES erp_equipment(id),
  operator_id UUID REFERENCES "user"(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  pieces_in INTEGER,
  pieces_out INTEGER,
  weight_in NUMERIC,
  weight_out NUMERIC,
  scrap_weight NUMERIC,
  scrap_reason TEXT,
  passed_inspection BOOLEAN,
  inspection_notes TEXT,
  speed_fpm NUMERIC,
  line_tension NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- QUALITY INSPECTIONS
-- ============================================================

CREATE TABLE erp_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  job_id UUID REFERENCES erp_jobs(id),
  coil_id UUID REFERENCES erp_coils(id),
  inspector_id UUID REFERENCES "user"(id),
  inspection_type TEXT NOT NULL CHECK (inspection_type IN (
    'incoming','in_process','final','customer_complaint','audit'
  )),
  gauge_measured NUMERIC,
  gauge_spec NUMERIC,
  gauge_tolerance NUMERIC,
  gauge_pass BOOLEAN,
  width_measured NUMERIC,
  width_spec NUMERIC,
  width_tolerance NUMERIC,
  width_pass BOOLEAN,
  flatness_measured NUMERIC,
  flatness_spec NUMERIC,
  flatness_pass BOOLEAN,
  surface_pass BOOLEAN,
  edge_pass BOOLEAN,
  result TEXT NOT NULL CHECK (result IN ('pass','fail','conditional','rework')),
  hold_placed BOOLEAN DEFAULT false,
  hold_reason TEXT,
  disposition TEXT CHECK (disposition IN ('accept','rework','scrap','return_to_customer')),
  notes TEXT,
  photos JSONB,
  inspected_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TRANSPORT & LOGISTICS
-- ============================================================

CREATE TABLE erp_carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('ltl','ftl','flatbed','specialized','internal','courier')),
  mc_number TEXT,
  dot_number TEXT,
  scac_code TEXT,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  insurance_carrier TEXT,
  insurance_policy TEXT,
  insurance_expiry DATE,
  cargo_coverage_limit NUMERIC,
  on_time_pct NUMERIC,
  damage_claims INTEGER DEFAULT 0,
  is_preferred BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE erp_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  type TEXT CHECK (type IN (
    'tractor','flatbed_trailer','van_trailer','pickup',
    'forklift','crane','other'
  )),
  vin TEXT,
  license_plate TEXT,
  state_registered TEXT,
  year INTEGER,
  make TEXT,
  model TEXT,
  dot_inspection_date DATE,
  dot_inspection_expiry DATE,
  registration_expiry DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','maintenance','out_of_service','sold')),
  current_mileage INTEGER,
  assigned_driver UUID REFERENCES "user"(id),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, unit_number)
);

CREATE TABLE erp_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  shipment_number TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound','transfer')),
  job_id UUID REFERENCES erp_jobs(id),
  account_id TEXT,
  carrier_id UUID REFERENCES erp_carriers(id),
  vehicle_id UUID REFERENCES erp_vehicles(id),
  bol_number TEXT,
  pro_number TEXT,
  origin_name TEXT,
  origin_address TEXT,
  origin_city TEXT,
  origin_state TEXT,
  origin_zip TEXT,
  destination_name TEXT,
  destination_address TEXT,
  destination_city TEXT,
  destination_state TEXT,
  destination_zip TEXT,
  pickup_date DATE,
  pickup_time_window TEXT,
  delivery_date DATE,
  delivery_time_window TEXT,
  actual_pickup TIMESTAMPTZ,
  actual_delivery TIMESTAMPTZ,
  pieces INTEGER,
  weight NUMERIC,
  coil_count INTEGER,
  pallet_count INTEGER,
  freight_class TEXT,
  hazmat BOOLEAN DEFAULT false,
  freight_charge NUMERIC,
  fuel_surcharge NUMERIC,
  accessorial_charges NUMERIC,
  detention_charges NUMERIC,
  total_charge NUMERIC,
  status TEXT DEFAULT 'planned' CHECK (status IN (
    'planned','dispatched','in_transit','at_pickup','at_delivery',
    'delivered','pod_received','invoiced','complete','cancelled'
  )),
  pod_signed_by TEXT,
  pod_date TIMESTAMPTZ,
  damage_noted BOOLEAN DEFAULT false,
  damage_description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, shipment_number)
);

CREATE TABLE erp_shipment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES erp_shipments(id) ON DELETE CASCADE,
  coil_id UUID REFERENCES erp_coils(id),
  description TEXT,
  pieces INTEGER,
  weight NUMERIC,
  line_number INTEGER
);

-- ============================================================
-- INSURANCE
-- ============================================================

CREATE TABLE erp_insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'general_liability','cargo','property','workers_comp',
    'auto','umbrella','professional_liability','pollution',
    'cyber','equipment_breakdown','business_interruption'
  )),
  carrier TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  agent_name TEXT,
  agent_phone TEXT,
  agent_email TEXT,
  coverage_limit NUMERIC,
  aggregate_limit NUMERIC,
  deductible NUMERIC,
  per_occurrence_limit NUMERIC,
  annual_premium NUMERIC,
  payment_frequency TEXT CHECK (payment_frequency IN (
    'annual','semi_annual','quarterly','monthly'
  )),
  effective_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  renewal_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active','expired','cancelled','pending_renewal'
  )),
  auto_renew BOOLEAN DEFAULT false,
  named_insured TEXT,
  additional_insureds JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE erp_insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES erp_insurance_policies(id),
  claim_number TEXT,
  date_of_loss DATE NOT NULL,
  date_reported DATE,
  location TEXT,
  description TEXT NOT NULL,
  type TEXT CHECK (type IN (
    'property_damage','bodily_injury','cargo_damage',
    'vehicle_accident','theft','fire','equipment_failure',
    'workers_comp_injury','other'
  )),
  claimant_name TEXT,
  witnesses JSONB,
  estimated_loss NUMERIC,
  deductible_applied NUMERIC,
  amount_paid NUMERIC,
  amount_reserved NUMERIC,
  status TEXT DEFAULT 'open' CHECK (status IN (
    'open','under_review','approved','denied','settled',
    'closed','subrogation'
  )),
  adjuster_name TEXT,
  adjuster_phone TEXT,
  adjuster_email TEXT,
  shipment_id UUID REFERENCES erp_shipments(id),
  vehicle_id UUID REFERENCES erp_vehicles(id),
  job_id UUID REFERENCES erp_jobs(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE erp_coi_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'customer','vendor','carrier','landlord','tenant','other'
  )),
  entity_id TEXT,
  entity_name TEXT NOT NULL,
  certificate_number TEXT,
  issued_date DATE,
  expiration_date DATE,
  required_gl_limit NUMERIC,
  required_auto_limit NUMERIC,
  required_wc BOOLEAN DEFAULT false,
  required_umbrella_limit NUMERIC,
  additional_insured_required BOOLEAN DEFAULT false,
  waiver_of_subrogation_required BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'current' CHECK (status IN (
    'current','expiring_soon','expired','requested','not_required'
  )),
  on_file BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PROPERTY & REAL ESTATE
-- ============================================================

CREATE TABLE erp_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('warehouse','office','yard','mixed','land')),
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  square_feet NUMERIC,
  acres NUMERIC,
  ownership TEXT CHECK (ownership IN ('owned','leased','subleased')),
  landlord_name TEXT,
  landlord_contact TEXT,
  landlord_phone TEXT,
  lease_start DATE,
  lease_end DATE,
  monthly_rent NUMERIC,
  annual_escalation_pct NUMERIC,
  cam_charges NUMERIC,
  property_tax_passthrough BOOLEAN DEFAULT false,
  insurance_passthrough BOOLEAN DEFAULT false,
  security_deposit NUMERIC,
  renewal_options TEXT,
  purchase_option BOOLEAN DEFAULT false,
  right_of_first_refusal BOOLEAN DEFAULT false,
  zoning TEXT,
  conditional_use_permit BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','pending','terminated','expired')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE erp_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES erp_properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  lease_start DATE,
  lease_end DATE,
  monthly_rent NUMERIC,
  annual_escalation_pct NUMERIC,
  security_deposit NUMERIC,
  area_sqft NUMERIC,
  area_acres NUMERIC,
  designated_area TEXT,
  payment_day INTEGER,
  late_fee NUMERIC,
  late_after_days INTEGER,
  gl_required BOOLEAN DEFAULT true,
  gl_minimum NUMERIC,
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active','past_due','delinquent','eviction','terminated','expired'
  )),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE erp_property_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES erp_properties(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('repair','improvement','inspection','permit','utility','other')),
  title TEXT NOT NULL,
  description TEXT,
  vendor_id UUID,
  scheduled_date DATE,
  completed_date DATE,
  estimated_cost NUMERIC,
  actual_cost NUMERIC,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending','scheduled','in_progress','complete','cancelled'
  )),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('emergency','high','normal','low')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- VENDORS & SUPPLIERS
-- ============================================================

CREATE TABLE erp_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN (
    'material_supplier','equipment','tooling','maintenance',
    'office_supplies','utilities','professional_services',
    'waste_disposal','fuel','packaging','other'
  )),
  tax_id TEXT,
  w9_on_file BOOLEAN DEFAULT false,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  payment_terms TEXT DEFAULT 'net_30' CHECK (payment_terms IN (
    'cod','net_10','net_15','net_30','net_45','net_60','net_90','prepaid','credit_card'
  )),
  payment_method TEXT CHECK (payment_method IN ('check','ach','wire','credit_card','cash')),
  bank_info_on_file BOOLEAN DEFAULT false,
  credit_limit NUMERIC,
  certifications JSONB,
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  delivery_rating INTEGER CHECK (delivery_rating BETWEEN 1 AND 5),
  price_rating INTEGER CHECK (price_rating BETWEEN 1 AND 5),
  is_active BOOLEAN DEFAULT true,
  approved_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE erp_vendor_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES erp_vendors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  contract_number TEXT,
  type TEXT CHECK (type IN ('service','supply','maintenance','lease','consulting','other')),
  start_date DATE,
  end_date DATE,
  auto_renew BOOLEAN DEFAULT false,
  renewal_notice_days INTEGER,
  total_value NUMERIC,
  monthly_value NUMERIC,
  payment_terms TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN (
    'draft','active','expiring_soon','expired','terminated','renewed'
  )),
  signed_date DATE,
  notes TEXT,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- FINANCE: INVOICES, PAYMENTS, POs, EXPENSES
-- ============================================================

CREATE TABLE erp_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  type TEXT DEFAULT 'processing' CHECK (type IN (
    'processing','freight','storage','rent','surcharge','credit_memo','other'
  )),
  account_id TEXT,
  bill_to_name TEXT,
  bill_to_address TEXT,
  bill_to_city TEXT,
  bill_to_state TEXT,
  bill_to_zip TEXT,
  job_id UUID REFERENCES erp_jobs(id),
  customer_po TEXT,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  freight_charges NUMERIC DEFAULT 0,
  surcharges NUMERIC DEFAULT 0,
  adjustments NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC DEFAULT 0,
  balance_due NUMERIC DEFAULT 0,
  payment_terms TEXT DEFAULT 'net_30',
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft','sent','viewed','partial','paid',
    'overdue','void','collections','write_off'
  )),
  sent_date DATE,
  last_reminder_date DATE,
  reminder_count INTEGER DEFAULT 0,
  notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES "user"(id),
  UNIQUE(org_id, invoice_number)
);

CREATE TABLE erp_invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES erp_invoices(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'lb' CHECK (unit IN (
    'lb','piece','cwt','ton','each','hour','sqft',
    'lineal_ft','coil','month','flat'
  )),
  unit_price NUMERIC NOT NULL DEFAULT 0,
  line_total NUMERIC DEFAULT 0,
  coil_id UUID REFERENCES erp_coils(id),
  job_line_id UUID REFERENCES erp_job_lines(id),
  notes TEXT,
  UNIQUE(invoice_id, line_number)
);

CREATE TABLE erp_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES erp_invoices(id),
  payment_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  method TEXT CHECK (method IN (
    'check','ach','wire','credit_card','cash','credit_memo','other'
  )),
  reference_number TEXT,
  deposited_date DATE,
  bank_account TEXT,
  status TEXT DEFAULT 'received' CHECK (status IN (
    'received','deposited','cleared','returned','void'
  )),
  returned_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE erp_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  po_number TEXT NOT NULL,
  vendor_id UUID NOT NULL REFERENCES erp_vendors(id),
  description TEXT,
  order_date DATE NOT NULL,
  expected_date DATE,
  received_date DATE,
  subtotal NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  shipping NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft','submitted','confirmed','partial_received',
    'received','invoiced','paid','cancelled'
  )),
  approved_by UUID REFERENCES "user"(id),
  approved_date DATE,
  job_id UUID REFERENCES erp_jobs(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES "user"(id),
  UNIQUE(org_id, po_number)
);

CREATE TABLE erp_po_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES erp_purchase_orders(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT,
  unit_price NUMERIC NOT NULL,
  line_total NUMERIC DEFAULT 0,
  quantity_received NUMERIC DEFAULT 0,
  notes TEXT,
  UNIQUE(po_id, line_number)
);

CREATE TABLE erp_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'rent','utilities','insurance','maintenance','supplies',
    'equipment','fuel','disposal','professional_services',
    'payroll','taxes','permits','freight','packaging',
    'safety','training','office','travel','meals',
    'subscriptions','bank_fees','other'
  )),
  subcategory TEXT,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  vendor_id UUID REFERENCES erp_vendors(id),
  payment_method TEXT CHECK (payment_method IN (
    'check','ach','credit_card','cash','auto_debit'
  )),
  reference_number TEXT,
  property_id UUID REFERENCES erp_properties(id),
  equipment_id UUID REFERENCES erp_equipment(id),
  job_id UUID REFERENCES erp_jobs(id),
  approved_by UUID REFERENCES "user"(id),
  tax_deductible BOOLEAN DEFAULT true,
  tax_category TEXT,
  receipt_on_file BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','void')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES "user"(id)
);

-- ============================================================
-- HR & SAFETY
-- ============================================================

CREATE TABLE erp_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  user_id UUID REFERENCES "user"(id),
  employee_number TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  department TEXT CHECK (department IN (
    'production','shipping','quality','maintenance',
    'admin','management','sales'
  )),
  position TEXT,
  hire_date DATE,
  termination_date DATE,
  employment_type TEXT CHECK (employment_type IN (
    'full_time','part_time','contract','temp'
  )),
  shift TEXT CHECK (shift IN ('day','swing','night','flexible')),
  hourly_rate NUMERIC,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','leave','terminated','retired')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE erp_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES erp_employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'forklift','crane','osha_10','osha_30','first_aid','cpr',
    'hazmat','cdl_a','cdl_b','welding','lockout_tagout',
    'confined_space','fall_protection','rigging',
    'fire_extinguisher','bloodborne_pathogens',
    'electrical_safety','other'
  )),
  cert_number TEXT,
  issued_by TEXT,
  issued_date DATE,
  expiration_date DATE,
  status TEXT DEFAULT 'current' CHECK (status IN (
    'current','expiring_soon','expired','revoked'
  )),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE erp_safety_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  incident_number TEXT NOT NULL,
  incident_date DATE NOT NULL,
  incident_time TIME,
  location TEXT,
  property_id UUID REFERENCES erp_properties(id),
  type TEXT NOT NULL CHECK (type IN (
    'injury','near_miss','property_damage','environmental',
    'fire','chemical_spill','equipment_failure',
    'vehicle_accident','other'
  )),
  severity TEXT CHECK (severity IN (
    'first_aid','medical_treatment','lost_time','fatality'
  )),
  employee_id UUID REFERENCES erp_employees(id),
  witnesses JSONB,
  description TEXT NOT NULL,
  root_cause TEXT,
  corrective_actions TEXT,
  preventive_actions TEXT,
  osha_recordable BOOLEAN DEFAULT false,
  osha_log_number TEXT,
  days_away INTEGER DEFAULT 0,
  days_restricted INTEGER DEFAULT 0,
  days_transferred INTEGER DEFAULT 0,
  claim_id UUID REFERENCES erp_insurance_claims(id),
  status TEXT DEFAULT 'reported' CHECK (status IN (
    'reported','investigating','corrective_action','closed'
  )),
  investigated_by UUID REFERENCES "user"(id),
  closed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, incident_number)
);

-- ============================================================
-- EQUIPMENT MAINTENANCE
-- ============================================================

CREATE TABLE erp_equipment_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES erp_equipment(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'preventive','corrective','emergency','calibration',
    'inspection','overhaul','cleaning','other'
  )),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE,
  completed_date DATE,
  next_due_date DATE,
  performed_by TEXT,
  vendor_id UUID REFERENCES erp_vendors(id),
  work_order_number TEXT,
  downtime_hours NUMERIC,
  labor_hours NUMERIC,
  parts_cost NUMERIC,
  labor_cost NUMERIC,
  total_cost NUMERIC,
  parts_used JSONB,
  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'scheduled','in_progress','complete','deferred','cancelled'
  )),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('emergency','high','normal','low')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CROSS-CUTTING: DOCUMENTS, AUDIT, NOTIFICATIONS
-- ============================================================

CREATE TABLE erp_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'job','coil','shipment','invoice','purchase_order','vendor',
    'carrier','policy','claim','property','tenant','employee',
    'equipment','incident','inspection','contract','coi'
  )),
  entity_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN (
    'mill_cert','bol','pod','invoice','po','quote','contract',
    'coi','inspection_report','photo','drawing','spec_sheet',
    'w9','insurance_policy','lease','permit','safety_report',
    'training_record','msds','other'
  )),
  file_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES "user"(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE erp_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN (
    'create','update','delete','status_change',
    'approve','reject','assign','note'
  )),
  user_id UUID REFERENCES "user"(id),
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  summary TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE erp_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "user"(id),
  type TEXT NOT NULL CHECK (type IN (
    'job_status','shipment_update','invoice_overdue',
    'payment_received','cert_expiring','insurance_expiring',
    'lease_renewal','maintenance_due','safety_incident',
    'quality_hold','low_stock','coi_expiring','custom'
  )),
  title TEXT NOT NULL,
  message TEXT,
  entity_type TEXT,
  entity_id UUID,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  dismissed BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('urgent','high','normal','low')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX erp_jobs_org_status ON erp_jobs(org_id, status);
CREATE INDEX erp_jobs_account ON erp_jobs(account_id);
CREATE INDEX erp_coils_org_status ON erp_coils(org_id, status);
CREATE INDEX erp_coils_job ON erp_coils(job_id);
CREATE INDEX erp_coils_owner ON erp_coils(owner_account_id);
CREATE INDEX erp_processing_steps_job ON erp_processing_steps(job_id);
CREATE INDEX erp_inspections_job ON erp_inspections(job_id);
CREATE INDEX erp_shipments_org_status ON erp_shipments(org_id, status);
CREATE INDEX erp_shipments_job ON erp_shipments(job_id);
CREATE INDEX erp_invoices_org_status ON erp_invoices(org_id, status);
CREATE INDEX erp_invoices_account ON erp_invoices(account_id);
CREATE INDEX erp_payments_invoice ON erp_payments(invoice_id);
CREATE INDEX erp_po_org_status ON erp_purchase_orders(org_id, status);
CREATE INDEX erp_expenses_org_date ON erp_expenses(org_id, date);
CREATE INDEX erp_documents_entity ON erp_documents(entity_type, entity_id);
CREATE INDEX erp_audit_log_entity ON erp_audit_log(entity_type, entity_id);
CREATE INDEX erp_audit_log_user ON erp_audit_log(user_id, created_at DESC);
CREATE INDEX erp_notifications_user ON erp_notifications(user_id, read, created_at DESC);
CREATE INDEX erp_coi_tracking_expiry ON erp_coi_tracking(expiration_date) WHERE status != 'not_required';
CREATE INDEX erp_insurance_policies_expiry ON erp_insurance_policies(expiration_date) WHERE status = 'active';
CREATE INDEX erp_certifications_expiry ON erp_certifications(expiration_date) WHERE status = 'current';
CREATE INDEX erp_equipment_maintenance_due ON erp_equipment_maintenance(next_due_date) WHERE status = 'scheduled';

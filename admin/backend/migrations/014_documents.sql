CREATE TABLE IF NOT EXISTS crm_documents (
  slug TEXT PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organization(id),
  html TEXT NOT NULL,
  updated_by UUID REFERENCES "user"(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

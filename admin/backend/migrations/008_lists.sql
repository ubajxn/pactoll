CREATE UNIQUE INDEX crm_entities_scope_kind_id ON crm_entities (organization_id, kind, id);

CREATE TABLE crm_lists (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 100),
  record_type TEXT NOT NULL CHECK (record_type IN ('accounts','contacts','opportunities')),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (organization_id, record_type, id)
);
CREATE TABLE crm_list_records (
  organization_id UUID NOT NULL,
  record_type TEXT NOT NULL,
  list_id TEXT NOT NULL,
  record_id TEXT NOT NULL,
  PRIMARY KEY (list_id, record_id),
  FOREIGN KEY (organization_id, record_type, list_id)
    REFERENCES crm_lists(organization_id, record_type, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, record_type, record_id)
    REFERENCES crm_entities(organization_id, kind, id) ON DELETE CASCADE
);
CREATE INDEX crm_list_records_record ON crm_list_records (record_id);

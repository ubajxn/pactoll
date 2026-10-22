CREATE UNIQUE INDEX member_organization_user_unique ON member ("organizationId", "userId");

CREATE TABLE crm_entities (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('accounts','contacts','opportunities','tasks','conversations')),
  created_by UUID NOT NULL REFERENCES "user"(id),
  owner_id UUID,
  payload JSONB NOT NULL,
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, owner_id) REFERENCES member("organizationId", "userId") ON DELETE SET NULL (owner_id)
);
CREATE INDEX crm_entities_scope ON crm_entities (organization_id, kind, created_by);

CREATE TABLE crm_messages (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL,
  conversation_id TEXT NOT NULL,
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  payload JSONB NOT NULL,
  UNIQUE (conversation_id, sequence),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, conversation_id) REFERENCES crm_entities(organization_id, id) ON DELETE CASCADE
);
CREATE TABLE crm_entity_links (
  organization_id UUID NOT NULL,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  PRIMARY KEY (source_id, target_id),
  FOREIGN KEY (organization_id, source_id) REFERENCES crm_entities(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, target_id) REFERENCES crm_entities(organization_id, id) ON DELETE RESTRICT
);
CREATE TABLE crm_message_links (
  organization_id UUID NOT NULL,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  PRIMARY KEY (source_id, target_id),
  FOREIGN KEY (organization_id, source_id) REFERENCES crm_messages(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, target_id) REFERENCES crm_entities(organization_id, id) ON DELETE RESTRICT
);
CREATE INDEX crm_entity_link_target ON crm_entity_links(target_id);
CREATE INDEX crm_message_link_target ON crm_message_links(target_id);
CREATE TABLE crm_imports (
  source_hash TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organization(id),
  imported_by UUID NOT NULL REFERENCES "user"(id),
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

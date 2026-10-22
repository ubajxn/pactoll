CREATE TABLE crm_chat_generations (
  organization_id UUID NOT NULL,
  conversation_id TEXT NOT NULL,
  response_id TEXT NOT NULL,
  attempt_id TEXT NOT NULL,
  generation INTEGER NOT NULL CHECK (generation > 0),
  revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
  mode TEXT NOT NULL CHECK (mode IN ('append', 'replace')),
  status TEXT CHECK (status IN ('partial', 'final', 'interrupted')),
  PRIMARY KEY (organization_id, conversation_id, response_id),
  UNIQUE (organization_id, conversation_id, attempt_id),
  FOREIGN KEY (organization_id, conversation_id)
    REFERENCES crm_entities(organization_id, id) ON DELETE CASCADE
);

CREATE TABLE crm_chat_mutation_receipts (
  organization_id UUID NOT NULL,
  conversation_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  payload JSONB NOT NULL,
  PRIMARY KEY (organization_id, conversation_id, idempotency_key),
  FOREIGN KEY (organization_id, conversation_id)
    REFERENCES crm_entities(organization_id, id) ON DELETE CASCADE
);

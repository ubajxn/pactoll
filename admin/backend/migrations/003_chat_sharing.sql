CREATE TABLE crm_conversation_shares (
  organization_id UUID NOT NULL,
  conversation_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id),
  CHECK (user_id <> owner_id),
  FOREIGN KEY (organization_id, conversation_id) REFERENCES crm_entities(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, user_id) REFERENCES member("organizationId", "userId") ON DELETE CASCADE,
  FOREIGN KEY (organization_id, owner_id) REFERENCES member("organizationId", "userId") ON DELETE CASCADE
);
CREATE INDEX crm_conversation_share_recipient ON crm_conversation_shares(organization_id, user_id);

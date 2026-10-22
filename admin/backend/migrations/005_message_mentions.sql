-- Application writes lock/update entities before messages. Match that order so
-- old API processes cannot create or invalidate mentions during the backfill.
LOCK TABLE crm_entities, crm_messages IN SHARE ROW EXCLUSIVE MODE;

UPDATE crm_messages AS message
SET payload = jsonb_set(
  message.payload,
  '{blocks}',
  COALESCE(
    (
      SELECT jsonb_agg(
        CASE
          WHEN block->>'type' <> 'mention' THEN block
          WHEN EXISTS (
            SELECT 1
            FROM crm_entities AS target
            WHERE target.organization_id = message.organization_id
              AND target.id = block->'reference'->>'id'
              AND target.kind = block->'reference'->>'type'
              AND target.kind <> 'conversations'
          ) THEN block
          ELSE jsonb_build_object(
            'type', 'text',
            'text', COALESCE(block->>'label', '')
          )
        END
        ORDER BY position
      )
      FROM jsonb_array_elements(message.payload->'blocks')
        WITH ORDINALITY AS item(block, position)
    ),
    '[]'::jsonb
  ),
  false
)
WHERE jsonb_typeof(message.payload->'blocks') = 'array'
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(message.payload->'blocks') AS item(block)
    WHERE block->>'type' = 'mention'
      AND NOT EXISTS (
        SELECT 1
        FROM crm_entities AS target
        WHERE target.organization_id = message.organization_id
          AND target.id = block->'reference'->>'id'
          AND target.kind = block->'reference'->>'type'
          AND target.kind <> 'conversations'
      )
  );

INSERT INTO crm_message_links (organization_id, source_id, target_id)
SELECT message.organization_id, message.id, target.id
FROM crm_messages AS message
CROSS JOIN LATERAL jsonb_array_elements(message.payload->'blocks') AS item(block)
JOIN crm_entities AS target
  ON target.organization_id = message.organization_id
 AND target.id = block->'reference'->>'id'
 AND target.kind = block->'reference'->>'type'
 AND target.kind <> 'conversations'
WHERE jsonb_typeof(message.payload->'blocks') = 'array'
  AND block->>'type' = 'mention'
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION crm_sync_message_mentions()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF jsonb_typeof(NEW.payload->'blocks') <> 'array' THEN
    RETURN NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(NEW.payload->'blocks') AS item(block)
    WHERE block->>'type' = 'mention'
      AND NOT EXISTS (
        SELECT 1
        FROM crm_entities AS target
        WHERE target.organization_id = NEW.organization_id
          AND target.id = block->'reference'->>'id'
          AND target.kind = block->'reference'->>'type'
          AND target.kind <> 'conversations'
      )
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23503',
      MESSAGE = 'Mention target does not exist in this workspace and record type',
      CONSTRAINT = 'crm_message_mention_target_fkey';
  END IF;

  INSERT INTO crm_message_links (organization_id, source_id, target_id)
  SELECT NEW.organization_id, NEW.id, target.id
  FROM jsonb_array_elements(NEW.payload->'blocks') AS item(block)
  JOIN crm_entities AS target
    ON target.organization_id = NEW.organization_id
   AND target.id = block->'reference'->>'id'
   AND target.kind = block->'reference'->>'type'
   AND target.kind <> 'conversations'
  WHERE block->>'type' = 'mention'
  ON CONFLICT DO NOTHING;

  RETURN NULL;
END
$$;

DROP TRIGGER IF EXISTS crm_message_mentions_sync ON crm_messages;
CREATE CONSTRAINT TRIGGER crm_message_mentions_sync
AFTER INSERT OR UPDATE OF payload ON crm_messages
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION crm_sync_message_mentions();

CREATE FUNCTION crm_member_has_role(roles TEXT, wanted TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM unnest(string_to_array(roles, ',')) AS value(role)
    WHERE btrim(value.role) = wanted
  )
$$;

-- Wait for active membership changes, then prevent changes between the count
-- backfill and trigger installation. New organizations remain free to finish;
-- their first owner insert will run the trigger after this transaction commits.
LOCK TABLE member IN SHARE ROW EXCLUSIVE MODE;

CREATE TABLE crm_organization_owner_counts (
  organization_id UUID PRIMARY KEY REFERENCES organization(id) ON DELETE CASCADE,
  owner_count INTEGER NOT NULL CHECK (owner_count > 0)
);

INSERT INTO crm_organization_owner_counts (organization_id, owner_count)
SELECT "organizationId", count(*)
FROM member
WHERE crm_member_has_role(role, 'owner')
GROUP BY "organizationId";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM organization
    LEFT JOIN crm_organization_owner_counts owner_count
      ON owner_count.organization_id = organization.id
    WHERE owner_count.organization_id IS NULL
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'Existing organization has no owner',
      CONSTRAINT = 'organization_owner_count';
  END IF;
END
$$;

CREATE FUNCTION crm_adjust_workspace_owner_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  old_organization_id UUID;
  new_organization_id UUID;
BEGIN
  IF TG_OP <> 'INSERT'
     AND crm_member_has_role(OLD.role, 'owner')
     AND (
       TG_OP = 'DELETE'
       OR OLD."organizationId" <> NEW."organizationId"
       OR NOT crm_member_has_role(NEW.role, 'owner')
     ) THEN
    old_organization_id := OLD."organizationId";
  END IF;

  IF TG_OP <> 'DELETE'
     AND crm_member_has_role(NEW.role, 'owner')
     AND (
       TG_OP = 'INSERT'
       OR OLD."organizationId" <> NEW."organizationId"
       OR NOT crm_member_has_role(OLD.role, 'owner')
     ) THEN
    new_organization_id := NEW."organizationId";
  END IF;

  -- Lock both counters in UUID order before a cross-workspace move.
  PERFORM organization_id
  FROM crm_organization_owner_counts
  WHERE organization_id = old_organization_id
     OR organization_id = new_organization_id
  ORDER BY organization_id
  FOR UPDATE;

  IF old_organization_id IS NOT NULL THEN
    UPDATE crm_organization_owner_counts
    SET owner_count = owner_count - 1
    WHERE organization_id = old_organization_id AND owner_count > 1;
    IF NOT FOUND
       AND EXISTS (SELECT 1 FROM organization WHERE id = old_organization_id) THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'An organization must retain at least one owner',
        CONSTRAINT = CASE
          WHEN TG_OP = 'DELETE' THEN 'member_last_owner_delete'
          ELSE 'member_last_owner_update'
        END;
    END IF;
  END IF;

  IF new_organization_id IS NOT NULL THEN
    INSERT INTO crm_organization_owner_counts (organization_id, owner_count)
    VALUES (new_organization_id, 1)
    ON CONFLICT (organization_id) DO UPDATE
      SET owner_count = crm_organization_owner_counts.owner_count + 1;
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END
$$;

CREATE TRIGGER member_adjust_workspace_owner_count
BEFORE INSERT OR DELETE OR UPDATE OF role, "organizationId"
ON member
FOR EACH ROW
EXECUTE FUNCTION crm_adjust_workspace_owner_count();

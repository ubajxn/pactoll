-- Never choose between or merge existing companies implicitly.
LOCK TABLE organization, "user" IN SHARE ROW EXCLUSIVE MODE;
DO $$
BEGIN
  IF (SELECT count(*) FROM organization) > 1 THEN
    RAISE EXCEPTION 'Single-company CRM requires one organization. Back up and explicitly consolidate existing organizations before migrating.';
  END IF;
END
$$;

CREATE UNIQUE INDEX organization_single_company ON organization ((true));

-- A durable latch: deleting accounts must never reopen public registration.
CREATE TABLE crm_installation (
  singleton BOOLEAN PRIMARY KEY DEFAULT true CHECK (singleton),
  signup_closed BOOLEAN NOT NULL,
  bootstrap_user_id UUID
);
INSERT INTO crm_installation (signup_closed, bootstrap_user_id)
SELECT EXISTS (SELECT 1 FROM "user") OR EXISTS (SELECT 1 FROM organization),
  (SELECT id FROM "user" WHERE "emailVerified" ORDER BY "createdAt", id LIMIT 1);

-- Preserve existing accounts, company, memberships and records. Complete an
-- interrupted legacy setup only when there is a verified founding account.
DO $$
DECLARE founder UUID;
DECLARE company UUID;
BEGIN
  SELECT bootstrap_user_id INTO founder FROM crm_installation;
  IF founder IS NOT NULL AND NOT EXISTS (SELECT 1 FROM organization) THEN
    INSERT INTO organization (name,slug,"createdAt") VALUES ('My company','company',now()) RETURNING id INTO company;
    INSERT INTO member ("organizationId","userId",role,"createdAt") VALUES (company,founder,'owner',now());
  END IF;
END
$$;

-- Bind signup permission to the emailed magic token, never to a mutable return URL.
CREATE TABLE crm_signup_links (
  token_hash TEXT PRIMARY KEY,
  invitation_id UUID NOT NULL REFERENCES invitation(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE FUNCTION crm_guard_signup() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE closed BOOLEAN;
BEGIN
  SELECT signup_closed INTO closed FROM crm_installation WHERE singleton FOR UPDATE;
  IF NOT closed AND NEW."emailVerified" THEN
    UPDATE crm_installation SET signup_closed=true, bootstrap_user_id=NEW.id WHERE singleton;
  ELSIF NOT EXISTS (
    SELECT 1 FROM invitation WHERE lower(email)=lower(NEW.email)
      AND status='pending' AND "expiresAt">now()
  ) THEN
    RAISE EXCEPTION USING ERRCODE='23514', CONSTRAINT='signup_invitation_required',
      MESSAGE='An invitation is required to create an account';
  END IF;
  RETURN NEW;
END
$$;
CREATE TRIGGER user_guard_signup BEFORE INSERT ON "user"
FOR EACH ROW EXECUTE FUNCTION crm_guard_signup();

CREATE FUNCTION crm_bootstrap_company() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE company UUID;
BEGIN
  IF NEW.id = (SELECT bootstrap_user_id FROM crm_installation WHERE singleton)
     AND NOT EXISTS (SELECT 1 FROM organization) THEN
    INSERT INTO organization (name,slug,"createdAt") VALUES ('My company','company',now()) RETURNING id INTO company;
    INSERT INTO member ("organizationId","userId",role,"createdAt") VALUES (company,NEW.id,'owner',now());
  END IF;
  RETURN NEW;
END
$$;
CREATE TRIGGER user_bootstrap_company AFTER INSERT ON "user"
FOR EACH ROW EXECUTE FUNCTION crm_bootstrap_company();

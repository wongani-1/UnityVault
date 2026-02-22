-- Enforce group-scoped unique member credentials (username, email, phone)
-- This prevents duplicate member identities inside the same group.

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.members
    WHERE username IS NOT NULL
      AND btrim(username) <> ''
    GROUP BY group_id, lower(btrim(username))
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot apply unique username constraint: duplicate member usernames exist within the same group';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.members
    WHERE email IS NOT NULL
      AND btrim(email) <> ''
    GROUP BY group_id, lower(btrim(email))
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot apply unique email constraint: duplicate member emails exist within the same group';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.members
    WHERE phone IS NOT NULL
      AND btrim(phone) <> ''
    GROUP BY group_id, regexp_replace(btrim(phone), '\s+', '', 'g')
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot apply unique phone constraint: duplicate member phone numbers exist within the same group';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_members_group_username_ci
  ON public.members (group_id, lower(btrim(username)));

CREATE UNIQUE INDEX IF NOT EXISTS uq_members_group_email_ci
  ON public.members (group_id, lower(btrim(email)))
  WHERE email IS NOT NULL AND btrim(email) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_members_group_phone_norm
  ON public.members (group_id, regexp_replace(btrim(phone), '\s+', '', 'g'))
  WHERE phone IS NOT NULL AND btrim(phone) <> '';

COMMIT;

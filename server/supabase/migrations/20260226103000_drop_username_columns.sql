-- Remove legacy username columns from admins and members

DROP INDEX IF EXISTS public.idx_members_identifier;
DROP INDEX IF EXISTS public.uq_members_group_username_ci;

ALTER TABLE public.admins
  DROP COLUMN IF EXISTS username;

ALTER TABLE public.members
  DROP COLUMN IF EXISTS username;

-- Recreate identifier index without username
CREATE INDEX IF NOT EXISTS idx_members_identifier
  ON public.members(email, phone);

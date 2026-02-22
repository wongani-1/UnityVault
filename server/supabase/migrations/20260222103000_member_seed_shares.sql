-- Add seed deposit and share tracking fields to members

BEGIN;

ALTER TABLE public.members ADD COLUMN IF NOT EXISTS seed_paid BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS seed_paid_at TIMESTAMPTZ;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS shares_owned INTEGER NOT NULL DEFAULT 0;

COMMIT;

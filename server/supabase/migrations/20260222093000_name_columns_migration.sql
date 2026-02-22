-- ============================================================================
-- UnityVault Name/Subscription Schema Migration
-- Date: 2026-02-22
-- Purpose:
--   1) Ensure first_name/last_name columns exist and are populated
--   2) Ensure admin subscription columns exist
--   3) Ensure member registration columns exist
--   4) Ensure payment_transactions has first_name/last_name
--   5) Remove legacy full_name columns
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- ADMINS: add missing columns
-- --------------------------------------------------------------------------
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS subscription_paid BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS subscription_paid_at TIMESTAMPTZ;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Backfill from legacy full_name when present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admins'
      AND column_name = 'full_name'
  ) THEN
    UPDATE public.admins
    SET
      first_name = COALESCE(NULLIF(first_name, ''), NULLIF(split_part(full_name, ' ', 1), '')),
      last_name = COALESCE(
        NULLIF(last_name, ''),
        NULLIF(
          regexp_replace(full_name, '^\S+\s*', ''),
          ''
        )
      )
    WHERE full_name IS NOT NULL;
  END IF;
END $$;

-- Keep names usable even if old full_name had a single token
UPDATE public.admins
SET first_name = COALESCE(first_name, username)
WHERE first_name IS NULL OR first_name = '';

UPDATE public.admins
SET last_name = COALESCE(last_name, '')
WHERE last_name IS NULL;

-- --------------------------------------------------------------------------
-- MEMBERS: add missing columns
-- --------------------------------------------------------------------------
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS registration_fee_paid BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS registration_fee_paid_at TIMESTAMPTZ;

-- Backfill from legacy full_name when present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'members'
      AND column_name = 'full_name'
  ) THEN
    UPDATE public.members
    SET
      first_name = COALESCE(NULLIF(first_name, ''), NULLIF(split_part(full_name, ' ', 1), '')),
      last_name = COALESCE(
        NULLIF(last_name, ''),
        NULLIF(
          regexp_replace(full_name, '^\S+\s*', ''),
          ''
        )
      )
    WHERE full_name IS NOT NULL;
  END IF;
END $$;

UPDATE public.members
SET first_name = COALESCE(first_name, username)
WHERE first_name IS NULL OR first_name = '';

UPDATE public.members
SET last_name = COALESCE(last_name, '')
WHERE last_name IS NULL;

-- Make members first/last names required after backfill
ALTER TABLE public.members ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE public.members ALTER COLUMN last_name SET NOT NULL;

-- --------------------------------------------------------------------------
-- PAYMENT TRANSACTIONS: ensure name columns exist
-- --------------------------------------------------------------------------
ALTER TABLE public.payment_transactions ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.payment_transactions ADD COLUMN IF NOT EXISTS last_name TEXT;

-- --------------------------------------------------------------------------
-- Remove legacy full_name columns if they still exist
-- --------------------------------------------------------------------------
ALTER TABLE public.admins DROP COLUMN IF EXISTS full_name;
ALTER TABLE public.members DROP COLUMN IF EXISTS full_name;

COMMIT;

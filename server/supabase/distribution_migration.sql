-- ============================================================================
-- UnityVault Distribution Tables Migration
-- Date: 2026-02-16
-- Description: Adds year-end profit distribution functionality
-- 
-- HOW TO RUN:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Copy this entire file
-- 3. Paste and click "Run"
-- 
-- ROLLBACK (if needed):
-- DROP TABLE IF EXISTS public.member_distributions CASCADE;
-- DROP TABLE IF EXISTS public.distributions CASCADE;
-- ============================================================================

-- Create distributions table
CREATE TABLE IF NOT EXISTS public.distributions (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  total_contributions DOUBLE PRECISION NOT NULL,
  total_profit_pool DOUBLE PRECISION NOT NULL,
  total_loan_interest DOUBLE PRECISION NOT NULL,
  total_penalties DOUBLE PRECISION NOT NULL,
  number_of_members INTEGER NOT NULL,
  profit_per_member DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL,
  distributed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, year)
);

-- Create member_distributions table
CREATE TABLE IF NOT EXISTS public.member_distributions (
  id TEXT PRIMARY KEY,
  distribution_id TEXT NOT NULL REFERENCES public.distributions(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  total_contributions DOUBLE PRECISION NOT NULL,
  profit_share DOUBLE PRECISION NOT NULL,
  total_payout DOUBLE PRECISION NOT NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_distributions_group_id ON public.distributions(group_id);
CREATE INDEX IF NOT EXISTS idx_distributions_year ON public.distributions(group_id, year);
CREATE INDEX IF NOT EXISTS idx_member_distributions_distribution_id ON public.member_distributions(distribution_id);
CREATE INDEX IF NOT EXISTS idx_member_distributions_member_id ON public.member_distributions(member_id);

-- Enable Row Level Security
ALTER TABLE public.distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_distributions ENABLE ROW LEVEL SECURITY;

-- Revoke public access (security best practice)
REVOKE ALL ON TABLE public.distributions FROM anon, authenticated;
REVOKE ALL ON TABLE public.member_distributions FROM anon, authenticated;

-- Grant access to service_role (your backend API uses this)
GRANT ALL ON TABLE public.distributions TO service_role;
GRANT ALL ON TABLE public.member_distributions TO service_role;

-- ============================================================================
-- VERIFICATION QUERIES (run these to confirm successful migration)
-- ============================================================================

-- Check if tables were created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'distributions'
  ) THEN
    RAISE NOTICE '✓ distributions table created successfully';
  ELSE
    RAISE NOTICE '✗ distributions table was NOT created';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'member_distributions'
  ) THEN
    RAISE NOTICE '✓ member_distributions table created successfully';
  ELSE
    RAISE NOTICE '✗ member_distributions table was NOT created';
  END IF;
END $$;

-- Show created tables and their row counts
SELECT 
  'distributions' AS table_name, 
  COUNT(*) AS row_count 
FROM public.distributions
UNION ALL
SELECT 
  'member_distributions' AS table_name, 
  COUNT(*) AS row_count 
FROM public.member_distributions;

-- ============================================================================
-- MIGRATION COMPLETE
-- Next step: Restart your backend server to use the new tables
-- ============================================================================

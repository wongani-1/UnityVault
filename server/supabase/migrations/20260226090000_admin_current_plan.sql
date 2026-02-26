ALTER TABLE public.admins
ADD COLUMN IF NOT EXISTS current_plan_id TEXT NOT NULL DEFAULT 'starter';

UPDATE public.admins
SET current_plan_id = 'starter'
WHERE current_plan_id IS NULL;

-- UnityVault Supabase schema

create table if not exists public.groups (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now(),
  settings jsonb not null,
  total_savings double precision not null default 0,
  total_income double precision not null default 0,
  cash double precision not null default 0
);

create table if not exists public.admins (
  id text primary key,
  group_id text not null references public.groups(id) on delete cascade,
  full_name text,
  email text not null,
  phone text,
  username text not null,
  password_hash text not null,
  role text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.members (
  id text primary key,
  group_id text not null references public.groups(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  username text not null,
  password_hash text not null,
  status text not null,
  created_at timestamptz not null default now(),
  balance double precision not null default 0,
  penalties_total double precision not null default 0,
  invite_token text,
  invite_otp_hash text,
  invite_expires_at timestamptz,
  invite_sent_at timestamptz
);

create table if not exists public.contributions (
  id text primary key,
  group_id text not null references public.groups(id) on delete cascade,
  member_id text not null references public.members(id) on delete cascade,
  amount double precision not null,
  month text not null,
  status text not null,
  due_date timestamptz not null,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.loans (
  id text primary key,
  group_id text not null references public.groups(id) on delete cascade,
  member_id text not null references public.members(id) on delete cascade,
  principal double precision not null,
  interest_rate double precision not null,
  total_interest double precision not null,
  total_due double precision not null,
  balance double precision not null,
  status text not null,
  installments jsonb not null default '[]'::jsonb,
  reason text,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  completed_at timestamptz,
  due_date timestamptz
);

create table if not exists public.penalties (
  id text primary key,
  group_id text not null references public.groups(id) on delete cascade,
  member_id text not null references public.members(id) on delete cascade,
  loan_id text references public.loans(id) on delete set null,
  installment_id text,
  contribution_id text references public.contributions(id) on delete set null,
  amount double precision not null,
  reason text not null,
  status text not null,
  due_date timestamptz not null,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  is_paid boolean not null default false
);

create table if not exists public.notifications (
  id text primary key,
  group_id text not null references public.groups(id) on delete cascade,
  member_id text references public.members(id) on delete set null,
  admin_id text references public.admins(id) on delete set null,
  type text not null,
  message text not null,
  status text not null,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table if not exists public.audit_logs (
  id text primary key,
  group_id text not null references public.groups(id) on delete cascade,
  actor_id text not null,
  actor_role text not null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  created_at timestamptz not null default now(),
  meta jsonb
);

create table if not exists public.transactions (
  id text primary key,
  group_id text not null references public.groups(id) on delete cascade,
  member_id text not null references public.members(id) on delete cascade,
  type text not null,
  amount double precision not null,
  description text not null,
  member_savings_change double precision not null,
  group_income_change double precision not null,
  group_cash_change double precision not null,
  contribution_id text references public.contributions(id) on delete set null,
  loan_id text references public.loans(id) on delete set null,
  installment_id text,
  penalty_id text references public.penalties(id) on delete set null,
  created_at timestamptz not null default now(),
  created_by text not null
);

create index if not exists idx_admins_group_id on public.admins(group_id);
create index if not exists idx_members_group_id on public.members(group_id);
create index if not exists idx_members_identifier on public.members(username, email, phone);
create index if not exists idx_contributions_group_id on public.contributions(group_id);
create index if not exists idx_contributions_member_id on public.contributions(member_id);
create index if not exists idx_contributions_month on public.contributions(month);
create index if not exists idx_loans_group_id on public.loans(group_id);
create index if not exists idx_loans_member_id on public.loans(member_id);
create index if not exists idx_penalties_group_id on public.penalties(group_id);
create index if not exists idx_penalties_member_id on public.penalties(member_id);
create index if not exists idx_notifications_group_id on public.notifications(group_id);
create index if not exists idx_notifications_member_id on public.notifications(member_id);
create index if not exists idx_audit_logs_group_id on public.audit_logs(group_id);
create index if not exists idx_transactions_group_id on public.transactions(group_id);
create index if not exists idx_transactions_member_id on public.transactions(member_id);

-- Enable RLS and restrict access for anon/authenticated roles.
alter table public.groups enable row level security;
alter table public.admins enable row level security;
alter table public.members enable row level security;
alter table public.contributions enable row level security;
alter table public.loans enable row level security;
alter table public.penalties enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.transactions enable row level security;

revoke all on table public.groups from anon, authenticated;
revoke all on table public.admins from anon, authenticated;
revoke all on table public.members from anon, authenticated;
revoke all on table public.contributions from anon, authenticated;
revoke all on table public.loans from anon, authenticated;
revoke all on table public.penalties from anon, authenticated;
revoke all on table public.notifications from anon, authenticated;
revoke all on table public.audit_logs from anon, authenticated;
revoke all on table public.transactions from anon, authenticated;

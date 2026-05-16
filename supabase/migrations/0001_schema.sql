-- i2 Finance — Schema inicial
-- Convenções: snake_case, uuid PKs, timestamptz, numeric(12,2) para valores

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── Households ───────────────────────────────────────────────────────────────
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- ─── Profiles (extends Supabase Auth) ─────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid not null references households(id),
  name text not null,
  role text not null check (role in ('admin', 'operator')),
  created_at timestamptz default now()
);

-- ─── Accounts ─────────────────────────────────────────────────────────────────
create table accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  name text not null,
  kind text not null check (kind in ('credit_card', 'checking', 'company')),
  opening_balance numeric(12,2) default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- ─── Categories ───────────────────────────────────────────────────────────────
create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  name text not null,
  default_responsible text check (default_responsible in ('iremar','juliana','casal','i2'))
);

-- ─── CSV Imports (audit) ──────────────────────────────────────────────────────
create table csv_imports (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  filename text not null,
  account_id uuid not null references accounts(id),
  imported_at timestamptz default now(),
  imported_by uuid references profiles(id),
  rows_total int not null default 0,
  rows_inserted int not null default 0,
  rows_skipped_duplicate int not null default 0,
  rows_flagged_review int not null default 0,
  rows_auto_assigned int not null default 0,
  raw_content_sha256 text not null,
  -- Prevent re-importing same file
  unique (household_id, raw_content_sha256)
);

-- ─── Transactions (central table) ─────────────────────────────────────────────
create table transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  account_id uuid not null references accounts(id),
  occurred_on date not null,
  description text not null,
  amount numeric(12,2) not null,
  responsible text not null check (responsible in ('iremar','juliana','casal','i2','unassigned')) default 'unassigned',
  category_id uuid references categories(id),
  status text not null check (status in ('pending','paid','reconciled')) default 'pending',
  source text not null check (source in ('csv_import','manual_cli','manual_pwa')),
  csv_import_id uuid references csv_imports(id),
  fingerprint text not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references profiles(id),
  -- Core deduplication constraint
  unique (household_id, fingerprint)
);

create index idx_transactions_household_month on transactions (household_id, occurred_on);
create index idx_transactions_responsible on transactions (household_id, responsible);
create index idx_transactions_fingerprint on transactions (fingerprint);

-- ─── Recurring commitments (fixed monthly expenses) ───────────────────────────
create table recurring_commitments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  description text not null,
  amount numeric(12,2) not null,
  responsible text not null check (responsible in ('iremar','juliana','casal','i2')),
  account_id uuid not null references accounts(id),
  due_day int not null check (due_day between 1 and 31),
  category_id uuid references categories(id),
  variable boolean default false,
  active boolean default true,
  notes text
);

-- ─── Monthly obligations (generated each month from recurring) ─────────────────
create table monthly_obligations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  recurring_id uuid references recurring_commitments(id),
  reference_month date not null,
  due_date date not null,
  description text not null,
  amount numeric(12,2) not null,
  responsible text not null,
  status text not null check (status in ('pending','paid','skipped')) default 'pending',
  paid_on date,
  paid_amount numeric(12,2),
  unique (household_id, recurring_id, reference_month)
);

-- ─── Categorization rules ─────────────────────────────────────────────────────
create table categorization_rules (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  match_pattern text not null,
  responsible text not null check (responsible in ('iremar','juliana','casal','i2','unassigned')),
  category_id uuid references categories(id),
  confidence numeric(3,2) default 1.0 check (confidence between 0 and 1),
  hits int default 0,
  created_from_manual boolean default false,
  unique (household_id, match_pattern)
);

-- ─── Monthly settlements (snapshot of closed month) ───────────────────────────
create table monthly_settlements (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  reference_month date not null,
  -- Credit card split
  iremar_part numeric(12,2) not null default 0,
  juliana_part numeric(12,2) not null default 0,
  i2_part numeric(12,2) not null default 0,
  casal_total numeric(12,2) not null default 0,
  total_fatura numeric(12,2) not null default 0,
  -- What was actually transferred
  juliana_transferred numeric(12,2),
  iremar_transferred numeric(12,2),
  -- Carry-over credits (when someone paid more/less)
  credit_carried_to_juliana numeric(12,2) default 0,
  credit_carried_to_iremar numeric(12,2) default 0,
  -- Iremar personal cashflow
  pro_labore numeric(12,2) default 0,
  i2_reimbursements numeric(12,2) default 0,
  other_income numeric(12,2) default 0,
  fixed_commitments_total numeric(12,2) default 0,
  closed_at timestamptz,
  closed_by uuid references profiles(id),
  unique (household_id, reference_month)
);

-- ─── Income records (pró-labore, reembolsos, outras receitas) ─────────────────
create table income_records (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  occurred_on date not null,
  description text not null,
  amount numeric(12,2) not null,
  kind text not null check (kind in ('pro_labore','i2_reimbursement','juliana_transfer','other')),
  reference_month date,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ─── Updated_at trigger ───────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger transactions_updated_at
  before update on transactions
  for each row execute function set_updated_at();

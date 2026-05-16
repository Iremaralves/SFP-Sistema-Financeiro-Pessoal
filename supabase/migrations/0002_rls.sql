-- ─── Row Level Security ───────────────────────────────────────────────────────
-- All access is scoped to the user's household.
-- Admins can do everything. Operators have restricted write access.

-- Helper function: get current user's household_id
create or replace function get_my_household_id()
returns uuid language sql security definer stable as $$
  select household_id from profiles where id = auth.uid()
$$;

-- Helper function: get current user's role
create or replace function get_my_role()
returns text language sql security definer stable as $$
  select role from profiles where id = auth.uid()
$$;

-- ─── Enable RLS on all tables ─────────────────────────────────────────────────
alter table households enable row level security;
alter table profiles enable row level security;
alter table accounts enable row level security;
alter table categories enable row level security;
alter table csv_imports enable row level security;
alter table transactions enable row level security;
alter table recurring_commitments enable row level security;
alter table monthly_obligations enable row level security;
alter table categorization_rules enable row level security;
alter table monthly_settlements enable row level security;
alter table income_records enable row level security;

-- ─── Households ──────────────────────────────────────────────────────────────
create policy "users see own household"
  on households for select
  using (id = get_my_household_id());

-- ─── Profiles ────────────────────────────────────────────────────────────────
create policy "users see household profiles"
  on profiles for select
  using (household_id = get_my_household_id());

create policy "users update own profile"
  on profiles for update
  using (id = auth.uid());

-- ─── Accounts ────────────────────────────────────────────────────────────────
create policy "household members see accounts"
  on accounts for select
  using (household_id = get_my_household_id());

create policy "admin manage accounts"
  on accounts for all
  using (household_id = get_my_household_id() and get_my_role() = 'admin');

-- ─── Categories ──────────────────────────────────────────────────────────────
create policy "household members see categories"
  on categories for select
  using (household_id = get_my_household_id());

create policy "admin manage categories"
  on categories for all
  using (household_id = get_my_household_id() and get_my_role() = 'admin');

-- ─── CSV Imports ──────────────────────────────────────────────────────────────
create policy "household members see imports"
  on csv_imports for select
  using (household_id = get_my_household_id());

create policy "admin manage imports"
  on csv_imports for all
  using (household_id = get_my_household_id() and get_my_role() = 'admin');

-- ─── Transactions ─────────────────────────────────────────────────────────────
create policy "household members see transactions"
  on transactions for select
  using (household_id = get_my_household_id());

create policy "members insert transactions"
  on transactions for insert
  with check (household_id = get_my_household_id());

create policy "members update transactions"
  on transactions for update
  using (household_id = get_my_household_id());

-- Only admin can delete
create policy "admin delete transactions"
  on transactions for delete
  using (household_id = get_my_household_id() and get_my_role() = 'admin');

-- ─── Recurring commitments ────────────────────────────────────────────────────
create policy "household members see recurring"
  on recurring_commitments for select
  using (household_id = get_my_household_id());

create policy "admin manage recurring"
  on recurring_commitments for all
  using (household_id = get_my_household_id() and get_my_role() = 'admin');

-- ─── Monthly obligations ──────────────────────────────────────────────────────
create policy "household members see obligations"
  on monthly_obligations for select
  using (household_id = get_my_household_id());

create policy "members update obligations"
  on monthly_obligations for update
  using (household_id = get_my_household_id());

create policy "admin manage obligations"
  on monthly_obligations for insert delete
  using (household_id = get_my_household_id() and get_my_role() = 'admin');

-- ─── Categorization rules ─────────────────────────────────────────────────────
create policy "household members see rules"
  on categorization_rules for select
  using (household_id = get_my_household_id());

create policy "members upsert rules (learning)"
  on categorization_rules for all
  using (household_id = get_my_household_id());

-- ─── Monthly settlements ──────────────────────────────────────────────────────
create policy "household members see settlements"
  on monthly_settlements for select
  using (household_id = get_my_household_id());

create policy "admin manage settlements"
  on monthly_settlements for all
  using (household_id = get_my_household_id() and get_my_role() = 'admin');

-- ─── Income records ───────────────────────────────────────────────────────────
create policy "admin see income"
  on income_records for select
  using (household_id = get_my_household_id() and get_my_role() = 'admin');

create policy "admin manage income"
  on income_records for all
  using (household_id = get_my_household_id() and get_my_role() = 'admin');

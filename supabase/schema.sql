-- Duit Mahasiswa — Supabase Free (PostgreSQL + RLS)
-- Jalankan di SQL Editor Supabase Dashboard (sekali). Idempotent: safe rerun.
-- Pondasi: text id agar kompatibel dengan data localStorage lama (id 'default' dll)
-- user_id = auth.uid() (uuid) — RLS ketat per akun

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

-- ================= WALLETS =================
create table if not exists wallets (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  balance numeric not null default 0,
  budget_limit numeric,
  icon text not null default 'wallet',
  color text not null default 'blue',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists wallets_updated_at on wallets;
create trigger wallets_updated_at before update on wallets for each row execute function set_updated_at();
create index if not exists wallets_user_id_idx on wallets(user_id);

-- ================= TRANSACTIONS =================
create table if not exists transactions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  amount numeric not null check (amount > 0),
  category_id text not null,
  wallet_id text references wallets(id) on delete set null,
  description text not null default '',
  date timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists transactions_updated_at on transactions;
create trigger transactions_updated_at before update on transactions for each row execute function set_updated_at();
create index if not exists transactions_user_date_idx on transactions(user_id, date desc);
create index if not exists transactions_wallet_idx on transactions(wallet_id);

-- ================= BILLS =================
create table if not exists bills (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null check (amount > 0),
  category text not null,
  due_date timestamptz not null,
  recurrence text check (recurrence in ('weekly','monthly','yearly')),
  status text not null check (status in ('paid','unpaid','overdue')) default 'unpaid',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists bills_updated_at on bills;
create trigger bills_updated_at before update on bills for each row execute function set_updated_at();
create index if not exists bills_user_due_idx on bills(user_id, due_date);

-- ================= HABITS =================
create table if not exists habits (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null default '📝',
  target_per_week int not null default 7 check (target_per_week between 1 and 7),
  created_at timestamptz not null default now()
);
create index if not exists habits_user_idx on habits(user_id);

-- ================= HABIT LOGS =================
create table if not exists habit_logs (
  habit_id text not null references habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  primary key (habit_id, date)
);
create index if not exists habit_logs_user_date_idx on habit_logs(user_id, date);

-- ================= BUDGETS =================
create table if not exists budgets (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id text not null,
  "limit" numeric not null check ("limit" > 0),
  period text not null default 'monthly' check (period = 'monthly'),
  unique (user_id, category_id)
);
create index if not exists budgets_user_idx on budgets(user_id);

-- ================= SAVINGS GOALS =================
create table if not exists savings_goals (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target numeric not null check (target > 0),
  current numeric not null default 0 check (current >= 0),
  deadline timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists savings_goals_user_idx on savings_goals(user_id);

-- ================= RLS =================
alter table wallets enable row level security;
alter table transactions enable row level security;
alter table bills enable row level security;
alter table habits enable row level security;
alter table habit_logs enable row level security;
alter table budgets enable row level security;
alter table savings_goals enable row level security;

do $$ declare r record; begin for r in select policyname, tablename from pg_policies where schemaname='public' loop execute format('drop policy if exists %I on %I', r.policyname, r.tablename); end loop; end $$;

create policy "wallets_select_own" on wallets for select using (auth.uid() = user_id);
create policy "wallets_insert_own" on wallets for insert with check (auth.uid() = user_id);
create policy "wallets_update_own" on wallets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "wallets_delete_own" on wallets for delete using (auth.uid() = user_id);

create policy "tx_select_own" on transactions for select using (auth.uid() = user_id);
create policy "tx_insert_own" on transactions for insert with check (auth.uid() = user_id);
create policy "tx_update_own" on transactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tx_delete_own" on transactions for delete using (auth.uid() = user_id);

create policy "bills_select_own" on bills for select using (auth.uid() = user_id);
create policy "bills_insert_own" on bills for insert with check (auth.uid() = user_id);
create policy "bills_update_own" on bills for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "bills_delete_own" on bills for delete using (auth.uid() = user_id);

create policy "habits_select_own" on habits for select using (auth.uid() = user_id);
create policy "habits_insert_own" on habits for insert with check (auth.uid() = user_id);
create policy "habits_update_own" on habits for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habits_delete_own" on habits for delete using (auth.uid() = user_id);

create policy "hlogs_select_own" on habit_logs for select using (auth.uid() = user_id);
create policy "hlogs_insert_own" on habit_logs for insert with check (auth.uid() = user_id);
create policy "hlogs_delete_own" on habit_logs for delete using (auth.uid() = user_id);

create policy "budgets_select_own" on budgets for select using (auth.uid() = user_id);
create policy "budgets_insert_own" on budgets for insert with check (auth.uid() = user_id);
create policy "budgets_update_own" on budgets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "budgets_delete_own" on budgets for delete using (auth.uid() = user_id);

create policy "goals_select_own" on savings_goals for select using (auth.uid() = user_id);
create policy "goals_insert_own" on savings_goals for insert with check (auth.uid() = user_id);
create policy "goals_update_own" on savings_goals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goals_delete_own" on savings_goals for delete using (auth.uid() = user_id);

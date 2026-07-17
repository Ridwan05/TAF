-- TAF schema setup.
--
-- IMPORTANT: this Supabase project is shared with another application. This
-- script is written to be ADDITIVE ONLY -- it creates TAF's own tables and a
-- helper function, and never touches existing tables, users, or the shared
-- `profiles` table. It creates no triggers on auth.users. Safe to re-run.

-- Enable extensions
create extension if not exists pgcrypto;

-- Partners table
create table if not exists partners (
  id text primary key,
  name text not null,
  currency text,
  "grant" numeric,
  disbursed numeric,
  target_date date,
  purpose text,
  expected_outcome text,
  actual_outcome text,
  utilization_type text
);

-- Additive columns for existing partners tables (safe to re-run).
alter table partners add column if not exists impl_start date;
alter table partners add column if not exists impl_end date;
alter table partners add column if not exists responsible_teams text[] default '{}';

-- Budget lines: the utilization breakdown per partner. The partner's disbursed
-- is the sum of total_used across its lines; remaining is the sum of the left.
create table if not exists budget_lines (
  id uuid default gen_random_uuid() primary key,
  partner_id text references partners(id) on delete cascade,
  activity text,
  currency text,
  taf_type text check (taf_type in ('Refundable','Non-Refundable')),
  total_amount numeric default 0,
  total_used numeric default 0
);

-- Milestones
create table if not exists milestones (
  id uuid default gen_random_uuid() primary key,
  partner_id text references partners(id) on delete cascade,
  text text,
  date date,
  status text
);

-- KPIs
create table if not exists kpis (
  id uuid default gen_random_uuid() primary key,
  partner_id text references partners(id) on delete cascade,
  name text,
  target text,
  current text,
  owner text,
  status text
);

-- Role helper: reads the calling user's role from their JWT. Prefers
-- app_metadata (only settable by admins/service-role) and falls back to
-- user_metadata (where this project's existing roles live). No table access,
-- so it cannot affect or depend on the shared schema.
create or replace function public.taf_user_role()
returns text
language sql
stable
as $$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    ''
  )
$$;

-- Row-Level Security (only on TAF's own tables).
-- Data is publicly readable; writes require an editing role.
alter table partners enable row level security;
alter table milestones enable row level security;
alter table kpis enable row level security;
alter table budget_lines enable row level security;

-- Public read access
drop policy if exists "partners_read" on partners;
create policy "partners_read" on partners for select using (true);
drop policy if exists "milestones_read" on milestones;
create policy "milestones_read" on milestones for select using (true);
drop policy if exists "kpis_read" on kpis;
create policy "kpis_read" on kpis for select using (true);
drop policy if exists "budget_lines_read" on budget_lines;
create policy "budget_lines_read" on budget_lines for select using (true);

-- Write access (insert / update / delete): admin, hr, editor (viewer/ceo read-only)
drop policy if exists "partners_write" on partners;
create policy "partners_write" on partners for all
  to authenticated
  using (public.taf_user_role() in ('admin','hr','editor'))
  with check (public.taf_user_role() in ('admin','hr','editor'));
drop policy if exists "milestones_write" on milestones;
create policy "milestones_write" on milestones for all
  to authenticated
  using (public.taf_user_role() in ('admin','hr','editor'))
  with check (public.taf_user_role() in ('admin','hr','editor'));
drop policy if exists "kpis_write" on kpis;
create policy "kpis_write" on kpis for all
  to authenticated
  using (public.taf_user_role() in ('admin','hr','editor'))
  with check (public.taf_user_role() in ('admin','hr','editor'));
drop policy if exists "budget_lines_write" on budget_lines;
create policy "budget_lines_write" on budget_lines for all
  to authenticated
  using (public.taf_user_role() in ('admin','hr','editor'))
  with check (public.taf_user_role() in ('admin','hr','editor'));

-- Seed sample partners
insert into partners (id,name,currency,"grant",disbursed,target_date,purpose,expected_outcome,actual_outcome,utilization_type)
values
('kfw','KfW Development Bank','USD',1900000,1500000,'2026-08-29','Support InfraCredit''s green bond framework','Pre-investment resulted in financial close for multiple DRE projects.','As at December 2025 these projects have achieved connections to clean electricity.','Green')
on conflict (id) do nothing;

insert into partners (id,name,currency,"grant",disbursed,target_date,purpose,expected_outcome,actual_outcome,utilization_type)
values
('fsd','FSD Africa','EUR',1500000,1000000,'2026-08-29','Support financial inclusion activities.','Transactions reaching financial close in DRE.','Ongoing pipeline development.','Amber')
on conflict (id) do nothing;

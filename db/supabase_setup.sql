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

-- Profiles: one row per auth user, holding their role.
-- Roles: viewer (read only) | editor (can edit data) | admin (can also manage users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'viewer' check (role in ('viewer','editor','admin'))
);

-- Helper: the calling user's role. SECURITY DEFINER so it can read `profiles`
-- without tripping RLS (which would otherwise recurse when used inside a policy).
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- When a new auth user is created, create their profile. The role is taken from
-- the user_metadata `role` set at creation time, defaulting to 'viewer'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'viewer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row-Level Security
-- Enable RLS on all tables. Data is publicly readable; writes require an
-- 'editor' or 'admin' role. Profiles are managed by admins only.
alter table partners enable row level security;
alter table milestones enable row level security;
alter table kpis enable row level security;
alter table profiles enable row level security;

-- Public read access
drop policy if exists "partners_read" on partners;
create policy "partners_read" on partners for select using (true);
drop policy if exists "milestones_read" on milestones;
create policy "milestones_read" on milestones for select using (true);
drop policy if exists "kpis_read" on kpis;
create policy "kpis_read" on kpis for select using (true);

-- Write access (insert / update / delete): editors and admins only
drop policy if exists "partners_write" on partners;
create policy "partners_write" on partners for all
  to authenticated
  using (public.current_user_role() in ('editor','admin'))
  with check (public.current_user_role() in ('editor','admin'));
drop policy if exists "milestones_write" on milestones;
create policy "milestones_write" on milestones for all
  to authenticated
  using (public.current_user_role() in ('editor','admin'))
  with check (public.current_user_role() in ('editor','admin'));
drop policy if exists "kpis_write" on kpis;
create policy "kpis_write" on kpis for all
  to authenticated
  using (public.current_user_role() in ('editor','admin'))
  with check (public.current_user_role() in ('editor','admin'));

-- Profiles: a user can read their own profile; admins can read all.
drop policy if exists "profiles_read" on profiles;
create policy "profiles_read" on profiles for select
  to authenticated
  using (id = auth.uid() or public.current_user_role() = 'admin');
-- Only admins may create/modify/delete profiles (i.e. change roles).
drop policy if exists "profiles_admin_write" on profiles;
create policy "profiles_admin_write" on profiles for all
  to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- Bootstrap the first admin (chicken-and-egg): create the first user in the
-- Supabase dashboard (Authentication > Users), then run the line below once
-- with their email to promote them. After that, admins create users in-app.
--   update public.profiles set role = 'admin' where email = 'you@example.com';

-- Seed sample partners
insert into partners (id,name,currency,"grant",disbursed,target_date,purpose,expected_outcome,actual_outcome,utilization_type)
values
('kfw','KfW Development Bank','USD',1900000,1500000,'2026-08-29','Support InfraCredit''s green bond framework','Pre-investment resulted in financial close for multiple DRE projects.','As at December 2025 these projects have achieved connections to clean electricity.','Green')
on conflict (id) do nothing;

insert into partners (id,name,currency,"grant",disbursed,target_date,purpose,expected_outcome,actual_outcome,utilization_type)
values
('fsd','FSD Africa','EUR',1500000,1000000,'2026-08-29','Support financial inclusion activities.','Transactions reaching financial close in DRE.','Ongoing pipeline development.','Amber')
on conflict (id) do nothing;

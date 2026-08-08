create table if not exists public.organization_product_profiles (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  industry text not null default '', company_size text not null default '1-10', primary_goal text not null default '',
  decision_cadence text not null default 'weekly' check (decision_cadence in ('daily','weekly','monthly')),
  orion_tone text not null default 'executive' check (orion_tone in ('executive','challenger','coach')),
  weekly_brief boolean not null default true, updated_by uuid not null references auth.users(id), updated_at timestamptz not null default now()
);
create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, name text not null check (char_length(name) between 1 and 80),
  properties jsonb not null default '{}', created_at timestamptz not null default now()
);
alter table public.organization_product_profiles enable row level security;
alter table public.product_events enable row level security;
create policy "product_profile_member_read" on public.organization_product_profiles for select to authenticated using (private.is_org_member(organization_id));
create policy "product_profile_admin_insert" on public.organization_product_profiles for insert to authenticated with check (private.has_org_role(organization_id,array['owner','admin']) and updated_by=(select auth.uid()));
create policy "product_profile_admin_update" on public.organization_product_profiles for update to authenticated using (private.has_org_role(organization_id,array['owner','admin'])) with check (private.has_org_role(organization_id,array['owner','admin']) and updated_by=(select auth.uid()));
create policy "product_events_member_insert" on public.product_events for insert to authenticated with check (private.is_org_member(organization_id) and user_id=(select auth.uid()));
create policy "product_events_admin_read" on public.product_events for select to authenticated using (private.has_org_role(organization_id,array['owner','admin']));
create unique index if not exists invitations_pending_email_idx on public.organization_invitations(organization_id,lower(email)) where status='pending';
create index if not exists product_events_org_created_idx on public.product_events(organization_id,created_at desc);
create index if not exists product_profiles_updated_by_idx on public.organization_product_profiles(updated_by);
create index if not exists product_events_user_idx on public.product_events(user_id);

create extension if not exists pgcrypto;
create extension if not exists vector with schema extensions;

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  goal text not null,
  hypothesis text,
  context text,
  impact integer not null default 5 check (impact between 1 and 10),
  urgency integer not null default 5 check (urgency between 1 and 10),
  confidence integer not null default 50 check (confidence between 0 and 100),
  cognitive_cost integer not null default 5 check (cognitive_cost between 1 and 10),
  risk integer not null default 5 check (risk between 1 and 10),
  state text not null default 'explore',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  recommendation text,
  final_decision text not null,
  rationale text not null,
  confidence integer not null default 50,
  created_at timestamptz not null default now()
);

create table if not exists public.cognitive_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  challenge_id uuid references public.challenges(id) on delete cascade,
  type text not null,
  detail text not null,
  created_at timestamptz not null default now()
);

alter table public.challenges enable row level security;
alter table public.decisions enable row level security;
alter table public.cognitive_events enable row level security;

create policy "challenge_owner" on public.challenges for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "decision_owner" on public.decisions for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "event_owner" on public.cognitive_events for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- B9: collaborative, organization-scoped cloud model.
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(), name text not null,
  slug text not null unique, plan text not null default 'team' check (plan in ('demo','team','enterprise')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, display_name text not null default '', email text not null,
  role text not null check (role in ('owner','admin','member','viewer')), status text not null default 'active' check (status in ('active','suspended')),
  joined_at timestamptz not null default now(), unique (organization_id,user_id)
);
create table if not exists public.organization_invitations (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null, role text not null check (role in ('admin','member','viewer')), status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  invited_by uuid not null references public.organization_members(id), created_at timestamptz not null default now(), expires_at timestamptz not null
);
alter table public.challenges add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
create table if not exists public.case_access (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade, member_id uuid not null references public.organization_members(id) on delete cascade,
  access text not null check (access in ('view','comment','edit','manage')), granted_by uuid not null references public.organization_members(id), created_at timestamptz not null default now(), unique(challenge_id,member_id)
);
create table if not exists public.collaboration_comments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade, target_type text not null, target_id text not null,
  author_member_id uuid not null references public.organization_members(id), body text not null check (char_length(body) between 1 and 10000), mentions jsonb not null default '[]',
  resolved_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_member_id uuid not null references public.organization_members(id), action text not null, target_type text not null, target_id text not null,
  challenge_id uuid references public.challenges(id) on delete set null, summary text not null, metadata jsonb not null default '{}', created_at timestamptz not null default now()
);

create or replace function public.is_org_member(org_id uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.organization_members where organization_id=org_id and user_id=(select auth.uid()) and status='active')
$$;
create or replace function public.has_org_role(org_id uuid, allowed_roles text[]) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.organization_members where organization_id=org_id and user_id=(select auth.uid()) and status='active' and role=any(allowed_roles))
$$;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invitations enable row level security;
alter table public.case_access enable row level security;
alter table public.collaboration_comments enable row level security;
alter table public.audit_logs enable row level security;
create policy "organizations_member_read" on public.organizations for select to authenticated using (public.is_org_member(id));
create policy "members_org_read" on public.organization_members for select to authenticated using (public.is_org_member(organization_id));
create policy "members_admin_write" on public.organization_members for all to authenticated using (public.has_org_role(organization_id,array['owner','admin'])) with check (public.has_org_role(organization_id,array['owner','admin']));
create policy "invitations_admin" on public.organization_invitations for all to authenticated using (public.has_org_role(organization_id,array['owner','admin'])) with check (public.has_org_role(organization_id,array['owner','admin']));
create policy "case_access_member_read" on public.case_access for select to authenticated using (public.is_org_member(organization_id));
create policy "case_access_admin_write" on public.case_access for all to authenticated using (public.has_org_role(organization_id,array['owner','admin'])) with check (public.has_org_role(organization_id,array['owner','admin']));
create policy "comments_member_read" on public.collaboration_comments for select to authenticated using (public.is_org_member(organization_id));
create policy "comments_member_insert" on public.collaboration_comments for insert to authenticated with check (public.is_org_member(organization_id) and exists(select 1 from public.organization_members m where m.id=author_member_id and m.user_id=(select auth.uid())));
create policy "comments_author_update" on public.collaboration_comments for update to authenticated using (exists(select 1 from public.organization_members m where m.id=author_member_id and m.user_id=(select auth.uid()))) with check (public.is_org_member(organization_id));
create policy "audit_member_read" on public.audit_logs for select to authenticated using (public.is_org_member(organization_id));
create policy "audit_actor_insert" on public.audit_logs for insert to authenticated with check (public.is_org_member(organization_id) and exists(select 1 from public.organization_members m where m.id=actor_member_id and m.user_id=(select auth.uid())));

create index if not exists organization_members_user_idx on public.organization_members(user_id,organization_id);
create index if not exists comments_case_created_idx on public.collaboration_comments(challenge_id,created_at desc);
create index if not exists audit_org_created_idx on public.audit_logs(organization_id,created_at desc);

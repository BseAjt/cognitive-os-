create extension if not exists pgcrypto;
create extension if not exists vector with schema extensions;
create schema if not exists private;

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
create table if not exists public.workspace_snapshots (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  revision bigint not null default 1 check (revision > 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  updated_by uuid not null references public.organization_members(id),
  updated_at timestamptz not null default now()
);
create or replace function public.save_workspace_snapshot(p_organization_id uuid,p_expected_revision bigint,p_payload jsonb,p_updated_by uuid)
returns table(revision bigint,updated_at timestamptz) language plpgsql security invoker set search_path=public as $$
declare current_revision bigint;
begin
  select ws.revision into current_revision from public.workspace_snapshots ws where ws.organization_id=p_organization_id for update;
  if found and current_revision<>p_expected_revision then raise exception 'workspace revision conflict' using errcode='40001'; end if;
  if not found and p_expected_revision<>0 then raise exception 'workspace revision conflict' using errcode='40001'; end if;
  insert into public.workspace_snapshots(organization_id,revision,payload,updated_by,updated_at)
  values(p_organization_id,coalesce(current_revision,0)+1,p_payload,p_updated_by,now())
  on conflict(organization_id) do update set revision=excluded.revision,payload=excluded.payload,updated_by=excluded.updated_by,updated_at=excluded.updated_at;
  return query select ws.revision,ws.updated_at from public.workspace_snapshots ws where ws.organization_id=p_organization_id;
end $$;

revoke all on function public.save_workspace_snapshot(uuid,bigint,jsonb,uuid) from public, anon;
grant execute on function public.save_workspace_snapshot(uuid,bigint,jsonb,uuid) to authenticated;

create or replace function private.is_org_member(org_id uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.organization_members where organization_id=org_id and user_id=(select auth.uid()) and status='active')
$$;
create or replace function private.has_org_role(org_id uuid, allowed_roles text[]) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.organization_members where organization_id=org_id and user_id=(select auth.uid()) and status='active' and role=any(allowed_roles))
$$;

-- These helpers support RLS without becoming exposed Data API endpoints.
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
revoke all on function private.is_org_member(uuid) from public, anon;
revoke all on function private.has_org_role(uuid,text[]) from public, anon;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.has_org_role(uuid,text[]) to authenticated;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invitations enable row level security;
alter table public.case_access enable row level security;
alter table public.collaboration_comments enable row level security;
alter table public.audit_logs enable row level security;
alter table public.workspace_snapshots enable row level security;
create policy "organizations_member_read" on public.organizations for select to authenticated using (private.is_org_member(id));
create policy "members_org_read" on public.organization_members for select to authenticated using (private.is_org_member(organization_id));
create policy "members_admin_insert" on public.organization_members for insert to authenticated with check (private.has_org_role(organization_id,array['owner','admin']));
create policy "members_admin_update" on public.organization_members for update to authenticated using (private.has_org_role(organization_id,array['owner','admin'])) with check (private.has_org_role(organization_id,array['owner','admin']));
create policy "members_admin_delete" on public.organization_members for delete to authenticated using (private.has_org_role(organization_id,array['owner','admin']));
create policy "invitations_admin" on public.organization_invitations for all to authenticated using (private.has_org_role(organization_id,array['owner','admin'])) with check (private.has_org_role(organization_id,array['owner','admin']));
create policy "case_access_member_read" on public.case_access for select to authenticated using (private.is_org_member(organization_id));
create policy "case_access_admin_insert" on public.case_access for insert to authenticated with check (private.has_org_role(organization_id,array['owner','admin']));
create policy "case_access_admin_update" on public.case_access for update to authenticated using (private.has_org_role(organization_id,array['owner','admin'])) with check (private.has_org_role(organization_id,array['owner','admin']));
create policy "case_access_admin_delete" on public.case_access for delete to authenticated using (private.has_org_role(organization_id,array['owner','admin']));
create policy "comments_member_read" on public.collaboration_comments for select to authenticated using (private.is_org_member(organization_id));
create policy "comments_member_insert" on public.collaboration_comments for insert to authenticated with check (private.is_org_member(organization_id) and exists(select 1 from public.organization_members m where m.id=author_member_id and m.user_id=(select auth.uid())));
create policy "comments_author_update" on public.collaboration_comments for update to authenticated using (exists(select 1 from public.organization_members m where m.id=author_member_id and m.user_id=(select auth.uid()))) with check (private.is_org_member(organization_id));
create policy "audit_member_read" on public.audit_logs for select to authenticated using (private.is_org_member(organization_id));
create policy "audit_actor_insert" on public.audit_logs for insert to authenticated with check (private.is_org_member(organization_id) and exists(select 1 from public.organization_members m where m.id=actor_member_id and m.user_id=(select auth.uid())));
create policy "workspace_member_read" on public.workspace_snapshots for select to authenticated using (private.is_org_member(organization_id));
create policy "workspace_editor_insert" on public.workspace_snapshots for insert to authenticated with check (private.has_org_role(organization_id,array['owner','admin','member']) and exists(select 1 from public.organization_members m where m.id=updated_by and m.user_id=(select auth.uid())));
create policy "workspace_editor_update" on public.workspace_snapshots for update to authenticated using (private.has_org_role(organization_id,array['owner','admin','member'])) with check (private.has_org_role(organization_id,array['owner','admin','member']) and exists(select 1 from public.organization_members m where m.id=updated_by and m.user_id=(select auth.uid())));

create index if not exists organization_members_user_idx on public.organization_members(user_id,organization_id);
create index if not exists comments_case_created_idx on public.collaboration_comments(challenge_id,created_at desc);
create index if not exists audit_org_created_idx on public.audit_logs(organization_id,created_at desc);
create index if not exists workspace_updated_idx on public.workspace_snapshots(updated_at desc);
create index if not exists challenges_user_idx on public.challenges(user_id);
create index if not exists challenges_org_idx on public.challenges(organization_id);
create index if not exists decisions_user_idx on public.decisions(user_id);
create index if not exists decisions_challenge_idx on public.decisions(challenge_id);
create index if not exists cognitive_events_user_idx on public.cognitive_events(user_id);
create index if not exists cognitive_events_challenge_idx on public.cognitive_events(challenge_id);
create index if not exists invitations_org_idx on public.organization_invitations(organization_id);
create index if not exists invitations_invited_by_idx on public.organization_invitations(invited_by);
create index if not exists case_access_org_idx on public.case_access(organization_id);
create index if not exists case_access_member_idx on public.case_access(member_id);
create index if not exists case_access_granted_by_idx on public.case_access(granted_by);
create index if not exists comments_org_idx on public.collaboration_comments(organization_id);
create index if not exists comments_author_idx on public.collaboration_comments(author_member_id);
create index if not exists audit_actor_idx on public.audit_logs(actor_member_id);
create index if not exists audit_challenge_idx on public.audit_logs(challenge_id);
create index if not exists workspace_updated_by_idx on public.workspace_snapshots(updated_by);

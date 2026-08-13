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
create table if not exists public.organization_product_profiles (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  industry text not null default '', company_size text not null default '1-10', primary_goal text not null default '',
  decision_cadence text not null default 'weekly' check (decision_cadence in ('daily','weekly','monthly')),
  orion_tone text not null default 'executive' check (orion_tone in ('executive','challenger','coach')),
  weekly_brief boolean not null default true, updated_by uuid not null references auth.users(id), updated_at timestamptz not null default now()
);

create table if not exists public.user_decision_profiles (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  disc_primary text not null check (disc_primary in ('D','I','S','C')),
  disc_secondary text not null check (disc_secondary in ('D','I','S','C') and disc_secondary <> disc_primary),
  disc_adapted text not null check (disc_adapted in ('D','I','S','C')),
  disc_scores jsonb not null default '{}'::jsonb,
  dimension_scores jsonb not null default '{}'::jsonb,
  assessment_answers jsonb not null default '[]'::jsonb,
  confidence text not null default 'initial' check (confidence in ('initial','emerging','supported','established')),
  evidence_count integer not null default 0 check (evidence_count >= 0),
  source text not null default 'self_assessment' check (source in ('self_assessment','observed','corrected')),
  updated_at timestamptz not null default now(),
  primary key (organization_id,user_id)
);
create table if not exists public.decision_profile_feedback (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, case_id text not null, axis text not null, feedback_kind text not null check (feedback_kind in ('useful','already_considered','more_important','less_important','incorrect','changed_decision')), created_at timestamptz not null default now()
);
create table if not exists public.decision_outcome_followups (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, decision_id text not null, interval_days integer not null check (interval_days in (30,60,90)), due_at timestamptz not null, completed_at timestamptz, execution_status text, measured_result text, determining_axis text, neglected_axis text, created_at timestamptz not null default now(), unique(organization_id,user_id,decision_id,interval_days)
);

create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, name text not null check (char_length(name) between 1 and 80),
  properties jsonb not null default '{}', created_at timestamptz not null default now()
);

-- B10: atomic first-organization bootstrap. This is intentionally callable only
-- by authenticated users and refuses to create a second owner workspace.
create or replace function private.bootstrap_organization_core(p_name text,p_display_name text)
returns table(organization_id uuid,organization_name text,organization_slug text,organization_plan text,organization_created_at timestamptz,member_id uuid,member_joined_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare caller_id uuid := auth.uid(); caller_email text := coalesce(auth.jwt()->>'email',''); new_org public.organizations; new_member public.organization_members; base_slug text;
begin
  if caller_id is null then raise exception 'authentication required' using errcode='42501'; end if;
  if char_length(trim(p_name)) not between 2 and 80 or char_length(trim(p_display_name)) not between 2 and 80 then raise exception 'invalid onboarding input' using errcode='22023'; end if;
  if exists(select 1 from public.organization_members where user_id=caller_id and status='active') then raise exception 'workspace already initialized' using errcode='P0001'; end if;
  base_slug:=trim(both '-' from regexp_replace(lower(trim(p_name)),'[^a-z0-9]+','-','g'));
  if base_slug='' then base_slug:='workspace'; end if;
  insert into public.organizations(name,slug,plan) values(trim(p_name),base_slug||'-'||substr(replace(gen_random_uuid()::text,'-',''),1,8),'team') returning * into new_org;
  insert into public.organization_members(organization_id,user_id,display_name,email,role,status) values(new_org.id,caller_id,trim(p_display_name),caller_email,'owner','active') returning * into new_member;
  return query select new_org.id,new_org.name,new_org.slug,new_org.plan,new_org.created_at,new_member.id,new_member.joined_at;
end $$;
revoke all on function private.bootstrap_organization_core(text,text) from public,anon;
grant execute on function private.bootstrap_organization_core(text,text) to authenticated;

create or replace function public.bootstrap_organization(p_name text,p_display_name text)
returns table(organization_id uuid,organization_name text,organization_slug text,organization_plan text,organization_created_at timestamptz,member_id uuid,member_joined_at timestamptz)
language sql security invoker set search_path='' as $$
  select * from private.bootstrap_organization_core(p_name,p_display_name)
$$;
revoke all on function public.bootstrap_organization(text,text) from public,anon;
grant execute on function public.bootstrap_organization(text,text) to authenticated;
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
alter table public.organization_product_profiles enable row level security;
alter table public.user_decision_profiles enable row level security;
alter table public.decision_profile_feedback enable row level security;
alter table public.decision_outcome_followups enable row level security;
alter table public.product_events enable row level security;
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
create policy "product_profile_member_read" on public.organization_product_profiles for select to authenticated using (private.is_org_member(organization_id));
create policy "product_profile_admin_insert" on public.organization_product_profiles for insert to authenticated with check (private.has_org_role(organization_id,array['owner','admin']) and updated_by=(select auth.uid()));
create policy "product_profile_admin_update" on public.organization_product_profiles for update to authenticated using (private.has_org_role(organization_id,array['owner','admin'])) with check (private.has_org_role(organization_id,array['owner','admin']) and updated_by=(select auth.uid()));
create policy "decision_profile_self_read" on public.user_decision_profiles for select to authenticated using (user_id=(select auth.uid()) and private.is_org_member(organization_id));
create policy "decision_profile_self_insert" on public.user_decision_profiles for insert to authenticated with check (user_id=(select auth.uid()) and private.is_org_member(organization_id));
create policy "decision_profile_self_update" on public.user_decision_profiles for update to authenticated using (user_id=(select auth.uid()) and private.is_org_member(organization_id)) with check (user_id=(select auth.uid()) and private.is_org_member(organization_id));
create policy "decision_feedback_self_all" on public.decision_profile_feedback for all to authenticated using (user_id=(select auth.uid()) and private.is_org_member(organization_id)) with check (user_id=(select auth.uid()) and private.is_org_member(organization_id));
create policy "decision_followup_self_all" on public.decision_outcome_followups for all to authenticated using (user_id=(select auth.uid()) and private.is_org_member(organization_id)) with check (user_id=(select auth.uid()) and private.is_org_member(organization_id));
grant select,insert,update on public.user_decision_profiles to authenticated;
grant select,insert,update on public.decision_profile_feedback to authenticated;
grant select,insert,update on public.decision_outcome_followups to authenticated;
create policy "product_events_member_insert" on public.product_events for insert to authenticated with check (private.is_org_member(organization_id) and user_id=(select auth.uid()));
create policy "product_events_admin_read" on public.product_events for select to authenticated using (private.has_org_role(organization_id,array['owner','admin']));

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
create unique index if not exists invitations_pending_email_idx on public.organization_invitations(organization_id,lower(email)) where status='pending';
create index if not exists product_events_org_created_idx on public.product_events(organization_id,created_at desc);
create index if not exists product_profiles_updated_by_idx on public.organization_product_profiles(updated_by);
create index if not exists product_events_user_idx on public.product_events(user_id);

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

alter table public.user_decision_profiles enable row level security;

create policy "decision_profile_self_read" on public.user_decision_profiles for select to authenticated
using (user_id=(select auth.uid()) and private.is_org_member(organization_id));
create policy "decision_profile_self_insert" on public.user_decision_profiles for insert to authenticated
with check (user_id=(select auth.uid()) and private.is_org_member(organization_id));
create policy "decision_profile_self_update" on public.user_decision_profiles for update to authenticated
using (user_id=(select auth.uid()) and private.is_org_member(organization_id))
with check (user_id=(select auth.uid()) and private.is_org_member(organization_id));

create index if not exists user_decision_profiles_user_idx on public.user_decision_profiles(user_id);

create table if not exists public.decision_profile_feedback (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, case_id text not null, axis text not null, feedback_kind text not null check (feedback_kind in ('useful','already_considered','more_important','less_important','incorrect','changed_decision')), created_at timestamptz not null default now()
);
alter table public.decision_profile_feedback enable row level security;
create policy "decision_feedback_self_all" on public.decision_profile_feedback for all to authenticated using (user_id=(select auth.uid()) and private.is_org_member(organization_id)) with check (user_id=(select auth.uid()) and private.is_org_member(organization_id));

create table if not exists public.decision_outcome_followups (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, decision_id text not null, interval_days integer not null check (interval_days in (30,60,90)), due_at timestamptz not null, completed_at timestamptz, execution_status text, measured_result text, determining_axis text, neglected_axis text, created_at timestamptz not null default now(), unique(organization_id,user_id,decision_id,interval_days)
);
alter table public.decision_outcome_followups enable row level security;
create policy "decision_followup_self_all" on public.decision_outcome_followups for all to authenticated using (user_id=(select auth.uid()) and private.is_org_member(organization_id)) with check (user_id=(select auth.uid()) and private.is_org_member(organization_id));

grant select,insert,update on public.user_decision_profiles to authenticated;
grant select,insert,update on public.decision_profile_feedback to authenticated;
grant select,insert,update on public.decision_outcome_followups to authenticated;

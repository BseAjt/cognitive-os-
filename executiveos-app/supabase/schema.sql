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

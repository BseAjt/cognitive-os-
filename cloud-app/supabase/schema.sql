create extension if not exists pgcrypto;
create extension if not exists vector with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.journeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  description text,
  clarity integer not null default 10 check (clarity between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  journey_id uuid not null references public.journeys(id) on delete cascade,
  source text not null default 'reflection',
  raw_text text not null,
  summary text,
  embedding extensions.vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  memory_id uuid not null references public.memories(id) on delete cascade,
  type text not null check (type in ('fact','hypothesis','argument','decision','question')),
  content text not null,
  approved boolean not null default true,
  confidence numeric(5,2),
  created_at timestamptz not null default now()
);

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  journey_id uuid not null references public.journeys(id) on delete cascade,
  title text not null,
  rationale text,
  confidence integer not null default 70 check (confidence between 0 and 100),
  status text not null default 'active' check (status in ('active','review','closed')),
  review_trigger text,
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  journey_id uuid not null references public.journeys(id) on delete cascade,
  type text not null check (type in ('contradiction','bias','blindspot','question')),
  title text not null,
  evidence_a text,
  evidence_b text,
  clarification_question text,
  confidence integer check (confidence between 0 and 100),
  status text not null default 'open' check (status in ('open','resolved')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists journeys_user_id_idx on public.journeys(user_id);
create index if not exists memories_journey_id_idx on public.memories(journey_id);
create index if not exists decisions_journey_id_idx on public.decisions(journey_id);
create index if not exists reflections_journey_id_idx on public.reflections(journey_id);
create index if not exists memories_embedding_hnsw_idx on public.memories using hnsw (embedding vector_cosine_ops);

alter table public.profiles enable row level security;
alter table public.journeys enable row level security;
alter table public.memories enable row level security;
alter table public.memory_items enable row level security;
alter table public.decisions enable row level security;
alter table public.reflections enable row level security;

create policy "profiles_owner_all" on public.profiles for all to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "journeys_owner_all" on public.journeys for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "memories_owner_all" on public.memories for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "memory_items_owner_all" on public.memory_items for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "decisions_owner_all" on public.decisions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "reflections_owner_all" on public.reflections for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger journeys_touch_updated_at before update on public.journeys for each row execute procedure public.touch_updated_at();
create trigger memories_touch_updated_at before update on public.memories for each row execute procedure public.touch_updated_at();
create trigger decisions_touch_updated_at before update on public.decisions for each row execute procedure public.touch_updated_at();
create trigger reflections_touch_updated_at before update on public.reflections for each row execute procedure public.touch_updated_at();

create extension if not exists pgcrypto;

create table if not exists public.hope_profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null unique,
  secret_hash text not null,
  god text not null,
  path text not null,
  profession text not null default '',
  public_note text not null default '',
  private_note text not null default '',
  talents jsonb not null default '[]'::jsonb,
  ascension_score integer not null default 1000,
  audience_score integer not null default 0,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hope_score_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.hope_profiles(id) on delete cascade,
  target_name text not null,
  ascension_delta integer not null default 0,
  audience_delta integer not null default 0,
  reason text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists hope_profiles_public_rank_idx
  on public.hope_profiles (is_public, ascension_score desc, audience_score desc);

create index if not exists hope_score_logs_profile_idx
  on public.hope_score_logs (profile_id, created_at desc);

alter table public.hope_profiles enable row level security;
alter table public.hope_score_logs enable row level security;

drop policy if exists "public can read public hope profiles" on public.hope_profiles;
create policy "public can read public hope profiles"
  on public.hope_profiles
  for select
  using (is_public = true);

drop policy if exists "no direct public score log read" on public.hope_score_logs;
create policy "no direct public score log read"
  on public.hope_score_logs
  for select
  using (false);

create or replace function public.set_hope_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists hope_profiles_updated_at on public.hope_profiles;
create trigger hope_profiles_updated_at
before update on public.hope_profiles
for each row execute function public.set_hope_profile_updated_at();

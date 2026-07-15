create extension if not exists pgcrypto;

create table if not exists public.hope_profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null unique,
  secret_hash text not null,
  god text not null default '',
  faith_god text not null default '',
  path text not null default '',
  profession text not null default '',
  base_class text not null default '',
  public_note text not null default '',
  private_note text not null default '',
  talents jsonb not null default '[]'::jsonb,
  ascension_score integer not null default 1000,
  audience_score integer not null default 0,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hope_profiles add column if not exists god text not null default '';
alter table public.hope_profiles add column if not exists faith_god text not null default '';
alter table public.hope_profiles add column if not exists path text not null default '';
alter table public.hope_profiles add column if not exists profession text not null default '';
alter table public.hope_profiles add column if not exists base_class text not null default '';
alter table public.hope_profiles add column if not exists public_note text not null default '';
alter table public.hope_profiles add column if not exists private_note text not null default '';
alter table public.hope_profiles add column if not exists talents jsonb not null default '[]'::jsonb;
alter table public.hope_profiles add column if not exists ascension_score integer not null default 1000;
alter table public.hope_profiles add column if not exists audience_score integer not null default 0;
alter table public.hope_profiles add column if not exists is_public boolean not null default true;
alter table public.hope_profiles add column if not exists created_at timestamptz not null default now();
alter table public.hope_profiles add column if not exists updated_at timestamptz not null default now();

update public.hope_profiles
set faith_god = coalesce(nullif(faith_god, ''), nullif(god, ''), '命运'),
    god = coalesce(nullif(god, ''), nullif(faith_god, ''), '命运')
where faith_god = '' or god = '';

create table if not exists public.hope_professions (
  id uuid primary key default gen_random_uuid(),
  profession text not null unique,
  faith_god text not null,
  path text not null,
  base_class text not null check (base_class in ('战士', '法师', '牧师', '刺客', '猎人', '歌者')),
  feature_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hope_base_classes (
  base_class text primary key check (base_class in ('战士', '法师', '牧师', '刺客', '猎人', '歌者')),
  base_hp integer not null,
  base_attack integer not null,
  attack_interval text not null default '1 轮',
  combat_rule text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.hope_base_classes (base_class, base_hp, base_attack, attack_interval, combat_rule)
values
  ('战士', 115, 8, '1 轮', '嘲讽吸引本轮所有攻击，本回合内获得 5 点护盾，CD 3 轮。'),
  ('刺客', 80, 10, '1 轮', '背袭造成 18 点伤害，偷袭间隔 3 轮。普攻和背袭无法同时使用。'),
  ('法师', 80, 5, '1 轮', '火球术召唤 3 个火球，每个对指定敌人造成 8 点伤害，CD 3 轮。火球和普攻无法同时使用。'),
  ('猎人', 80, 7, '1 轮', '三段直接伤害：掷骰 1-2 造成 8 点，3-4 造成 12 点，5-6 造成 16 点。'),
  ('牧师', 105, 2, '1 轮', '治疗术单体 +25 血，CD 3 轮；群体治疗所有友方 +10 血，和治疗术共用 CD。普攻和治疗无法同时发动。'),
  ('歌者', 90, 2, '1 轮', '强化术为一名目标攻击 +8，持续 3 次，CD 4 轮；群体祝福为全队除自己外攻击 +3，持续 3 次，CD 4 轮。强化、祝福和普攻无法同时发动。')
on conflict (base_class) do update
set base_hp = excluded.base_hp,
    base_attack = excluded.base_attack,
    attack_interval = excluded.attack_interval,
    combat_rule = excluded.combat_rule,
    updated_at = now();

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

create index if not exists hope_profiles_profession_idx
  on public.hope_profiles (profession);

create index if not exists hope_profiles_path_rank_idx
  on public.hope_profiles (path, is_public, ascension_score desc, audience_score desc);

create index if not exists hope_score_logs_profile_idx
  on public.hope_score_logs (profile_id, created_at desc);

alter table public.hope_profiles enable row level security;
alter table public.hope_score_logs enable row level security;
alter table public.hope_professions enable row level security;
alter table public.hope_base_classes enable row level security;

drop policy if exists "public can read public hope profiles" on public.hope_profiles;
create policy "public can read public hope profiles"
  on public.hope_profiles
  for select
  using (is_public = true);

drop policy if exists "public can read hope profession library" on public.hope_professions;
create policy "public can read hope profession library"
  on public.hope_professions
  for select
  using (true);

drop policy if exists "public can read hope base classes" on public.hope_base_classes;
create policy "public can read hope base classes"
  on public.hope_base_classes
  for select
  using (true);

drop policy if exists "no direct public score log read" on public.hope_score_logs;
create policy "no direct public score log read"
  on public.hope_score_logs
  for select
  using (false);

create or replace function public.set_hope_updated_at()
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
for each row execute function public.set_hope_updated_at();

drop trigger if exists hope_professions_updated_at on public.hope_professions;
create trigger hope_professions_updated_at
before update on public.hope_professions
for each row execute function public.set_hope_updated_at();

drop trigger if exists hope_base_classes_updated_at on public.hope_base_classes;
create trigger hope_base_classes_updated_at
before update on public.hope_base_classes
for each row execute function public.set_hope_updated_at();

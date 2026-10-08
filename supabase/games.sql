-- Tattva Reels games: run once in Supabase → SQL Editor → New query → Run.
create table if not exists public.games (
  id          text primary key,
  anon        text not null,
  name        text not null,
  title       text not null,
  type        text not null check (type in ('quiz','puzzle')),
  tattva      int  not null check (tattva between 1 and 8),
  settings    jsonb not null default '{}'::jsonb,
  plays       int  not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists games_created_idx on public.games (created_at desc);
create index if not exists games_anon_idx on public.games (anon, created_at);
-- Only the app's server (secret key) can read or write.
alter table public.games enable row level security;
-- Count a play without a read-then-write race.
create or replace function public.game_played(gid text) returns int language sql security definer set search_path = public as
$$ update public.games set plays = plays + 1 where id = gid returning plays; $$;
revoke all on function public.game_played(text) from public, anon, authenticated;
grant execute on function public.game_played(text) to service_role;

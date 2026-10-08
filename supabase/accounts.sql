-- Tattva Reels accounts: real email-code sign-in. Run once in Supabase → SQL Editor → New query → Run.
-- Supabase Auth sends and checks the code; the app's server then keeps its own session (cookie tr_s) in public.sessions.

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  handle      text not null unique check (handle ~ '^[a-z0-9_.]{3,20}$'),
  created_at  timestamptz not null default now()
);

create table if not exists public.sessions (
  token_hash  text primary key,               -- sha256 of the cookie value; the raw token is never stored
  user_id     uuid not null references auth.users(id) on delete cascade,
  email       text not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);
create index if not exists sessions_user_idx on public.sessions (user_id);

create table if not exists public.scores (
  user_id     uuid not null references auth.users(id) on delete cascade,
  game_id     text not null,
  best        int  not null default 0,
  plays       int  not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (user_id, game_id)
);

-- reels and games remember who made them, so they follow the account to every device
alter table public.reels add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists reels_user_idx on public.reels (user_id, created_at desc);
alter table public.games add column if not exists user_id uuid references auth.users(id) on delete set null;

-- the feed view lists reels.*, so it is rebuilt to pick up the new column
drop view if exists public.reel_feed;
create view public.reel_feed with (security_invoker = on) as
  select r.*, (select count(*) from public.learnt l where l.reel_id = r.id)::int as learnt
  from public.reels r;
revoke all on public.reel_feed from anon, authenticated;

create or replace view public.session_view with (security_invoker = on) as
  select s.token_hash, s.user_id, s.email, s.expires_at, p.handle
  from public.sessions s left join public.profiles p on p.id = s.user_id;
revoke all on public.session_view from anon, authenticated;

-- Row level security on, with no policies: only the app's server (secret key) can read or write.
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.scores   enable row level security;

-- Keep a player's best score per game without a read-then-write race.
create or replace function public.record_score(uid uuid, gid text, s int) returns int language sql security definer set search_path = public as
$$ insert into public.scores (user_id, game_id, best, plays) values (uid, gid, greatest(s, 0), 1)
   on conflict (user_id, game_id) do update set best = greatest(scores.best, excluded.best), plays = scores.plays + 1, updated_at = now()
   returning best; $$;
revoke all on function public.record_score(uuid, text, int) from public, anon, authenticated;
grant execute on function public.record_score(uuid, text, int) to service_role;

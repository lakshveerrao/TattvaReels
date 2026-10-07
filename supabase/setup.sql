-- Tattva Reels: run once in Supabase → SQL Editor → New query → Run.

create table if not exists public.reels (
  id          text primary key,
  anon        text not null,
  name        text not null,
  caption     text not null default '',
  style       jsonb not null,
  score       int,
  has_take    boolean not null default false,
  take_offset real not null default 0,
  take_mime   text,
  created_at  timestamptz not null default now()
);
create index if not exists reels_created_idx on public.reels (created_at desc);
create index if not exists reels_anon_idx on public.reels (anon, created_at);

create table if not exists public.learnt (
  reel_id    text not null references public.reels(id) on delete cascade,
  anon       text not null,
  created_at timestamptz not null default now(),
  primary key (reel_id, anon)
);
create index if not exists learnt_anon_idx on public.learnt (anon);

create or replace view public.reel_feed with (security_invoker = on) as
  select r.*, (select count(*) from public.learnt l where l.reel_id = r.id)::int as learnt
  from public.reels r;

-- Row level security on, with no policies: only the app's server (secret key) can read or write.
alter table public.reels  enable row level security;
alter table public.learnt enable row level security;
revoke all on public.reel_feed from anon, authenticated;

-- Private bucket for recorded voices (the server streams them to the app).
insert into storage.buckets (id, name, public, file_size_limit)
values ('takes', 'takes', false, 2000000)
on conflict (id) do nothing;

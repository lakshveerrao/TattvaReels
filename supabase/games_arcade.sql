-- Games become the eight tattva arcade games: allow type 'arcade'. Run once.
alter table public.games drop constraint if exists games_type_check;
alter table public.games add constraint games_type_check check (type in ('quiz','puzzle','arcade'));

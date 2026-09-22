-- Saturday pool play (2 games each), then Sunday bracket.
-- Demo teams can fill a field so directors can test 3–40 without 40 real clubs.

alter table weekends
  add column if not exists pool_play boolean not null default false;

alter table teams
  add column if not exists is_demo boolean not null default false;

alter table games
  add column if not exists pool_index integer;

create index if not exists teams_weekend_demo_idx
  on teams (weekend_id, is_demo);

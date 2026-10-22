-- Team registration waits for Admin approval. Tournament cap defaults to 40.

alter table teams
  add column if not exists status text not null default 'approved';

alter table teams
  drop constraint if exists teams_status_ok;

alter table teams
  add constraint teams_status_ok check (status in ('pending', 'approved', 'denied'));

create index if not exists teams_weekend_status_idx
  on teams (weekend_id, status);

alter table weekends
  add column if not exists max_teams integer not null default 40;

alter table weekends
  drop constraint if exists weekends_max_teams_ok;

alter table weekends
  add constraint weekends_max_teams_ok check (max_teams >= 1 and max_teams <= 40);

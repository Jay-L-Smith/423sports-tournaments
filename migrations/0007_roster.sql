-- 423Sports Tournaments: players on a coach-registered team.

create table if not exists roster_players (
  id serial primary key,
  team_id integer not null,
  name text not null,
  jersey integer not null,
  age_group text not null,
  created_at timestamptz not null default now(),
  constraint roster_players_jersey_ok check (jersey >= 0 and jersey <= 99)
);

create index if not exists roster_players_team_id_idx
  on roster_players (team_id, jersey);

create unique index if not exists roster_players_team_jersey_uidx
  on roster_players (team_id, jersey);

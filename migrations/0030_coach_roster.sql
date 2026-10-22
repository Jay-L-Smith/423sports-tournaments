create table if not exists coach_roster_players (
  id serial primary key,
  team_id integer not null references coach_signup_teams (id) on delete cascade,
  name text not null,
  jersey integer not null,
  birthday date,
  created_at timestamptz not null default now(),
  constraint coach_roster_jersey_ok check (jersey >= 0 and jersey <= 99)
);

create unique index if not exists coach_roster_team_jersey_idx
  on coach_roster_players (team_id, jersey);

alter table coach_roster_players add column if not exists birthday date;

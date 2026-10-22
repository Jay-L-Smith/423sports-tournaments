-- One bracket per age. Games share a calendar. Admin confirms fields.

create table if not exists bracket_seeds (
  weekend_id integer not null,
  age_group text not null,
  seed integer not null,
  team_id integer,
  primary key (weekend_id, age_group, seed)
);

create index if not exists bracket_seeds_team_idx
  on bracket_seeds (team_id);

create table if not exists games (
  id serial primary key,
  weekend_id integer not null,
  age_group text not null,
  round text not null,
  slot integer not null,
  home_seed integer,
  away_seed integer,
  home_team_id integer,
  away_team_id integer,
  home_from_round text,
  home_from_slot integer,
  away_from_round text,
  away_from_slot integer,
  is_bye boolean not null default false,
  location_id integer,
  field_confirmed boolean not null default false,
  start_date date,
  start_time text,
  unique (weekend_id, age_group, round, slot)
);

create index if not exists games_weekend_age_idx
  on games (weekend_id, age_group, round, slot);

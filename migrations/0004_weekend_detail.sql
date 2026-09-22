-- PBI Tournaments: per-age team caps and multiple complexes on a weekend.

create table if not exists weekend_age_groups (
  weekend_id integer not null,
  age_group text not null,
  min_teams integer,
  max_teams integer,
  primary key (weekend_id, age_group),
  constraint weekend_age_min_ok check (min_teams is null or (min_teams >= 1 and min_teams <= 64)),
  constraint weekend_age_max_ok check (max_teams is null or (max_teams >= 1 and max_teams <= 64)),
  constraint weekend_age_range_ok check (
    min_teams is null or max_teams is null or min_teams <= max_teams
  )
);

create table if not exists weekend_locations (
  id serial primary key,
  weekend_id integer not null,
  name text not null,
  address text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists weekend_locations_weekend_id_idx
  on weekend_locations (weekend_id, sort_order);

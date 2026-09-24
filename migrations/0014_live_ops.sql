-- Forfeits, rainouts, live-fill freeze, divisions, scorekeepers.

alter table games
  add column if not exists forfeit text;

alter table games
  add column if not exists rainout boolean not null default false;

alter table games
  add column if not exists score_locked boolean not null default false;

alter table games
  add column if not exists no_contest boolean not null default false;

alter table games
  add column if not exists division_index integer not null default 0;

alter table bracket_seeds
  add column if not exists frozen boolean not null default false;

alter table bracket_seeds
  add column if not exists division_index integer not null default 0;

create table if not exists weekend_scorekeepers (
  id serial primary key,
  weekend_id integer not null,
  user_id text not null,
  email text not null default '',
  scope text not null,
  location_id integer,
  on_date date,
  created_at timestamptz not null default now()
);

create index if not exists weekend_scorekeepers_weekend_idx
  on weekend_scorekeepers (weekend_id);

create table if not exists score_audit (
  id serial primary key,
  game_id integer not null,
  weekend_id integer not null,
  user_id text not null,
  home_score integer,
  away_score integer,
  note text,
  created_at timestamptz not null default now()
);

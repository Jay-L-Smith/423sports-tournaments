-- Coaches the director adds by hand, before or without an app account.

create table if not exists directory_coaches (
  id serial primary key,
  name text not null,
  phone text not null,
  email text not null,
  club text,
  user_id text,
  created_at timestamptz not null default now()
);

create unique index if not exists directory_coaches_email_idx
  on directory_coaches (lower(email));

create table if not exists directory_coach_teams (
  id serial primary key,
  coach_id integer not null references directory_coaches (id) on delete cascade,
  name text not null,
  age_group text not null,
  created_at timestamptz not null default now()
);

create index if not exists directory_coach_teams_coach_idx
  on directory_coach_teams (coach_id, id);

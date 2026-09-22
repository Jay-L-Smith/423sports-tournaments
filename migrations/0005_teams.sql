-- PBI Tournaments: coach-registered teams sit on a tournament + age.

create table if not exists teams (
  id serial primary key,
  weekend_id integer not null,
  age_group text not null,
  name text not null,
  coach_user_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists teams_coach_user_id_idx
  on teams (coach_user_id, created_at desc);

create index if not exists teams_weekend_age_idx
  on teams (weekend_id, age_group);

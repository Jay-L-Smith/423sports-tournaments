-- Club and teams a coach enters when they create an account.

alter table profiles add column if not exists club text;

create table if not exists coach_signup_teams (
  id serial primary key,
  user_id text not null,
  name text not null,
  age_group text not null
);

create index if not exists coach_signup_teams_user_idx
  on coach_signup_teams (user_id, id);

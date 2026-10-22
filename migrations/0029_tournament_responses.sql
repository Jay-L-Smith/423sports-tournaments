-- A coach's answer on an available tournament. Only "interested" adds a team.

create table if not exists tournament_responses (
  id serial primary key,
  weekend_id integer not null references weekends (id) on delete cascade,
  coach_user_id text not null,
  choice text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists tournament_responses_coach_idx
  on tournament_responses (weekend_id, coach_user_id);

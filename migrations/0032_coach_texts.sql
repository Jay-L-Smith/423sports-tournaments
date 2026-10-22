-- Per-age interest on an event, and which coach texts the director already opened.

create table if not exists event_age_responses (
  id serial primary key,
  weekend_id integer not null references weekends (id) on delete cascade,
  coach_user_id text not null,
  age_group text not null,
  choice text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists event_age_responses_idx
  on event_age_responses (weekend_id, coach_user_id, age_group);

create table if not exists coach_text_batches (
  id serial primary key,
  season text not null,
  season_year integer not null,
  weekend_ids text not null,
  created_at timestamptz not null default now()
);

create table if not exists coach_text_opens (
  batch_id integer not null references coach_text_batches (id) on delete cascade,
  coach_user_id text not null,
  opened_at timestamptz not null default now(),
  primary key (batch_id, coach_user_id)
);

create table if not exists login_visits (
  id bigserial primary key,
  user_id text not null,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists login_visits_started_idx on login_visits (started_at desc);
create index if not exists login_visits_user_idx on login_visits (user_id);

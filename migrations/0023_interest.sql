-- Coaches can say a team is interested before the tournament is built.
-- Finalize notices are stored once per director per tournament.

create table if not exists tournament_interest (
  id serial primary key,
  weekend_id integer not null references weekends (id) on delete cascade,
  coach_user_id text not null,
  team_name text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists tournament_interest_team_idx
  on tournament_interest (weekend_id, coach_user_id, lower(btrim(team_name)));

alter table notifications add column if not exists ref_key text;

create unique index if not exists notifications_user_ref_idx
  on notifications (user_id, ref_key)
  where ref_key is not null;

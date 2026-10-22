-- Soft-deleted tournaments. The live row is removed from the schedule immediately.
-- This copy can be restored for 7 days, then it is purged.

create table if not exists deleted_weekends (
  weekend_id integer primary key,
  name text not null,
  start_date date not null,
  end_date date not null,
  deleted_at timestamptz not null default now(),
  payload jsonb not null
);

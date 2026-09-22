-- Each calendar day is pool play, bracket play, or mixed (pool then bracket that day).

alter table weekends
  add column if not exists day_plan jsonb not null default '[]'::jsonb;

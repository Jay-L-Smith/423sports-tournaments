-- PBI Tournaments: tournament weekends (name, dates, age groups).

create table if not exists weekends (
  id serial primary key,
  name text not null,
  start_date date not null,
  end_date date not null,
  age_groups text not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  constraint weekends_dates_ok check (end_date >= start_date)
);

create index if not exists weekends_start_date_idx on weekends (start_date);

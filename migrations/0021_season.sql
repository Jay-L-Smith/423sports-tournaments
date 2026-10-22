-- Season calendar. Existing tournaments stay full (`live`). Only the season picker creates `announced`.

alter table weekends
  add column if not exists lifecycle text not null default 'live';

alter table weekends
  add column if not exists season text;

alter table weekends
  add column if not exists season_year integer;

update weekends set lifecycle = 'live' where lifecycle is null or lifecycle = '';

alter table weekends drop constraint if exists weekends_lifecycle_ok;
alter table weekends
  add constraint weekends_lifecycle_ok check (lifecycle in ('announced', 'live'));

create table if not exists season_windows (
  season text not null,
  season_year integer not null,
  start_date date not null,
  end_date date not null,
  primary key (season, season_year),
  constraint season_windows_dates_ok check (end_date >= start_date),
  constraint season_windows_season_ok check (season in ('spring', 'summer', 'fall'))
);

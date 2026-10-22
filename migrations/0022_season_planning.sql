-- The open calendar year. Archive moves this forward. Older years stay in the tables.
create table if not exists season_planning (
  id integer primary key check (id = 1),
  planning_year integer not null
);

insert into season_planning (id, planning_year)
values (1, 2026)
on conflict (id) do nothing;

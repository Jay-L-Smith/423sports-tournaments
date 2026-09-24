alter table weekend_locations add column if not exists is_primary boolean not null default false;
alter table weekends add column if not exists bracket_locked boolean not null default false;

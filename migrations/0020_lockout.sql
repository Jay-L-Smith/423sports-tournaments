-- Lockout is the drop cutoff. Admin keeps the max-team sheet or rebuilds smaller.

alter table weekends add column if not exists lockout_notified boolean not null default false;
alter table weekends add column if not exists lockout_choice text;
alter table games add column if not exists place_conflict boolean not null default false;

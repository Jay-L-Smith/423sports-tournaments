-- Director-editable travel-ball rules, plus Sunday seeds that wait on Saturday.

alter table weekends
  add column if not exists bracket_rules jsonb not null default '{}'::jsonb;

alter table weekends
  add column if not exists sunday_seeds_locked boolean not null default false;

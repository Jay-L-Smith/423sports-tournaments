-- Admin publishes the sheet parents see. Edits stay private until Push update.

alter table weekends add column if not exists public_sheet text;
alter table weekends add column if not exists public_pushed_at timestamptz;
alter table weekends add column if not exists public_dirty boolean not null default true;

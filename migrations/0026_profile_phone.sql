-- Each account keeps one cell phone. The last 10 digits cannot be reused.

alter table profiles add column if not exists phone text;

create unique index if not exists profiles_phone_last10_idx
  on profiles (right(regexp_replace(phone, '[^0-9]', '', 'g'), 10))
  where phone is not null and length(regexp_replace(phone, '[^0-9]', '', 'g')) >= 10;

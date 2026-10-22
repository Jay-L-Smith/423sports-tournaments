create table if not exists parks (
  id serial primary key,
  name text not null,
  address text not null,
  parking boolean not null default false,
  entrance_fee boolean not null default false,
  chairs_allowed boolean not null default false,
  concessions boolean not null default false,
  restrooms boolean not null default false,
  lights boolean not null default false,
  bleachers boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists parks_identity_idx
  on parks (lower(btrim(name)), lower(btrim(address)));

alter table weekend_locations add column if not exists park_id integer;
alter table weekend_locations add column if not exists parking boolean not null default false;
alter table weekend_locations add column if not exists entrance_fee boolean not null default false;
alter table weekend_locations add column if not exists chairs_allowed boolean not null default false;
alter table weekend_locations add column if not exists concessions boolean not null default false;
alter table weekend_locations add column if not exists restrooms boolean not null default false;
alter table weekend_locations add column if not exists lights boolean not null default false;
alter table weekend_locations add column if not exists bleachers boolean not null default false;

insert into parks (name, address)
select distinct on (lower(btrim(name)), lower(btrim(address))) name, address
from weekend_locations
where not exists (
  select 1 from parks p
  where lower(btrim(p.name)) = lower(btrim(weekend_locations.name))
    and lower(btrim(p.address)) = lower(btrim(weekend_locations.address))
)
order by lower(btrim(name)), lower(btrim(address)), id;

alter table parks add column if not exists canopies boolean not null default false;
alter table parks add column if not exists entrance_price text not null default '';
alter table parks add column if not exists age_discount boolean not null default false;
alter table parks add column if not exists discount_ages text not null default '[]';
alter table parks add column if not exists discount_price text not null default '';

alter table weekend_locations add column if not exists canopies boolean not null default false;
alter table weekend_locations add column if not exists entrance_price text not null default '';
alter table weekend_locations add column if not exists age_discount boolean not null default false;
alter table weekend_locations add column if not exists discount_ages text not null default '[]';
alter table weekend_locations add column if not exists discount_price text not null default '';

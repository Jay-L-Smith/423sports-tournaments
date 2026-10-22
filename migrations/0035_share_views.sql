create table if not exists share_link_views (
  weekend_id integer not null,
  viewer_key text not null,
  first_seen timestamptz not null default now(),
  primary key (weekend_id, viewer_key)
);

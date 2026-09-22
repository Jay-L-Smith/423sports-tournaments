-- PBI Tournaments: role profiles, elevation requests, in-app notifications.

create table if not exists profiles (
  user_id text primary key,
  email text not null,
  requested_role text not null check (requested_role in ('parent', 'athlete', 'coach', 'admin')),
  home_role text not null check (home_role in ('parent', 'athlete', 'coach', 'admin')),
  request_status text not null check (request_status in ('none', 'pending', 'approved', 'denied')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_home_role_idx on profiles (home_role);
create index if not exists profiles_request_status_idx on profiles (request_status);

create table if not exists role_requests (
  id serial primary key,
  user_id text not null,
  email text not null,
  requested_role text not null check (requested_role in ('coach', 'admin')),
  status text not null check (status in ('pending', 'approved', 'denied')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text
);

create index if not exists role_requests_status_idx on role_requests (status);
create index if not exists role_requests_user_id_idx on role_requests (user_id);

create table if not exists notifications (
  id serial primary key,
  user_id text not null,
  title text not null,
  body text not null,
  kind text not null default 'status',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on notifications (user_id, created_at desc);

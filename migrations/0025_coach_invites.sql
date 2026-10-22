-- A text or email asking a coach to create their own account.
-- Accepted only when that person finishes signup from this invite.

create table if not exists coach_invites (
  id serial primary key,
  channel text not null check (channel in ('phone', 'email')),
  destination text not null,
  created_at timestamptz not null default now(),
  accepted_user_id text,
  accepted_at timestamptz
);

create index if not exists coach_invites_created_idx
  on coach_invites (created_at desc);

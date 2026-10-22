-- Private admin note on a coach. Never selected into a coach's own profile.

alter table profiles add column if not exists admin_note text;

-- Coach access requests include team name and a reason for Admin review.

alter table role_requests add column if not exists team_name text;
alter table role_requests add column if not exists reason text;

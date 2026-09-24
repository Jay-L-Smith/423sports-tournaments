-- Game scores for single-elim winner advance and pool standings.

alter table games
  add column if not exists home_score integer,
  add column if not exists away_score integer;

# 423Sports Tournaments — handoff for Grok

**What this is:** a travel-ball baseball tournament app for Ash Lawson / 423Sports (Athens / McMinn, TN). Same owner as PBICamps.com. Built in Grok App Builder. Attach this file **and** the zip (`423sports-source.zip`) in Grok chat so the other Grok can read product intent + source.

**Do not mention competing orgs.** Brand is **423Sports Tournaments**.

Seed admin (never reset, never tell the user to recreate):
- Email: `PBI.Tournaments.Temp@gmail.com`
- Password: `AshLawson`

---

## Current as of 2026-09-24 (read this before the older notes)

The director is the source of truth. Do not restart scope. Do not change clocks, divisions, packing, team lists, or the 72-hour sheet lock unless asked.

- A **2-day** event is **pool on day 1 and bracket on day 2**. Day 1 must not show the next day's games. A stored 2-day "mixed then bracket" plan is read as pool then bracket. 3-day events stay pool, mixed middle, bracket last.
- All-parks knockout sheet shows **that day only**.
- Home warning triangle only if an age, approved teams, or a park is actually missing. An existing bracket is **not** a home warning. The rules page still blocks regenerating pool games while a playable bracket exists.
- Bracket cards: each team's runs sit **large, on the right of that team's name** (winner bold, loser muted). Time and park go **under** the two names, not between them, and not as a combined "8-3" in the gray line. Games with no result stay blank.
- `sheet_lock` is a real column (`migrations/0018_sheet_lock.sql`). Sheet locks 72 hours before first pitch.

Older notes below still describe the product, but where they disagree with this section, this section wins. In particular, do **not** treat a 2-day weekend as Friday pool / Saturday mixed / Sunday bracket.

## What the director wants

Dead simple. Big buttons. Phone-first (landscape for brackets). Hide complexity. One tournament, ages 8U–18U, cap around 40 teams per age. Email + password auth. Parents/athletes get in immediately. Coaches/admins wait for approval.

**Schedule rules (locked by the director):**

1. Pool play = Excel-style **block schedule** (time down the side, fields across the top). Auto-fill suggested days. Pack games **back-to-back** so families are not sitting between games. Keep a pool at **one park on the same day**. Overnight they **may switch parks**.
2. Bracket play = a **real line bracket** (team names on horizontal rules, L/C connectors, two games join into one, left to right, into that park’s last game of the day). Reference look is a classic printed tournament sheet, not stacked cards.
3. Day plan is editable. A 2-day event is pool then bracket (see current rules above). A 3-day event is pool, mixed middle, then bracket.
4. 8am first pitch, 2-hour slots, last start 7pm (can run later on the last day). Early rounds in parallel across parks. Only the **championship** collapses to one field (Tennessee Wesleyan / TWU in the demo).
5. Fill fields. Do **not** glue Saturday to Friday’s park. Maximize games each round. High seeds with byes can play the next round while play-ins are still going. A knockout game cannot start until its feeder game is finished.
6. 1st vs last seeding. Highest seeds get byes when the field is not a power of two (40 teams → 64-slot tree). Min 3 teams for a bracket.
7. Saturday must **not** show Sunday games. Each day / each park is its own sheet ending at that day’s last game.
8. Pool days: All Parks view is one spreadsheet. Knockout days: per-park trees. Mixed Saturday: leftover pool grid **plus** each park’s tree. Do **not** dump the full 64-team bye sheet on Saturday.
9. Pinch-to-zoom on the sheet. No zoom button bar. Day/park filters stay small so the sheet is the page.
10. Admin can tap a cell / field under a game to move it. Pool seeds lock onto the knockout tree after pool play.

---

## Stack

- TanStack Start + Vite + React 19 + Tailwind v4
- Better Auth (email + password)
- PGLite WASM in preview; Postgres on deploy
- React Query v5
- App source lives under `src/`. Product domain code is `src/lib/pbi/`.

---

## Important files (in the zip)

| File | Why it matters |
| --- | --- |
| `src/lib/pbi/bracket.ts` | Engine: pools, stay-on order, pack schedule, line-bracket layout, site trees |
| `src/lib/pbi/bracket.test.ts` | Packing + tree tests (27 passing as of 2026-09-22) |
| `src/lib/pbi/api.ts` | Server functions: weekends, teams, rebuild schedule via `packSchedule` |
| `src/lib/pbi/weekends.ts` | Day plan: pool / mixed / bracket |
| `src/lib/pbi/rules.ts` | Editable tournament rules |
| `src/lib/pbi/demo-teams.ts` | Demo 40-team 15U field for McMinn / TWU |
| `src/components/bracket-board.tsx` | `PoolGrid` (Excel table), `SiteBoard` + `LineBracketTree` (line bracket) |
| `src/components/sheet-zoom.tsx` | Pinch / pan / auto-fit. No zoom chips. |
| `src/routes/bracket.$weekendId.tsx` | Day chips, park chips, All Parks vs one park |
| `src/styles.css` | `.pool-grid`, `.line-bracket`, `.sheet-chip` |
| `src/routes/weekends*.tsx` | Admin create/edit tournament, locations, rules, teams |
| `src/routes/teams*.tsx` | Coach register team + roster |
| `artifacts/PBI/spec.md` | Living spec (slightly behind the UI; trust this handoff + code for brackets) |
| `README.md` | Seed admin + short product summary |

---

## How scheduling works (`packSchedule`)

1. **Pools:** Prefer pools of 4 (then 3). Each team plays **2** pool games. `orderPoolGamesStayOn` chains games so one club stays on the field. `packPoolBlocks` places a consecutive block at one park. If the pool cannot finish that day, leftover games go to the next pool/mixed day at the **least-loaded park that day** (not automatically Friday’s park). Same pool does not hop parks midday.
2. Occupied `(park, date, time)` is shared with knockout.
3. **Knockout:** `packGamesOnGrid` fills the earliest free slot on bracket/mixed days. Prefers the park a team (or feeder game) already used **that same day**. Championship uses the first location only. Feeder constraint: next round starts after the feeder’s slot (+2 hours). Bye teams can play r32 while r64 play-ins are still on other fields.
4. Demo 40 teams / 6 parks / Fri–Sun currently packs roughly:
   - Fri: pool 8am–6pm (fills afternoon, not idle after 2pm)
   - Sat 8am: leftover pool **and** r64 play-ins on the open parks
   - Sat afternoon: r32 / r16
   - Sun: remaining r16, quarters, semis, final (early afternoon, not 10pm)

---

## UI map

- `/` sign-in → role home
- `/join` create account + role
- `/weekends` Admin tournaments
- `/weekends/$id` hub: teams, locations, rules, open bracket
- `/bracket/$id` the sheet: Fri/Sat/Sun × parks / All Parks
- `/teams` coach teams
- `/schedule` public-ish schedule entry

Demo tournament: **McMinn / TWU**, 15U, 40 teams, parks: Tennessee Wesleyan, Athens, Calhoun, Etowah, Englewood, Riceville.

---

## Roles

| Role | After sign-up |
| --- | --- |
| Parent / Athlete | Immediate home |
| Coach / Admin | Parent home until an Admin approves |
| Seed admin above | Admin immediately |

Coach sign-up asks team name + why. Admin Approve/Deny on Notifications. Three deny tries then lock with “Contact PBI Staff”.

---

## What is still rough / director feedback history

The director has been very clear when the bracket was wrong:

- Cards in a straight line ≠ a bracket. Needs a **tree** (2-into-1).
- Pool play is **not** a bracket tree. It is a **block / Excel grid**.
- Saturday first round looking like “a ton of byes” was packing leftover pools onto Friday’s parks and delaying knockout until 4pm. Fixed by filling Friday, allowing overnight park changes, and starting knockout on free fields at 8am.
- Zoom chips cluttered the sheet. Removed. Pinch is enough. Shrink day/park filters.

Not finished / likely next:

- Live scores + standings that reseed Sunday
- Printable white sheet / PDF
- Navigate-to-park links
- Birth certificates / payments
- Capacitor wrap later
- Seed-drag on the line tree (old card `BracketBoard` was removed from the day sheet so Saturday would not show 24 bye cards)

---

## How to help in a new Grok chat

1. Read this file first.
2. Unzip `423sports-source.zip` and open `src/lib/pbi/bracket.ts` + `src/components/bracket-board.tsx` + `src/routes/bracket.$weekendId.tsx`.
3. Do not “improve” the product by adding extra modes. Match the director’s rules above.
4. If changing packing, keep tests in `bracket.test.ts` green, especially stay-on, no collisions, Friday fill, Saturday 8am knockout, overnight park switch allowed.

---

## Seed / demo rebuild

Loading a tournament schedule rebuilds games through `packSchedule` (unconfirmed fields get re-suggested; admin-confirmed fields stay). Demo 40-team 15U is seeded for the McMinn / TWU weekend.

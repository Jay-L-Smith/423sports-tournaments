# 423Sports Tournaments — handoff for Grok

Travel-ball baseball tournament app for Ash Lawson / 423Sports (Athens / McMinn, TN).

**Paste this repo URL into a new Grok chat:**
https://github.com/Jay-L-Smith/423sports-tournaments

Then say: *Read README.md, then src/lib/pbi/bracket.ts, src/components/bracket-board.tsx, and src/routes/bracket.$weekendId.tsx. This is the 423Sports tournament app. Do not invent extra features.*

Brand is **423Sports Tournaments**. Do not mention competing orgs.

## What the director wants

Dead simple. Big buttons. Phone-first (landscape for brackets). Hide complexity. One tournament, ages 8U–18U, cap around 40 teams per age. Email + password auth. Parents/athletes get in immediately. Coaches/admins wait for approval.

**Schedule rules (locked):**

1. Pool play = Excel-style **block schedule** (time down the side, fields across the top). Auto-fill suggested days. Pack games **back-to-back** so families are not sitting between games. Keep a pool at **one park on the same day**. Overnight they **may switch parks**.
2. Bracket play = a **real line bracket** (team names on horizontal rules, L/C connectors, two games join into one, left to right, into that park’s last game of the day). Classic printed tournament sheet, not stacked cards.
3. Days: typically Fri pool, Sat mixed (leftover pool + bracket), Sun bracket. Admin can edit the day plan.
4. 8am first pitch, 2-hour slots, last start 7pm (can run later on the last day). Early rounds in parallel across parks. Only the **championship** collapses to one field (Tennessee Wesleyan / TWU in the demo).
5. Fill fields. Do **not** glue Saturday to Friday’s park. Maximize games each round. High seeds with byes can play the next round while play-ins are still going. A knockout game cannot start until its feeder game is finished.
6. 1st vs last seeding. Highest seeds get byes when the field is not a power of two (40 teams → 64-slot tree). Min 3 teams for a bracket.
7. Saturday must **not** show Sunday games. Each day / each park is its own sheet ending at that day’s last game.
8. Pool days: All Parks view is one spreadsheet. Knockout days: per-park trees. Mixed Saturday: leftover pool grid **plus** each park’s tree. Do **not** dump the full 64-team bye sheet on Saturday.
9. Pinch-to-zoom on the sheet. No zoom button bar. Day/park filters stay small so the sheet is the page.
10. Admin can tap a cell / field under a game to move it. Pool seeds lock onto the knockout tree after pool play.

## Important files

| File | Why |
| --- | --- |
| `src/lib/pbi/bracket.ts` | Engine: pools, stay-on order, pack schedule, line-bracket layout |
| `src/lib/pbi/bracket.test.ts` | Packing + tree tests |
| `src/lib/pbi/api.ts` | Server functions; rebuild schedule via `packSchedule` |
| `src/components/bracket-board.tsx` | PoolGrid (Excel table) + SiteBoard line trees |
| `src/routes/bracket.$weekendId.tsx` | Day chips, park chips, All Parks vs one park |
| `src/styles.css` | `.pool-grid`, `.line-bracket`, `.sheet-chip` |

## How scheduling works

1. **Pools:** Prefer pools of 4 (then 3). Each team plays 2 pool games. `orderPoolGamesStayOn` chains games so one club stays on the field. `packPoolBlocks` places a consecutive block at one park. Leftover games go to the next pool/mixed day at the least-loaded park **that day** (not automatically Friday’s park). Same pool does not hop parks midday.
2. Occupied `(park, date, time)` is shared with knockout.
3. **Knockout:** `packGamesOnGrid` fills the earliest free slot on bracket/mixed days. Prefers the park a team already used **that same day**. Championship uses the first location only. Feeder constraint: next round starts after the feeder’s slot (+2 hours). Bye teams can play r32 while r64 play-ins are still on other fields.

## Demo

McMinn / TWU, 15U, 40 teams. Parks: Tennessee Wesleyan, Athens, Calhoun, Etowah, Englewood, Riceville.

## Note on this repo

This is a **source snapshot** of the live 423Sports tournament app for review in Grok chat. Seed admin credentials are **not** published here.

Start with `src/lib/pbi/bracket.ts` and `src/components/bracket-board.tsx`.

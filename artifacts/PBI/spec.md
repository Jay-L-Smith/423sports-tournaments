# PBI Tournaments — living spec

Travel-ball tournament app for Ash Lawson / PBI in Athens, TN.
Build **one page at a time**. This file is the source of truth.

## Product principles

- Dead simple. Big clear buttons. Mobile-first.
- Hide complexity behind one or two taps.
- No drag-and-drop.
- Consistent UI (current Tailwind tokens + shared components) so a later Capacitor wrap stays coherent.
- Do not invent extra features outside the current page.

## Auth (shipped)

- Email + password sign-up and sign-in.
- Secure password hashing; session cookies.
- Sign out. Refresh keeps session.
- Plain-language validation errors.

## Roles (shipped)

On first open, unauthenticated users see **Sign in**. **What is your role?** only appears when creating an account (`/join`).

| Role | After sign-up |
| --- | --- |
| Parent / Athlete | Immediate role home. No approval. |
| Coach / Admin | Account created. Elevated tools **off** until a current Admin approves. Meanwhile they get **Parent home**, not a dead-end wait screen. |
| Seed `PBI.Tournaments.Temp@gmail.com` / `AshLawson` | Admin immediately, no pending. Created on boot if missing. Password is kept in sync so preview restarts do not strand the director. Comparison is case-insensitive. |
| First Admin fallback | If no Admin exists yet, the first Admin sign-up (any email) is also approved immediately. The seed email is always Admin even after others exist. |

Pending / approved / denied status lives on **Notifications**. Admin home can Approve or Deny. Deny keeps Parent access plus a notice.

Coach sign-up asks two questions first: **What team do you coach?** and **Why are you requesting access?** Admin sees both on the pending card.

If Coach access is denied by accident, the coach can **request again twice** (3 total tries including the first sign-up). Each resubmit asks team + why again. After the third deny, resubmit is locked and the app says **Contact PBI Staff if you believe this was in error.** Parent tools still work.

## Admin tournaments (shipped)

**Route:** `/weekends` (Admin only). Entry: Admin home → **Tournaments**. Create form sits behind **Add Tournament**.

A tournament is the box later pages hang on (team registration, schedule, brackets).

### Create fields

1. **Name** — required. Official title is fine; location is fine if there is no public name (“McMinn / TWU”).
2. **First day** and **Last day** — required. Last day cannot be before first day. Form defaults to this/next Saturday–Sunday.
3. **Age groups** — tap to toggle. At least one. Standard travel-ball: 8U–18U.

### Behavior

- Admin can create a tournament and see the list on the same page.
- Upcoming tournaments sit above past ones.
- Non-admins cannot create or list via the API (`requireAdmin`). Visiting `/weekends` sends them home.

## Data model (locked)

A **tournament** is one event. Last weekend’s real shape: **11 teams, 2 complexes**.

- Teams register to **tournament + age**, never to a complex.
- **Min / max teams** live on each **age group** (15U max 8), not one cap for the whole tournament.
- **Locations** are complexes on that tournament. One tournament can have 1, 2, or more. Each location: short name + street address (address feeds a later Navigate link).
- **Fields** hang under a location later (Field 1, Field 2). They don’t need their own address unless they are a different complex.
- Do not pin an age to one park on day one. Default: all tournament locations are available; the schedule puts games on a field.

## Admin tournament detail (shipped)

**Route:** `/weekends/$weekendId` (Admin only). Entry: tap a saved tournament (create also opens this page).

1. **Teams per age** — each age already on the tournament gets min / max (optional). Empty = no floor/cap. Save caps in one tap.
2. **Locations** — add as many complexes as the tournament uses. Each: short name + street address. Remove is allowed.

## Role homes (shipped shells)

- **Parent:** My athletes (placeholder), Upcoming games (placeholder), Notifications, Account.
- **Athlete:** My team (placeholder), Upcoming games (placeholder), Notifications, Account.
- **Coach (approved):** **My team** (working — register into a tournament), Schedule (placeholder), Enter scores (placeholder), Notifications, Account.
- **Admin (approved or seed):** **Tournaments** (working), Pending coach/admin requests (working), Users list, Notifications, Account.
- **Pending Coach/Admin:** Parent home + Notifications status.

## Out of scope until we say go

Team registration, rosters, birth-certificate verification, brackets, live scores, standings, field/time assignments, push notifications (in-app Notifications for approval status is already in). Do not pin an age to one park yet. No Navigate button yet.

## Coach team registration (shipped)

**Routes:** `/teams` (my teams), `/teams/new` (register), `/teams/$teamId` (that team). Approved Coach only.

1. Pick an upcoming tournament.
2. Pick an age that is still under max (Full ages are disabled).
3. Enter team name. Save.
4. Land on that team: name, age, tournament, parks (read-only).

Teams register to **tournament + age**, not to a park.

## Next page (not started)

**Roster / players on a team** — or Admin seeing who registered. Say which.

## Changelog

- 2026-09-21 — Accounts + role homes MVP.
- 2026-09-21 — Admin weekends page: name, dates, age groups.
- 2026-09-21 — Locked: multiple complexes per weekend; min/max per age; teams register to weekend+age.
- 2026-09-21 — Admin weekend detail: locations + min/max per age.
- 2026-09-21 — Seed Admin `PBI.Tournaments.Temp@gmail.com` / `AshLawson` is created on boot and survives preview restarts.
- 2026-09-21 — Renamed Weekends → Tournaments. Create form is behind Add Tournament.
- 2026-09-21 — Coach team registration: pick tournament + age, name the team.
- 2026-09-21 — Coach access request asks team name and reason; Admin sees both before Approve/Deny.
- 2026-09-21 — Approve/Deny (and other saves) stay on the same screen. No full page load.
- 2026-09-21 — Denied Coach access can be requested again twice, then contact PBI Staff.

